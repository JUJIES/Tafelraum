import { t, useUiLocale } from "../i18n";
import {bindSentenceCheckFrame} from '../canvas/interactive-html-sentence-check';
import {htmlPageProjection} from "../canvas/interactive-html-pages";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Lock } from "lucide-react";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import type { JsonValue, JoinResponse, LiveInteractiveMaterial, LiveMaterialAnnotation } from "../../../../shared/live-canvas/protocol";
import type { RoomInteractiveMaterial } from '../canvas/interactive-html-live';
import {
  getInteractiveHtmlCoverProjection,
  getInteractiveHtmlAnnotationScrollTranslation,
  getInteractiveHtmlContentProjection,
  getInteractiveHtmlSurfaceProjection,
  getInteractiveHtmlTitlebarProjection,
  interactiveHtmlTitlebarHeight,
  interactiveHtmlCornerRadius,
  normalizeInteractiveHtmlContentZoom,
} from "../canvas/interactive-html-embed";

const AppMirrorSurface=lazy(()=>import("./AppMirrorSurface").then(module=>({default:module.AppMirrorSurface})));

function allowed(material:LiveInteractiveMaterial, participant?:JoinResponse) {
  return material.access.mode === 'all' || (material.access.mode === 'participants' && Boolean(participant && material.access.participantIds.includes(participant.participantId)));
}

function MaterialFrame({material,baseUrl,api,participant,onAction,inputReady=true,room=false,playbackOutput=false,onReady}:{material:RoomInteractiveMaterial;baseUrl:string;api:ExcalidrawImperativeAPI;participant?:JoinResponse;onAction?(material:LiveInteractiveMaterial,state:JsonValue,baseState:JsonValue|null):void;inputReady?:boolean;room?:boolean;playbackOutput?:boolean;onReady?(id:string):void}) {
  useUiLocale();
  const iframe = useRef<HTMLIFrameElement>(null); const [,render] = useState(0);
  const contentZoom=room?normalizeInteractiveHtmlContentZoom(material.roomContentZoom??1):1;
  const [roomScroll,setRoomScroll]=useState({x:0,y:0});
  useEffect(()=>{
    if(!room)return;
    const receive=(event:MessageEvent)=>{
      if(event.source!==iframe.current?.contentWindow||event.data?.type!=='tafelraum:interactive-scroll')return;
      const x=event.data.scrollX,y=event.data.scrollY;
      if([x,y].every(value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1_000_000))
        setRoomScroll(previous=>previous.x===x&&previous.y===y?previous:{x,y});
    };
    window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
  },[room]);
  const surfaceRef=useRef<HTMLDivElement>(null);
  useLayoutEffect(()=>{
    if(surfaceRef.current)surfaceRef.current.inert=room&&!inputReady;
    if(room)iframe.current?.contentWindow?.postMessage({type:'tafelraum:interactive-input-enabled',enabled:inputReady},'*');
  },[room,inputReady]);
  const synchronized = useRef(false);
  const lastRoomSubmission=useRef<string|null>(null);
  const roomSubmissions=useRef<string[]>([]);
  const acknowledgedState=useRef<JsonValue|null>(null);
  const applySequence=useRef(0);
  const pendingApplies=useRef(new Map<number,JsonValue>());
  const unlocked = room || allowed(material,participant);
  useEffect(() => api.onScrollChange(() => render(value => value + 1)),[api]);
  useEffect(() => {
    const receive = (event:MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.data?.type !== 'tafelraum:interactive-state') return;
      let text:string;
      try { text=JSON.stringify(event.data.state); } catch { return; }
      const authoritative=JSON.stringify(material.state);
      if (!synchronized.current) {
        if (text === authoritative){synchronized.current=true;acknowledgedState.current=material.state;}
        else sync();
        return;
      }
      if(room&&event.data.origin==='apply'&&typeof event.data.applyId==='number'){
        const applied=pendingApplies.current.get(event.data.applyId);
        if(applied!==undefined){acknowledgedState.current=applied;pendingApplies.current.delete(event.data.applyId);}
      }
      const baseline=room?acknowledgedState.current:material.state;
      if(text===JSON.stringify(baseline)){lastRoomSubmission.current=null;return;}
      if(unlocked && (!room||inputReady)&& (!room||text!==lastRoomSubmission.current) && new TextEncoder().encode(text).byteLength <= 64*1024){
        if(room){lastRoomSubmission.current=text;roomSubmissions.current.push(text);
          if(roomSubmissions.current.length>16)roomSubmissions.current.shift();}
        onAction?.(material,JSON.parse(text) as JsonValue,baseline);
      }
    };
    window.addEventListener('message',receive); return () => window.removeEventListener('message',receive);
  },[material,unlocked,onAction,inputReady]);
  const sync = () => {if(material.state!==null){
    // Acknowledging this output's own paused position must not seek/reload its
    // native media again. A different host state still follows the normal apply.
    if(room&&synchronized.current){
      const text=JSON.stringify(material.state),index=roomSubmissions.current.indexOf(text);
      if(index>=0){
        // Acknowledge in order without applying an older echo over newer typing.
        roomSubmissions.current.splice(0,index+1);
        acknowledgedState.current=material.state;
        if(text===lastRoomSubmission.current)lastRoomSubmission.current=null;
        return;
      }
    }
    const applyId=++applySequence.current;
    if(room)pendingApplies.current.set(applyId,material.state);
    iframe.current?.contentWindow?.postMessage({type:'tafelraum:interactive-apply',state:material.state,applyId,
      ...(room&&synchronized.current?{preserveFocusedValue:true}:{})},'*');
  }};
  // Room frames are structured clones: camera movement gives an unchanged state
  // a new object identity. Reapplying it can pause/restart an HTML player.
  const stateContent=JSON.stringify(material.state);
  useEffect(() => {if(!room)synchronized.current=false;sync();},[material.stateRevision,stateContent]);
  const state = api.getAppState(), zoom = state.zoom.value;
  const style = {left:(material.x+state.scrollX)*zoom,top:(material.y+state.scrollY)*zoom,width:material.width*zoom,height:material.height*zoom,
    "--room-html-titlebar-height": `${getInteractiveHtmlTitlebarProjection(material.height*zoom,zoom,material.roomContentOnly?0:interactiveHtmlTitlebarHeight).viewportHeight}px`,
    "--room-html-radius": `${interactiveHtmlCornerRadius*zoom}px`,
    transform:`rotate(${material.angle}rad)`} as CSSProperties;
  const titlebar=room?getInteractiveHtmlTitlebarProjection(material.height*zoom,zoom,material.roomContentOnly?0:interactiveHtmlTitlebarHeight):null;
  const surface = material.roomPageOrientation ? htmlPageProjection(material.width*zoom,material.height*zoom,material.roomPageOrientation) : room
    ?getInteractiveHtmlContentProjection(material.width*zoom,material.height*zoom,zoom,contentZoom,material.roomContentOnly?0:interactiveHtmlTitlebarHeight)
    :getInteractiveHtmlSurfaceProjection(material.width*zoom,material.height*zoom,zoom,contentZoom);
  const surfaceStyle = {opacity:room&&!inputReady?0.55:undefined,top:titlebar?.viewportHeight??0,width:surface.surfaceWidth,height:surface.surfaceHeight,
    transform:`scale(${surface.scale})`} as CSSProperties;
  const source = room && material.roomSourceUrl ? material.roomSourceUrl
    : `${baseUrl}/${material.bundleId}/${material.entry.split('/').map(encodeURIComponent).join('/')}`;
  const src=room&&playbackOutput&&material.roomPlayback?`${source}?tafelraum-playback=output`:room&&!material.roomPlayback?`${source}?tafelraum-playback=passive`:source;
  const cover = getInteractiveHtmlCoverProjection(material.width*zoom,material.height*zoom,material.cover ?? null);
  useEffect(()=>{
    if(!room||!playbackOutput||cover.fullyCovered||!iframe.current)return;
    return bindSentenceCheckFrame(iframe.current,src);
  },[room,playbackOutput,src,cover.fullyCovered]);
  return <div className={`live-interactive-material${room?' is-borderless-room':''}${unlocked?' is-unlocked':' is-locked'}${cover.fullyCovered?' is-fully-covered':''}`} style={style} data-room-material-id={room?material.roomLocalId:undefined}>
    <div className="live-interactive-material__visibility" style={{clipPath:cover.clipPath}}>
      <div ref={surfaceRef} className="live-interactive-material__surface" style={surfaceStyle} aria-busy={room&&!inputReady||undefined}>
        {room&&material.roomAppChannel?<Suspense fallback={null}><AppMirrorSurface channel={material.roomAppChannel} onReady={()=>onReady?.(material.instanceId)}/></Suspense>:<iframe ref={iframe} src={src} title={material.title} sandbox="allow-scripts"
          allow={room&&playbackOutput&&material.roomPlayback?'fullscreen *':undefined}
          allowFullScreen={Boolean(room&&playbackOutput&&material.roomPlayback)} referrerPolicy="no-referrer" onLoad={()=>{
          if(room){
            iframe.current?.contentWindow?.postMessage({type:'tafelraum:interactive-input-enabled',enabled:inputReady},'*');
            iframe.current?.contentWindow?.postMessage({type:'tafelraum:interactive-room-input'},'*');
          }
          sync();requestAnimationFrame(()=>onReady?.(material.instanceId));
        }}/>}
      </div>
    </div>
    {material.annotations?.length ? <svg className="live-interactive-material__annotations" viewBox={`0 0 ${material.width} ${material.height}`} preserveAspectRatio="none">
      {material.annotations.map((annotation,index) => {
        const anchor=(annotation as LiveMaterialAnnotation & {roomScrollAnchor?:{x:number;y:number}}).roomScrollAnchor;
        const translation=room?getInteractiveHtmlAnnotationScrollTranslation(anchor,roomScroll,contentZoom,material.roomPageOrientation?surface.scale/zoom:undefined):{x:0,y:0};
        return <g key={index} transform={`translate(${translation.x} ${translation.y})`}>{annotation.kind === 'stroke' ? <polyline fill={annotation.fillColor ?? 'none'} opacity={annotation.opacity}
        points={annotation.points.map(point => point.join(',')).join(' ')} stroke={annotation.strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth={annotation.strokeWidth}/>
        : <foreignObject x={annotation.x-annotation.width/2} y={annotation.y-annotation.height/2} width={annotation.width} height={annotation.height}
          opacity={annotation.opacity} transform={`rotate(${annotation.angle*180/Math.PI} ${annotation.x} ${annotation.y})`}>
          <div className="live-interactive-material__annotation-text" style={{color:annotation.color,fontSize:annotation.fontSize,lineHeight:annotation.lineHeight,textAlign:annotation.textAlign}}>{annotation.text}</div>
        </foreignObject>}</g>})}</svg> : null}
    {!room && !unlocked && <div className="live-interactive-material__lock" aria-label={t("Nur ansehen")}><span><Lock aria-hidden="true"/>{t("Nur ansehen")}</span></div>}
  </div>;
}

export function LiveInteractiveMaterialLayer({materials,baseUrl,api,participant,onAction,inputReady=true,room=false,playbackOutput=false,onReady}:{materials:RoomInteractiveMaterial[];baseUrl:string;api:ExcalidrawImperativeAPI;participant?:JoinResponse;onAction?(material:LiveInteractiveMaterial,state:JsonValue,baseState:JsonValue|null):void;inputReady?:boolean;room?:boolean;playbackOutput?:boolean;onReady?(id:string):void}) {
  return <div className="live-interactive-material-layer">{materials.map(material => <MaterialFrame key={material.instanceId} material={material} baseUrl={baseUrl} api={api} participant={participant} onAction={onAction} inputReady={inputReady} room={room} playbackOutput={playbackOutput} onReady={onReady}/>)}</div>;
}

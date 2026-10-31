import { t, useUiLocale } from "../i18n";
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Focus, Tablet, TabletSmartphone, X } from 'lucide-react';
import type { PublicPreview } from './live-host';
import type { HostPointerChannel } from './host-pointer-channel';
import type { Viewport } from '../../../../shared/live-canvas/protocol';
import './student-preview.css';
import './live-viewer.css';
const CanvasViewer=lazy(()=>import('./LiveViewerCanvas'));

function PreviewContent({preview,pointer,room=false}:{preview:PublicPreview;pointer:HostPointerChannel;room?:boolean}) {
  const [prepared,setPrepared]=useState<{scene:PublicPreview['scene'];assets:Record<string,string>}|null>(null);
  useEffect(()=>{
    const urls=Object.fromEntries(preview.assets.map(asset=>[asset.id,URL.createObjectURL(asset.blob)]));
    setPrepared({scene:preview.scene,assets:urls});return()=>{Object.values(urls).forEach(URL.revokeObjectURL);};
  },[preview.assets]);
  if(!prepared)return null;
  // Keep the current safe view mounted while preparing this generation's next
  // blob URLs. Returning null here restarted the engine on every changed tile.
  const scene=preview.scene.assetIds.every(id=>prepared.assets[id])?preview.scene:prepared.scene;
  return <Suspense fallback={null}><CanvasViewer key={room?scene.presentation?.mode:undefined} scene={scene} renderVersion={preview.renderVersion} connected hostConnected publicationReady hostPointer={pointer} presentation={scene.presentation} previewAssets={prepared.assets} materialBaseUrl={preview.materialBaseUrl} room={room} roomMedia={room?preview.roomMedia:null} roomTimers={room?preview.roomTimers:undefined}/></Suspense>;
}
export function StudentPreview({preview,pointer,onClose,onFocus,room=false,screen}:{preview:PublicPreview|null;pointer:HostPointerChannel;onClose():void;onFocus(bounds:Viewport):void;room?:boolean;screen?:{width:number;height:number}|null}) {
  useUiLocale();
  const [landscape,setLandscape]=useState(false), [position,setPosition]=useState<{left:number;top:number}|null>(null);
  const [roomWidth,setRoomWidth]=useState<number|null>(null);
  const windowRef=useRef<HTMLDivElement>(null), drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const moved=useRef(false);
  const previewStyle={...(position??{}),...(preview?{'--student-preview-screen-surface':preview.scene.background}:{}),
    ...(room&&screen?{'--room-preview-ratio':`${screen.width} / ${screen.height}`}:{}),...(roomWidth!==null&&room?{width:roomWidth}:{})} as CSSProperties;
  useEffect(()=>{
    if(room)return;
    const constrain=()=>{const rect=windowRef.current?.getBoundingClientRect();if(rect)setPosition({left:Math.max(8,Math.min(innerWidth-rect.width-8,rect.left)),top:Math.max(8,Math.min(innerHeight-rect.height-8,rect.top))});};
    constrain();window.addEventListener('resize',constrain);return()=>window.removeEventListener('resize',constrain);
  },[landscape,room,screen?.width,screen?.height]);
  useLayoutEffect(()=>{
    if(!room)return;
    const node=windowRef.current;
    if(!node)return;
    const history=document.querySelector<HTMLElement>('.canvas-history-actions');
    const ratio=screen?.width&&screen?.height?screen.width/screen.height:16/9;
    const measure=()=>{
      const historyRect=history?.getBoundingClientRect();
      const preferredTop=Math.max(86,(historyRect?.bottom??74)+12);
      const chromeHeight=(node.querySelector<HTMLElement>('.student-preview-header')?.offsetHeight??48)
        +(node.querySelector<HTMLElement>('.student-preview-caption')?.offsetHeight??35);
      const width=Math.max(1,Math.min(440,innerWidth-24,(innerHeight-preferredTop-8-chromeHeight)*ratio));
      const height=chromeHeight+width/ratio;
      const maxLeft=Math.max(8,innerWidth-width-8),maxTop=Math.max(8,innerHeight-height-8);
      setRoomWidth(width);
      setPosition(current=>{
        const left=current&&moved.current?Math.max(8,Math.min(maxLeft,current.left)):Math.max(8,innerWidth-width-24);
        const overlapsHistory=historyRect&&left<historyRect.right+12&&left+width>historyRect.left-12;
        const minTop=overlapsHistory?preferredTop:8;
        const top=current&&moved.current?Math.max(Math.min(minTop,maxTop),Math.min(maxTop,current.top)):Math.min(preferredTop,maxTop);
        return current&&Math.abs(current.left-left)<.5&&Math.abs(current.top-top)<.5?current:{left,top};
      });
    };
    measure();
    const observer=new ResizeObserver(measure);
    const mutations=new MutationObserver(measure);
    if(history){observer.observe(history);mutations.observe(history,{attributes:true,attributeFilter:['style','class']});history.addEventListener('transitionend',measure);}
    window.addEventListener('resize',measure);
    return()=>{observer.disconnect();mutations.disconnect();history?.removeEventListener('transitionend',measure);window.removeEventListener('resize',measure);};
  },[room,screen?.width,screen?.height]);
  return <div ref={windowRef} className={`student-preview ${room?'is-room':landscape?'is-landscape':''}`} role="region" aria-label={room?t("Raumvorschau"):t("Schülervorschau")} style={previewStyle}>
    <div className="student-preview-header" onPointerDown={event=>{
      if(event.button!==0 || (event.target as Element).closest('button'))return;
      const rect=windowRef.current!.getBoundingClientRect();moved.current=true;drag.current={x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event=>{const d=drag.current;if(!d)return;const rect=windowRef.current!.getBoundingClientRect();
      const left=Math.max(8,Math.min(innerWidth-rect.width-8,d.left+event.clientX-d.x));
      const maxTop=Math.max(8,innerHeight-rect.height-8);
      const history=room?document.querySelector<HTMLElement>('.canvas-history-actions')?.getBoundingClientRect():null;
      const minTop=history&&left<history.right+12&&left+rect.width>history.left-12?Math.min(maxTop,history.bottom+12):8;
      setPosition({left,top:Math.max(minTop,Math.min(maxTop,d.top+event.clientY-d.y))});}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
      <span>{room?t("Raumvorschau"):t("Schülervorschau")}</span>
      <button aria-label={t("Auf Lehrerfläche zentrieren")} title={t("Auf Lehrerfläche zentrieren")} disabled={!preview} onClick={()=>{
        if(!preview)return;
        const presentation=preview.scene.presentation;
        onFocus(presentation?.mode==='clip'&&presentation.clip?presentation.clip:preview.scene.viewport);
      }}><Focus/></button>
      {!room&&<button aria-label={landscape?t("Hochformat"):t("Querformat")} title={landscape?t("Hochformat"):t("Querformat")} onClick={()=>setLandscape(!landscape)}>{landscape?<TabletSmartphone/>:<Tablet/>}</button>}
      <button aria-label={room?t("Raumvorschau schließen"):t("Schülervorschau schließen")} onClick={onClose}><X/></button>
    </div>
    <div className="student-preview-screen">
      {preview ? <div className="student-preview-render" inert><PreviewContent key={preview.scene.generation} preview={preview} pointer={pointer} room={room}/></div> : <div className="student-preview-empty" role="status">{t("Noch keine freigegebene Ansicht")}</div>}
    </div>
    <div className="student-preview-caption">{room?t("Raumbildschirm"):landscape?t("Tablet · Querformat"):t("Tablet · Hochformat")}<span>{room&&screen?`${screen.width} × ${screen.height}`:t("Geteilte Ansicht")}</span></div>
  </div>;
}

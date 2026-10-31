// Isolated synthetic fixture using the real host CanvasSurface and archive persistence.
import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CaptureUpdateAction, convertToExcalidrawElements, sceneCoordsToViewportCoords } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { TimerRuntime } from '../widgets/timer';
import { useLaserTool,LaserToolButton } from './LaserTool';
import { useHostPointer } from './useHostPointer';
import { CanvasSurface } from '../canvas/CanvasSurface';
import { richTextFromNative, styleRichText } from '../canvas/rich-text';
import { canvasBackgrounds } from '../theme-preferences';
import type { CanvasPort, CanvasTool } from '../canvas/canvas-port';
import { LiveCanvasControls, LiveClipTool, useLiveCanvas } from './LiveCanvasControls';
import transportImage from '../assets/demo/transport-set.png';
import '@excalidraw/excalidraw/index.css';
import '../styles.css';
const noop = () => {};
const fixtureLessonId = new URLSearchParams(location.search).get('lesson') || 'synthetic-clips';
const initialFixtureTheme = new URLSearchParams(location.search).get('theme') === 'dark' ? 'dark' : 'light';
document.documentElement.dataset.theme = initialFixtureTheme;
// The in-app test browser closes real popups immediately. Keep the receiver in
// an iframe for the synthetic fixture so the same BroadcastChannel flow can run.
if (new URLSearchParams(location.search).has('inlineRoom')) {
  const openWindow=window.open.bind(window);
  window.open=((url?:string|URL,target?:string,features?:string)=>{
    if(typeof url!=='string'||!url.startsWith('/room.html?'))return openWindow(url,target,features);
    const existing=document.getElementById('clip-fixture-room');
    existing?.remove();
    const frame=document.createElement('iframe');
    frame.id='clip-fixture-room';
    frame.title='Room Canvas Testansicht';
    frame.src=url;
    Object.assign(frame.style,{position:'fixed',right:'8px',top:'75px',width:'400px',height:'300px',zIndex:'9999',border:'2px solid #222'});
    document.body.append(frame);
    let closed=false;
    return {get closed(){return closed;},focus(){},close(){closed=true;frame.remove();}} as Window;
  }) as typeof window.open;
}
function Fixture() {
  const [fixtureTheme,setFixtureTheme]=useState<'light'|'dark'>(initialFixtureTheme);
  useEffect(()=>{document.documentElement.dataset.theme=fixtureTheme;},[fixtureTheme]);
  const [api,setApi] = useState<ExcalidrawImperativeAPI|null>(null), [port,setPort] = useState<CanvasPort|null>(null);
  const [textGeometry,setTextGeometry]=useState('');
  useEffect(()=>api?.onChange((elements,state)=>{
    const text=elements.find(element=>element.id==='resize-text'&&element.type==='text');
    setTextGeometry(text?.type==='text'?JSON.stringify({x:text.x,y:text.y,width:text.width,height:text.height,fontSize:text.fontSize,corner:sceneCoordsToViewportCoords({sceneX:text.x+text.width,sceneY:text.y+text.height},state),runs:(text.customData?.richText as any)?.runs?.map((run:any)=>run.style.fontSize),paragraphs:(text.customData?.richText as any)?.paragraphs}):'');
  }),[api]);
  const [tool,setTool] = useState<CanvasTool>('hand');
  const [temporaryPan,setTemporaryPan] = useState(false);
  const live = useLiveCanvas(api,fixtureLessonId);
  const onTimerRuntimeReady = useCallback((runtime: TimerRuntime | null) => { live.room.attachTimers(runtime); live.host.attachTimers(runtime); }, [live.room, live.host]);
  const addMedia=(kind:'audio'|'video'|'youtube')=>{
    if(!api)return;
    const item=convertToExcalidrawElements([{type:'rectangle',x:kind==='video'?180:10,
      y:kind==='audio'?370:kind==='youtube'?190:150,width:kind==='video'?640:250,
      height:kind==='audio'?88:kind==='youtube'?140:360,
      backgroundColor:'transparent',strokeColor:'transparent',fillStyle:'solid',roughness:0}])[0];
    const customData=kind==='youtube'?{materialKind:kind,sourceTitle:'Test YouTube',videoId:'M7lc1UVf-VE',sourceUrl:'https://www.youtube.com/watch?v=M7lc1UVf-VE'}
      :{materialKind:kind,sourceTitle:kind==='video'?'Testvideo':'Testaudio',sourceFileName:kind==='video'?'test.mp4':'test.mp3',
        sourceLessonId:'synthetic-clips',sourceMaterialPath:`${kind}/test.${kind==='video'?'mp4':'mp3'}`};
    api.updateScene({elements:[...api.getSceneElements(),{...item,customData} as typeof item],
      captureUpdate:CaptureUpdateAction.IMMEDIATELY});
  };
  const coverHtml=(widthRatio:number)=>{
    if(!api)return;
    const elements=api.getSceneElements().filter(element=>element.customData?.role!=='image-cover');
    const target=elements.find(element=>element.customData?.materialKind==='interactive-html');
    if(!target)return;
    const cover=convertToExcalidrawElements([{type:'rectangle',id:'html-cover',x:target.x,y:target.y,
      width:target.width*widthRatio,height:target.height,backgroundColor:'#3e4854',strokeColor:'#3e4854',fillStyle:'solid',roughness:0,
      customData:{role:'image-cover',imageId:target.id,coverRect:{x:0,y:0,width:widthRatio,height:1}}}],{regenerateIds:false})[0];
    api.updateScene({elements:[...elements,cover],captureUpdate:CaptureUpdateAction.IMMEDIATELY});
  };
  const laser = useLaserTool(api,live.creatingClip,temporaryPan);
  useHostPointer(live.host,api,laser.active,'laser','#08a9da',laser.style,laser.channel);
  useEffect(()=>{ Object.assign(window,{clipFixture:{api,host:live.host,room:live.room,port,clipControls:live.clipControls}}); },[api,port,live.host,live.room,live.clipControls]);
  useEffect(()=>{
    const key = (event:KeyboardEvent)=>{
      if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.repeat
        && !(event.target instanceof Element && event.target.closest('input,textarea,[contenteditable="true"]'))
        && /^[1-9]$/.test(event.key) && live.clipControls.addSelected.current?.(+event.key)) {
        event.preventDefault();event.stopImmediatePropagation();return;
      }
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat || (event.target instanceof Element && event.target.closest('input,textarea,[contenteditable="true"]'))) return;
      if (/^[1-9]$/.test(event.key) && live.clipControls.shortcut.current?.(+event.key)) {event.preventDefault();event.stopImmediatePropagation();}
    };
    window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);
  },[live.clipControls.shortcut,live.clipControls.addSelected]);
  return <div className="app-shell" data-theme={fixtureTheme}>
    <header style={{display:'flex',alignItems:'center',gap:8,padding:12,height:70}}>
      <button onClick={()=>setFixtureTheme(theme=>theme==='dark'?'light':'dark')}>Theme wechseln</button>
      <LaserToolButton laser={laser} disabled={!api}/><LiveClipTool live={live}/><LiveCanvasControls live={live}/>
      <button onClick={()=>api?.updateScene({elements:convertToExcalidrawElements([
        {type:'rectangle',x:100,y:100,width:330,height:470,backgroundColor:'#ffffff',strokeColor:'#7a8995',fillStyle:'solid',roughness:0},
        {type:'text',x:125,y:155,text:'Arbeitsblatt 1\n\nDescribe the picture.\n\nCompare your ideas.',fontFamily:2,fontSize:22},
        {type:'rectangle',x:520,y:100,width:330,height:470,backgroundColor:'#ffffff',strokeColor:'#7a8995',fillStyle:'solid',roughness:0},
        {type:'text',x:545,y:155,text:'Arbeitsblatt 2\n\nFind three examples.',fontFamily:2,fontSize:22},
        {type:'rectangle',x:940,y:100,width:330,height:470,backgroundColor:'#fff0f0',fillStyle:'solid',roughness:0},
        {type:'text',x:965,y:155,text:'SPÄTERER INHALT\n\nAußerhalb des Clips.',fontFamily:2,fontSize:24},
      ]),appState:{scrollX:0,scrollY:0,zoom:{value:1 as any}},captureUpdate:CaptureUpdateAction.IMMEDIATELY})}>Testinhalt</button>
      <button onClick={async()=>{
        if(!port)return;
        const blob=await (await fetch(transportImage)).blob();
        const dataUrl=await new Promise<string>((resolve,reject)=>{
          const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);
        });
        await port.placeImages([{id:crypto.randomUUID(),dataUrl,mimeType:'image/png',pixelWidth:640,pixelHeight:427,
          source:{fileName:'Testbild.png',kind:'image'}}],{clientX:330,clientY:310});
      }}>Testbild</button>
      <button onClick={()=>port?.placeInteractiveHtml({
        archiveMaterialPath:'_unassigned/stunden/synthetic-clips/material/interaktiv/live-canvas-html',
        id:'live-canvas-html',title:'Gemeinsame Aufgabe',lessonId:'synthetic-clips',entry:'index.html',
        print:null,defaultViewport:{width:600,height:448},
      },{clientX:330,clientY:310})}>Test-HTML</button>
      <button onClick={()=>coverHtml(1)}>HTML ganz abdecken</button>
      <button onClick={()=>coverHtml(0.5)}>HTML halb abdecken</button>
      <button onClick={()=>setTool('pen')}>Stift</button><button onClick={()=>setTool('marker')}>Marker</button><button onClick={()=>setTool('hand')}>Hand</button>
      <button onClick={()=>setTool('selection')}>Auswahl</button>
      <button onClick={()=>setTool('eraser')}>Radierer</button>
      <button onClick={()=>{
        if(!api)return;
        const text=convertToExcalidrawElements([{type:'text',id:'resize-text',x:100,y:120,
          text:new URLSearchParams(location.search).has('paragraphText')?'Überschrift\nDieser Absatz bleibt linksbündig und bricht bei schmalerer Textbox automatisch um.\nEin weiterer Absatz zur getrennten Ausrichtung.':'Ein längerer Text in einer Textbox. Wir vergleichen unsere Antworten und erklären, weshalb die gewählte Lösung passt. Beim Vergrößern sollen alle Zeilen und ihre Formatierung gemeinsam wachsen.',
          width:420,fontSize:24,fontFamily:2,autoResize:false}],{regenerateIds:false})[0];
        if(text.type!=='text')return;
        const base=richTextFromNative(text);
        const rich=new URLSearchParams(location.search).has('mixedText')?styleRichText(base,0,24,{fontSize:36,italic:true}):base;
        const selected={...text,width:420,autoResize:false,customData:{richText:{...rich,runs:rich.runs.map(run=>({...run,style:{...run.style,underline:true}}))}}};
        api.updateScene({elements:[selected],appState:{scrollX:0,scrollY:0,zoom:{value:1 as any},selectedElementIds:{[text.id]:true}},captureUpdate:CaptureUpdateAction.IMMEDIATELY});
        setTool('selection');
      }}>Lange Textbox</button>
      <button onClick={()=>addMedia('audio')}>Testaudio</button><button onClick={()=>addMedia('video')}>Testvideo</button>
      <button onClick={()=>addMedia('youtube')}>Test-YouTube</button>
      {live.state.session && <a href={`${live.state.session.baseUrl}/join/${live.state.session.inviteId}`}>Teilnehmer öffnen</a>}
      {live.roomState.active && <span data-testid="room-channel">{(live.room as unknown as {channelId:string}).channelId}</span>}
    </header>
    <output data-testid="text-geometry" style={{position:'fixed',bottom:0,left:0,zIndex:20,background:'white',color:'black'}}>{textGeometry}</output>
    <div style={{position:'absolute',inset:'70px 0 0'}}>
      <CanvasSurface activeShape="rectangle" activeTool={tool} canvasBackgroundColor={canvasBackgrounds[fixtureTheme].calm} lessonId={fixtureLessonId} lessonSeed={{prompt:'',showTransportImage:false}}
        markerColor="#ffff00" markerStrokeWidth={20} materialShadows={false} onMaterialUsageChange={noop} onTimerRuntimeReady={onTimerRuntimeReady} onPortReady={setPort} onLiveApiReady={setApi}
        onLiveInkPreviewChange={live.host.setInkPreview}
        onShapeColorChange={noop} onShapeFillChange={noop} onTemporaryPanChange={setTemporaryPan} onToolChange={setTool} onZoomChange={noop}
        penColor="#000000" penStrokeWidth={2} shapeColor="#000000" shapeFill="empty" theme={fixtureTheme} clipControls={live.clipControls} laserControls={laser} interactiveLiveControls={live.interactiveControls} materialControls={live.materialControls}/>
    </div>
  </div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);

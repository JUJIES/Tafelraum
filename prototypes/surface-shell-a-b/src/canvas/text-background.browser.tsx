// Isolated fixture; run scripts/live-canvas-browser-check.mjs --clips.
import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import type {ExcalidrawImperativeAPI} from '@excalidraw/excalidraw/types';
import {CanvasSurface} from './CanvasSurface';
import type {CanvasPort,CanvasTheme,CanvasTool} from './canvas-port';
import '@excalidraw/excalidraw/index.css';
import '../styles.css';
const noop=()=>{};
function Fixture(){
 const [api,setApi]=useState<ExcalidrawImperativeAPI|null>(null),[port,setPort]=useState<CanvasPort|null>(null);
 const [theme,setTheme]=useState<CanvasTheme>('dark'),[tool,setTool]=useState<CanvasTool>('selection'),[result,setResult]=useState('');
 const [inkColor,setInkColor]=useState('#111111');
 document.documentElement.dataset.theme=theme;
 function selectInk(kind:'pen'|'marker',color='#111111'){setInkColor(color);setTool(kind);port?.selectTool(kind,{theme,markerColor:'#ffff00',markerStrokeWidth:20,penColor:color,penStrokeWidth:2,shape:'rectangle',shapeColor:'#111111',shapeFill:'empty'});}
 async function insert(dark:boolean){
  if(!port)return;const canvas=document.createElement('canvas');canvas.width=700;canvas.height=400;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle=dark?'#151515':'#ffffff';ctx.fillRect(0,0,700,400);
  ctx.fillStyle=dark?'#ffffff':'#111111';ctx.font='24px sans-serif';ctx.fillText(dark?'Dunkles Material':'Helles Arbeitsblatt',35,50);
  await port.placeImages([{id:crypto.randomUUID(),dataUrl:canvas.toDataURL(),mimeType:'image/png',pixelWidth:700,pixelHeight:400,source:{kind:'pdf-page',fileName:'Kontrast.pdf'}}],{clientX:540,clientY:330});
 }
 return <div className="app-shell"><header style={{height:70,display:'flex',gap:12,padding:10,position:'relative',zIndex:30}}>
  <button onClick={()=>insert(false)}>Helles Blatt</button><button onClick={()=>insert(true)}>Dunkles Blatt</button>
  <button onClick={()=>selectInk('pen')}>Stift</button><button onClick={()=>selectInk('pen','#2f6f92')}>Blauer Stift</button><button onClick={()=>selectInk('marker')}>Marker</button>
  <button onClick={()=>{setTool('text');port?.selectTool('text',{theme,markerColor:'#ffff00',markerStrokeWidth:20,penColor:'#111111',penStrokeWidth:2,shape:'rectangle',shapeColor:'#111111',shapeFill:'empty'});}}>Text</button>
  <button onClick={()=>port?.placeInteractiveHtml({archiveMaterialPath:'fixture/material/interaktiv/paper/manifest.json',id:'paper',title:'Weißes HTML-Material (Geometrieprüfung)',lessonId:'synthetic-pen-background-v1',entry:'index.html',print:null,defaultViewport:{width:700,height:400}},{clientX:540,clientY:330})}>HTML-Geometrie</button>
  <button onClick={()=>setTheme(theme==='dark'?'light':'dark')}>Theme wechseln</button>
  <button onClick={async()=>{await port?.flushPersistence();setResult(JSON.stringify(api?.getSceneElements().flatMap(e=>!e.isDeleted&&(e.type==='text'||e.type==='freedraw'||e.customData?.role==='marker-ribbon')?[{kind:e.type,color:e.strokeColor,fill:e.backgroundColor,groups:e.groupIds}]:[])));}}>Prüfen und speichern</button>
 </header><output style={{position:'fixed',bottom:10,left:20,zIndex:20,color:theme==='dark'?'white':'black'}}>{result}</output>
 <div style={{position:'absolute',inset:'70px 0 50px'}}><CanvasSurface activeShape="rectangle" activeTool={tool} lessonId="synthetic-pen-background-v1" lessonSeed={{prompt:'',showTransportImage:false}}
  markerColor="#ffff00" markerStrokeWidth={20} materialShadows={false} onMaterialUsageChange={noop} onPortReady={setPort} onLiveApiReady={setApi} onShapeColorChange={noop} onShapeFillChange={noop} onTemporaryPanChange={noop} onToolChange={setTool} onZoomChange={noop}
  penColor={inkColor} penStrokeWidth={2} shapeColor="#111111" shapeFill="empty" theme={theme}/></div></div>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);

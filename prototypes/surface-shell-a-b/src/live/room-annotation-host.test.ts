import assert from 'node:assert/strict';
import {mock,test} from 'node:test';
import {withoutTemporaryEraserState,withTemporaryEraserState} from '../canvas/eraser-policy.ts';
const viewport={x:0,y:0,width:800,height:600};
let source:any[]=[];
mock.module('@excalidraw/excalidraw',{namedExports:{CaptureUpdateAction:{NEVER:'never'},newElementWith:(e:any,p:any)=>({...e,...p,version:e.version+1})}});
mock.module('@tauri-apps/api/core',{namedExports:{isTauri:()=>false,invoke:async()=>undefined}});
mock.module('@tauri-apps/api/event',{namedExports:{listen:async()=>()=>undefined}});
mock.module(new URL('../canvas/image-annotation-groups.ts',import.meta.url).href,{namedExports:{attachNewAnnotationsToCanvasTargets:(elements:any[])=>({elements})}});
mock.module(new URL('../canvas/interactive-html-live.ts',import.meta.url).href,{namedExports:{
 prepareHtmlPlaybackRoom:async()=>{},setHtmlPlaybackRoomActive:()=>{},
 showInteractiveHtmlRoomFocus:()=>undefined,getInteractiveHtmlFocus:()=>null,getInteractiveHtmlScroll:()=>({x:0,y:0}),getInteractiveHtmlState:()=>null,
 subscribeInteractiveHtmlFocus:()=>()=>undefined,subscribeInteractiveHtmlScroll:()=>()=>undefined,
 subscribeHtmlPlayback:()=>()=>undefined,reportHtmlPlayback:()=>undefined}});
mock.module(new URL('./public-projection.ts',import.meta.url).href,{namedExports:{getPublicViewport:()=>viewport,createPublicProjector:()=>({stop(){},project:async()=>({
 elements:[],assets:[],assetIds:[],materials:[{instanceId:'html',roomLocalId:'page'}],materialBundles:[],unsupported:[],viewport,background:'#fff',
 roomObjects:withoutTemporaryEraserState(source).filter(e=>!e.isDeleted).map(e=>({id:`public_${e.id}`,sourceId:e.id,version:e.version,type:e.type,
 x:e.x,y:e.y,width:e.width,height:e.height,angle:e.angle,erasable:e.type==='line'}))})})}});
mock.module(new URL('./room-media.ts',import.meta.url).href,{namedExports:{isRoomMediaElement:()=>false,roomMediaFromElement:()=>null}});
mock.module(new URL('./room-ink.ts',import.meta.url).href,{namedExports:{roomInkElement:()=>null,validRoomInkCommand:()=>false}});
const {RoomCanvasHost}=await import('./room-canvas-host.ts');
class Channel{
 static current:Channel;sent:any[]=[];onmessage:((event:{data:any})=>void)|null=null;
 readonly name:string;constructor(name:string){this.name=name;Channel.current=this;}
 postMessage(data:any){this.sent.push(data);}close(){}
 receive(data:any){this.onmessage?.({data:{...data,channel:this.name.replace('tafelraum-room-','')}});}
}
const wait=async(predicate:()=>boolean)=>{for(let i=0;i<100&&!predicate();i++)await new Promise(resolve=>setTimeout(resolve,10));assert.ok(predicate(),'Room did not settle');};
test('real Room command path preserves sheet/ink binding with active teacher eraser, rejects stale edits, and undoes canonical state',async()=>{
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldChannel=globalThis.BroadcastChannel;
 Object.defineProperty(globalThis,'window',{configurable:true,value:{open:()=>({closed:false,focus(){},close(){}})}});globalThis.BroadcastChannel=Channel as any;
 const group='tafelraum-image-annotations:page';
 const page={id:'page',type:'rectangle',version:1,x:0,y:0,width:100,height:200,angle:0,isDeleted:false,locked:false,groupIds:[group],customData:{materialKind:'interactive-html'}};
 const ink={...page,id:'ink',type:'line',x:20,y:20,width:20,height:10,points:[[0,0],[20,10]],customData:{role:'marker-ribbon'}};
 source=[...withTemporaryEraserState([page,ink])];const listeners=new Set<()=>void>();
 const api={getSceneElements:()=>source.filter(e=>!e.isDeleted),getSceneElementsIncludingDeleted:()=>source,getFiles:()=>({}),
 getAppState:()=>({...viewport,scrollX:0,scrollY:0,zoom:{value:1},viewBackgroundColor:'#fff',activeTool:{type:'eraser'}}),
 onChange:(fn:()=>void)=>{listeners.add(fn);return()=>listeners.delete(fn);},onScrollChange:()=>()=>undefined,
 updateScene:({elements}:any)=>{source=elements;listeners.forEach(fn=>fn());}};
 const host=new RoomCanvasHost();
 try{
  host.attach(api as any,'lesson');await host.start();const channel=Channel.current;channel.receive({type:'ready',width:800,height:600});
  const frame=async()=>{await wait(()=>channel.sent.some(m=>m.type==='frame'));return channel.sent.filter(m=>m.type==='frame').at(-1);};
  let shown=await frame();channel.receive({type:'shown',generation:shown.scene.generation,revision:shown.scene.revision});
  const edit=(id:string,geometry:any,patch={})=>channel.receive({type:'object-edit',generation:shown.scene.generation,revision:shown.scene.revision,target:{mode:'free',id:null},
   action:'transform',objects:[{id:`public_${id}`,version:source.find(e=>e.id===id).version}],geometry,htmlScroll:[{materialId:'page',offset:{x:0,y:0}}],...patch});
  edit('page',{...page,x:100});await wait(()=>source.find(e=>e.id==='ink').x===120);
  assert.deepEqual(withoutTemporaryEraserState(source).find(e=>e.id==='ink')!.groupIds,[group]);
  assert.ok(source.find(e=>e.id==='ink').customData.tafelraumEraserImageGroupIds);
  // The command handler itself, not just a transform helper, records canonical history.
  channel.receive({type:'history',generation:shown.scene.generation,action:'undo'});await wait(()=>source.find(e=>e.id==='ink').x===20);
  channel.receive({type:'history',generation:shown.scene.generation,action:'redo'});await wait(()=>source.find(e=>e.id==='ink').x===120);
  const saved=withoutTemporaryEraserState(source);assert.equal(saved[1].locked,false);assert.ok(!JSON.stringify(saved).includes('tafelraumEraser'));
  await wait(()=>channel.sent.filter(m=>m.type==='frame').at(-1).scene.revision>shown.scene.revision);
  shown=await frame();channel.receive({type:'shown',generation:shown.scene.generation,revision:shown.scene.revision});
  edit('ink',{...ink,x:250});await wait(()=>withoutTemporaryEraserState(source).find(e=>e.id==='ink')!.groupIds.length===0);
  const before=JSON.stringify(source),errorCount=channel.sent.filter(m=>m.type==='object-error').length;
  edit('ink',{...ink,x:140},{revision:Math.max(1,shown.scene.revision-1)});await wait(()=>channel.sent.filter(m=>m.type==='object-error').length>errorCount);
  assert.equal(JSON.stringify(source),before,'stale Room commands cannot alter canonical or temporary state');
 }finally{host.dispose();globalThis.BroadcastChannel=oldChannel;if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete (globalThis as any).window;}
});

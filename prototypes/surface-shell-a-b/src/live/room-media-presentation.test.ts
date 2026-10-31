import {getRoomVideoStatus,sendRoomVideoCommand} from './room-video-status.ts';
import assert from 'node:assert/strict';
import test, {mock} from 'node:test';
import type {ExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import type {RoomTarget} from './room-canvas-host';
import {roomTargetContainsMedia,roomTargetMedia} from './room-media-presentation.ts';
const video={id:'video-1',type:'rectangle',version:1,isDeleted:false,x:100,y:100,width:640,height:360,angle:0,groupIds:[],
  customData:{materialKind:'video',sourceTitle:'Test',sourceLessonId:'lesson-1',sourceMaterialPath:'material/test.mp4'}} as unknown as ExcalidrawElement;
const crop:RoomTarget={kind:'clip',clip:{id:'clip-2',number:2,x:250,y:120,width:300,height:220}};
test('Play retains a partially visible video crop, excluding unrelated, deleted and audio targets',()=>{
  assert.equal(roomTargetContainsMedia(crop,video),true);
  assert.equal(roomTargetContainsMedia(crop,{...video,x:900}),false);
  assert.equal(roomTargetContainsMedia(crop,{...video,isDeleted:true}),false);
  assert.equal(roomTargetContainsMedia(crop,{...video,customData:{materialKind:'audio'}}),false);
  assert.equal(roomTargetContainsMedia({kind:'canvas'},video),false);
  assert.equal(roomTargetContainsMedia({kind:'material',id:video.id,title:'Test'},video),true);
  assert.equal(roomTargetMedia([video,{...video,id:'video-2'}],crop,'video-2')?.id,'video-2');
});
mock.module('@excalidraw/excalidraw',{namedExports:{CaptureUpdateAction:{NEVER:'never'},newElementWith:(element:object,update:object)=>({...element,...update}),convertToExcalidrawElements:(values:unknown[])=>values}});
mock.module(new URL('./public-projection.ts',import.meta.url).href,{namedExports:{
  getPublicViewport:()=>({x:0,y:0,width:1000,height:800}),
  createPublicProjector:()=>({stop:()=>{},project:async()=>({elements:[],assets:[],assetIds:[],materials:[],roomObjects:[],background:'#fff'})}),
}});
mock.module(new URL('../canvas/interactive-html-live.ts',import.meta.url).href,{namedExports:{prepareHtmlPlaybackRoom:async()=>{},setHtmlPlaybackRoomActive:()=>{},showInteractiveHtmlRoomFocus:()=>{},getInteractiveHtmlFocus:()=>null,getInteractiveHtmlScroll:()=>({x:0,y:0}),getInteractiveHtmlState:()=>null,subscribeInteractiveHtmlFocus:()=>()=>{},subscribeInteractiveHtmlScroll:()=>()=>{},subscribeHtmlPlayback:()=>()=>{},reportHtmlPlayback:()=>{}}});
mock.module(new URL('../canvas/image-annotation-groups.ts',import.meta.url).href,{namedExports:{attachNewAnnotationsToCanvasTargets:(elements:unknown[])=>({elements})}});
const {RoomCanvasHost}=await import('./room-canvas-host.ts');
class Channel {
  static current:Channel;onmessage:((event:{data:any})=>void)|null=null;sent:any[]=[];
  constructor(){Channel.current=this;}postMessage(message:any){this.sent.push(message);}close(){}
  receive(message:any){this.onmessage?.({data:message});}
}
test('Room preserves the crop through playback and temporary fullscreen, cancels on explicit new target',async()=>{
  const beforeWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),beforeChannel=globalThis.BroadcastChannel;
  Object.defineProperty(globalThis,'window',{configurable:true,value:{open:()=>({closed:false,close:()=>{},focus:()=>{}})}});
  globalThis.BroadcastChannel=Channel as any;
  mock.timers.enable({apis:['setTimeout','setInterval','Date']});
  const host=new RoomCanvasHost();const elements=[video];
  const api={getSceneElements:()=>elements,getSceneElementsIncludingDeleted:()=>elements,getFiles:()=>({}),getAppState:()=>({viewBackgroundColor:'#fff',width:1000,height:800}),onChange:()=>()=>{},onScrollChange:()=>()=>{}};
  try {
    host.attach(api as any,'lesson-1');await host.start();
    const channel=Channel.current,channelId=(host as any).channelId;
    channel.receive({type:'ready',channel:channelId,width:1920,height:1080});
    const flush=async()=>{mock.timers.tick(100);await new Promise<void>(resolve=>setImmediate(resolve));};
    host.showClip(crop.clip);host.playMedia(video.id,true,12);await flush();
    assert.deepEqual(host.state.target,crop);assert.equal(host.state.mediaId,video.id);
    const published=channel.sent.filter(message=>message.type==='frame').at(-1);
    channel.receive({type:'shown',channel:channelId,generation:published.scene.generation,revision:published.scene.revision});
    const status={playing:true,position:13,duration:60,volume:.4};
    channel.receive({type:'media-status',sequence:0,channel:channelId,generation:published.scene.generation,revision:published.scene.revision-1,id:video.id,status});
    assert.equal(getRoomVideoStatus(video.id),null,'stale output cannot replace confirmed status');
    channel.receive({type:'media-status',sequence:0,channel:channelId,generation:published.scene.generation,revision:published.scene.revision,id:video.id,status});
    assert.deepEqual(getRoomVideoStatus(video.id),status);
    sendRoomVideoCommand(video.id,{type:'pause'});
    const pauseCommand=channel.sent.at(-1);assert.equal(pauseCommand.type,'media-command');assert.equal(pauseCommand.action.type,'pause');
    channel.receive({type:'media-status',sequence:0,channel:channelId,generation:published.scene.generation,revision:published.scene.revision,id:video.id,status:{...status,position:14}});
    assert.equal(getRoomVideoStatus(video.id)?.position,13,'an old player report cannot acknowledge a new command');
    channel.receive({type:'media-status',sequence:pauseCommand.sequence,channel:channelId,generation:published.scene.generation,revision:published.scene.revision,id:video.id,status:{...status,playing:false,position:13.1}});
    assert.equal(getRoomVideoStatus(video.id)?.playing,false);
    sendRoomVideoCommand(video.id,{type:'volume',value:.5});assert.deepEqual(channel.sent.at(-1).action,{type:'volume',value:.5});


    assert.equal(channel.sent.filter(message=>message.type==='frame').at(-1)?.media?.playing,true);
    host.setMediaFullscreen(video.id,true);await flush();
    assert.deepEqual(host.state.target,crop);
    const full=channel.sent.filter(message=>message.type==='frame').at(-1);
    assert.equal(full.mediaFullscreen,true);assert.equal(full.scene.presentation.clip.id,video.id);
    host.playMedia(video.id,false,21);assert.deepEqual(host.state.target,crop);
    channel.receive({type:'media-fullscreen-exit',channel:channelId,generation:full.scene.generation-1,id:video.id});
    assert.equal(host.state.mediaFullscreenId,video.id);
    channel.receive({type:'media-fullscreen-exit',channel:channelId,generation:full.scene.generation,id:video.id});await flush();
    const restored=channel.sent.filter(message=>message.type==='frame').at(-1);
    assert.equal(restored.mediaFullscreen,false);assert.equal(restored.scene.presentation.clip.id,crop.clip.id);
    assert.equal(restored.media.position,21);assert.equal(restored.media.playing,false);
    host.setMediaFullscreen(video.id,true);host.showMaterial(video.id,'Test');assert.equal(host.state.mediaFullscreenId,null);
    host.showClip({...crop.clip,id:'other',x:950});host.playMedia(video.id,true,22);assert.equal(host.state.target.kind,'material');
    const otherClip={...crop.clip,id:'later',x:950};host.showClip(otherClip);
    channel.receive({type:'media-status',sequence:0,channel:channelId,generation:published.scene.generation,revision:published.scene.revision,id:video.id,status:{...status,position:22.1}});assert.equal(host.state.target.kind,'clip','late output status cannot act as a Play command');
    host.playMedia(video.id,false,22.1);host.playMedia(video.id,true,22.1);assert.equal(host.state.target.kind,'material');
    host.attach(api as any,'lesson-2');assert.equal(host.state.mediaFullscreenId,null);assert.equal(host.state.mediaId,null);
  } finally {
    host.stop();mock.timers.reset();globalThis.BroadcastChannel=beforeChannel;
    if(beforeWindow)Object.defineProperty(globalThis,'window',beforeWindow);else Reflect.deleteProperty(globalThis,'window');
  }
});

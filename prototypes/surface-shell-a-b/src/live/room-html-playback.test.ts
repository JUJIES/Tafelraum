import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import type {Scene} from '../../../../shared/live-canvas/protocol.ts';
let command:((id:string,command:any,state?:any)=>void)|null=null;
const reports:any[]=[];
mock.module(new URL('../canvas/interactive-html-live.ts',import.meta.url).href,{namedExports:{
  subscribeHtmlPlayback:(listener:any)=>{command=listener;return()=>{command=null;};},
  reportHtmlPlayback:(id:string,status:any)=>reports.push({id,status}),
}});
const {RoomHtmlPlaybackHost,visiblePlaybackMaterials,installRoomHtmlPlaybackReceiver}=await import('./room-html-playback.ts');
const material={instanceId:'opaque',roomLocalId:'native',roomPlayback:true,x:0,y:0,width:500,height:300};
const scene=()=>({generation:1,revision:1,materials:[material],viewport:{x:0,y:0,width:800,height:600}} as unknown as Scene);
test('only explicit, visible, non-covered HTML output is eligible; clip bounds win',()=>{
  assert.equal(visiblePlaybackMaterials(scene()).length,1);
  for(const patch of [{roomPlayback:false},{roomLocalId:undefined},{x:900},{cover:{width:1,height:1}}]){
    assert.equal(visiblePlaybackMaterials({...scene(),materials:[{...material,...patch}]} as any).length,0);
  }
  assert.equal(visiblePlaybackMaterials({...scene(),presentation:{mode:'clip',clip:{id:'elsewhere',x:900,y:0,width:200,height:200}}} as any).length,0);
});
test('host fences commands by visible instance and generation; disappearance/disposal revoke and disconnect',t=>{
  t.mock.timers.enable({apis:['setInterval','Date'],now:1000});reports.length=0;
  const sent:any[]=[];let current:Scene|null=scene();
  const host=new RoomHtmlPlaybackHost({postMessage:value=>sent.push(value)} as BroadcastChannel,'channel',()=>current);
  const ready={type:'html-playback',channel:'channel',generation:1,instanceId:'opaque'} as const;
  host.receive({...ready,generation:0});host.receive({...ready,instanceId:'wrong'});
  assert.equal(sent.length,0);
  host.receive(ready);const lease=sent.at(-1);assert.equal(lease.action,'lease');
  command!('native',{type:'play'},{frame:300,responses:{}});assert.equal(sent.at(-1).sequence,1);
  assert.deepEqual(sent.at(-1).state,{frame:300,responses:{}});
  const status={title:'Test',position:0,duration:10,volume:1,playing:true,canNext:false,canPrevious:false};
  host.receive({...ready,token:'wrong',status});assert.equal(reports.length,0);
  host.receive({...ready,token:lease.token,status});assert.equal(reports.at(-1).status.playing,true);
  current={...current!,materials:[{...material,cover:{width:1,height:1}}]} as any;
  const before=sent.length;command!('native',{type:'play'});assert.equal(sent.length,before);
  t.mock.timers.tick(500);assert.equal(sent.at(-1).action,'release');assert.equal(reports.at(-1).status,null);
  current=scene();host.receive(ready);const newLease=sent.at(-1);assert.notEqual(newLease.token,lease.token);
  host.receive({...ready,token:lease.token,status});assert.equal(reports.at(-1).status,null);
  host.dispose();assert.equal(command,null);assert.equal(sent.at(-1).action,'release');
});

for(const mode of ['canvas','material','clip'])test(`native fullscreen is forwarded to the same output, not window/camera: ${mode}`,async()=>{
  const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document');
  let listener:any;const posted:any[]=[],output:any[]=[];
  const source={postMessage:(value:any)=>output.push(value)};
  const canvas={dataset:{}};
  const root={dataset:{roomMaterialId:'native'},closest:()=>canvas};
  const frame={contentWindow:source,closest:()=>root};
  const current={...scene(),presentation:mode==='canvas'?{mode:'free',clip:null}:{mode:'clip',clip:{id:mode,x:0,y:0,width:600,height:400}}} as Scene;
  const before=JSON.stringify(current);
  Object.defineProperty(globalThis,'window',{configurable:true,value:{addEventListener:(_type:string,handler:any)=>{listener=handler;},removeEventListener(){}}});
  Object.defineProperty(globalThis,'document',{configurable:true,value:{querySelectorAll:()=>[frame]}});
  const receiver=installRoomHtmlPlaybackReceiver({postMessage:(value:any)=>posted.push(value)} as BroadcastChannel,'channel',()=>current);
  try{
    const envelope={type:'html-playback-host',channel:'channel',generation:1,instanceId:'opaque',token:'lease'} as const;
    receiver.receive({...envelope,action:'lease'});
    receiver.receive({...envelope,action:'command',sequence:1,command:{type:'fullscreen',value:true}});
    assert.deepEqual(output.at(-1).command,{type:'fullscreen',value:true});
    const status={title:'Test',position:3,duration:10,volume:1,playing:true,canNext:true,canPrevious:true,fullscreen:true};
    listener({source,data:{type:'tafelraum:playback-output',token:'lease',status}});
    assert.equal(posted.at(-1).status.fullscreen,true);
    const count=output.length;
    receiver.receive({...envelope,generation:0,action:'command',sequence:2,command:{type:'fullscreen',value:false}});
    assert.equal(output.length,count,'old generation cannot reach the player');
    receiver.receive({...envelope,action:'command',sequence:2,command:{type:'fullscreen',value:false}});
    assert.deepEqual(output.at(-1).command,{type:'fullscreen',value:false});
    assert.equal(JSON.stringify(current),before,'no target, camera or persistent material change');
    assert.equal(output.length,3,'lease plus enter/exit, no reload or media action');
  }finally{
    receiver.dispose();
    if(oldWindow)Object.defineProperty(globalThis,'window',oldWindow);else delete (globalThis as any).window;
    if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete (globalThis as any).document;
  }
});

test('graceful handoff drains Room playback before releasing and refuses late Play',async()=>{
  const sent:any[]=[];const host=new RoomHtmlPlaybackHost({postMessage:value=>sent.push(value)} as BroadcastChannel,'channel',scene);
  const ready={type:'html-playback',channel:'channel',generation:1,instanceId:'opaque'} as const;
  host.receive(ready);const lease=sent.at(-1);assert.equal(host.hasOutputs,true);
  let done=false;const stopping=host.pauseAndFlush().then(()=>{done=true;});
  assert.equal(sent.at(-1).command.type,'pause');
  const count=sent.length;command!('native',{type:'play'});assert.equal(sent.length,count);
  await Promise.resolve();assert.equal(done,false);
  host.receive({...ready,token:lease.token,status:{title:'Test',position:7,duration:10,volume:1,playing:false,canNext:false,canPrevious:false}});
  await stopping;assert.equal(done,true);host.dispose();assert.equal(sent.at(-1).action,'release');
});

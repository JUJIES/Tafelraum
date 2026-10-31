import {embeddedApps} from "../embedded-apps.ts";
import test from 'node:test';
import assert from 'node:assert/strict';
import {readAppViewEvents,setAppMirrorRoomActive,registerAppMirrorFrame,appMirrorDescriptor,receiveAppMirror} from './embedded-app-mirror.ts';
const event=(type=2)=>({type,timestamp:Date.now(),data:{node:{id:1,type:0,childNodes:[]}}});
test('local app visual packets reject malformed events, future timestamps, cycles and oversized UTF-8',()=>{
 const good=event();assert.deepEqual(readAppViewEvents([good]),[good]);
 for(const value of [null,{},[{...event(),type:8}],[{...event(),timestamp:Infinity}],[{...event(),timestamp:Date.now()+120000}],[{type:2,timestamp:1}],Array(1001).fill(event()),[{...event(),data:'€'.repeat(800000)}]])assert.equal(readAppViewEvents(value),null);
 const cyclic:any={};cyclic.self=cyclic;assert.equal(readAppViewEvents([{...event(),data:cyclic}]),null);
 assert.equal(readAppViewEvents(Array(1200).fill(event()),true)?.length,1200);
});
test('capture requires a local viewer lease and exact frame capability; removing frame revokes output',async()=>{
 const commands:unknown[]=[];const id=crypto.randomUUID();
 if(!embeddedApps.length){const dispose=registerAppMirrorFrame(id,'unavailable',{} as HTMLIFrameElement);assert.equal(appMirrorDescriptor(id),null);dispose();return;}
 const appId=embeddedApps[0].id;
 const dispose=registerAppMirrorFrame(id,appId,{contentWindow:{postMessage:(message:unknown)=>commands.push(message)}} as unknown as HTMLIFrameElement);
 const token=appMirrorDescriptor(id)!.channel;
 const channel=new BroadcastChannel(`tafelraum-app-view:${token}`),viewer=crypto.randomUUID();
 try{
  const packet={type:'tafelraum:app-view',protocol:'rrweb-2.2-v1',appId,token,epoch:1,sequence:1,events:[event(4),event()]};
  assert.equal(receiveAppMirror(id,packet),false);
  channel.postMessage({kind:'request',viewer});await new Promise(resolve=>setTimeout(resolve,15));assert.equal(commands.length,0,'inactive Room cannot capture');
  setAppMirrorRoomActive(true);channel.postMessage({kind:'request',viewer});
  for(let i=0;i<20&&!commands.length;i++)await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal((commands[0] as {enabled:boolean}).enabled,true);
  assert.equal(receiveAppMirror(id,{...packet,token:crypto.randomUUID()}),false);
  assert.equal(receiveAppMirror(id,{...packet,appId:'other'}),false);
  assert.equal(receiveAppMirror(id,packet),true);
  dispose();assert.equal(appMirrorDescriptor(id),null);assert.equal(receiveAppMirror(id,{...packet,sequence:2}),false);
  assert.equal((commands.at(-1) as {enabled:boolean}).enabled,false);
 }finally{setAppMirrorRoomActive(false);channel.close();if(appMirrorDescriptor(id))dispose();}
});

import assert from 'node:assert/strict';
import {mock,test} from 'node:test';
import distribution from '../../distribution.json' with {type:'json'};
mock.module(new URL('./public-projection.ts',import.meta.url).href,{namedExports:{
 createPublicProjector:()=>({stop(){}}),getPublicViewport:()=>({x:0,y:0,width:800,height:600}),
}});
const {LiveHost}=await import('./live-host.ts');
test('public host cannot resume stored sessions or create an invitation',async()=>{
 let reads=0,calls=0;
 const storage=globalThis.localStorage,request=globalThis.fetch,socket=globalThis.WebSocket;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){reads++;return null;},removeItem(){throw Error('Do not erase saved sessions');}}});
 globalThis.fetch=async()=>{calls++;throw Error('No request');};
 globalThis.WebSocket=class {constructor(){calls++;throw Error('No socket');}} as unknown as typeof WebSocket;
 const host=new LiveHost();
 try{
  host.activate();
  if(!distribution.remoteCanvas){assert.equal(await host.prepareInvitation(),null);assert.equal(reads,0);}
  assert.equal(host.getSnapshot().session,null);assert.equal(calls,0);
 }finally{host.dispose();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});globalThis.fetch=request;globalThis.WebSocket=socket;}
});

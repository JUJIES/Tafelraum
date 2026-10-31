/** Local, capability-bound visual output of one registered provider frame. No archive/Remote data. */
import {embeddedAppById,type EmbeddedAppId} from '../embedded-apps.ts';
export const appViewProtocol="rrweb-2.2-v1";
export type AppViewEvent={type:number;timestamp:number;data:unknown};
export const appViewLimits={packet:2*1024*1024,history:8*1024*1024,events:6000,lease:8000};
export function readAppViewEvents(value:unknown,history=false):AppViewEvent[]|null {
  if(!Array.isArray(value)||value.length>(history?appViewLimits.events:1000))return null;
  let text:string;try{text=JSON.stringify(value);}catch{return null;}
  if(new TextEncoder().encode(text).byteLength>(history?appViewLimits.history:appViewLimits.packet))return null;
  if(!value.every(e=>e&&typeof e==='object'&&Number.isInteger(e.type)&&e.type>=0&&e.type<=4
    &&Number.isSafeInteger(e.timestamp)&&e.timestamp>=0&&e.timestamp<=Date.now()+60_000&&e.data!==undefined))return null;
  return JSON.parse(text) as AppViewEvent[];
}
type Entry={id:string;appId:EmbeddedAppId;token:string;frame:HTMLIFrameElement;channel:BroadcastChannel;
 viewers:Map<string,number>;events:AppViewEvent[];bytes:number;epoch:number;sequence:number;active:boolean;windowAt:number;windowCount:number;timer:ReturnType<typeof setInterval>};
const entries=new Map<string,Entry>();
let roomActive=false;
export function setAppMirrorRoomActive(active:boolean){
 roomActive=active;
 if(!active)for(const entry of entries.values()){entry.viewers.clear();if(entry.active)mode(entry,false);}
}
export function appMirrorDescriptor(id:string){const e=entries.get(id);return e?{channel:e.token,app:embeddedAppById(e.appId)!}:null;}
function mode(e:Entry,enabled:boolean){
 e.active=enabled;e.frame.contentWindow?.postMessage({type:'tafelraum:app-view-mode',appId:e.appId,protocol:appViewProtocol,token:e.token,enabled},embeddedAppById(e.appId)!.sourceUrl.split('/').slice(0,3).join('/'));
 if(!enabled){e.events=[];e.bytes=0;e.sequence=0;e.channel.postMessage({kind:'closed'});}
}
export function registerAppMirrorFrame(id:string,appId:EmbeddedAppId,frame:HTMLIFrameElement){
 if(embeddedAppById(appId)?.roomView?.protocol!==appViewProtocol)return()=>{};
 const token=crypto.randomUUID(),channel=new BroadcastChannel(`tafelraum-app-view:${token}`);
 const e:Entry={id,appId,frame,token,channel,viewers:new Map(),events:[],bytes:0,epoch:0,sequence:0,active:false,windowAt:0,windowCount:0,timer:0 as unknown as ReturnType<typeof setInterval>};
 entries.set(id,e);
 channel.onmessage=({data})=>{
  if(!data||typeof data.viewer!=='string'||!/^[a-f0-9-]{36}$/.test(data.viewer))return;
  if(data.kind==='request'){
   if(!roomActive)return;
   if(!e.viewers.has(data.viewer)&&e.viewers.size>=4)return;
   e.viewers.set(data.viewer,Date.now());
   if(!e.active)mode(e,true);
   else if(e.events.length)channel.postMessage({kind:'snapshot',epoch:e.epoch,sequence:e.sequence,events:e.events});
   else mode(e,true);
  }else if(data.kind==='lease'&&e.viewers.has(data.viewer))e.viewers.set(data.viewer,Date.now());
  else if(data.kind==='release')e.viewers.delete(data.viewer);
  if(!e.viewers.size&&e.active)mode(e,false);
 };
 e.timer=setInterval(()=>{
  for(const [viewer,at] of e.viewers)if(Date.now()-at>appViewLimits.lease)e.viewers.delete(viewer);
  if(!e.viewers.size&&e.active)mode(e,false);
 },2000);
 return()=>{if(entries.get(id)===e)entries.delete(id);clearInterval(e.timer);mode(e,false);channel.close();};
}
export function appMirrorFrameReady(id:string){const e=entries.get(id);if(e?.active){e.events=[];e.sequence=0;mode(e,true);}}
export function receiveAppMirror(id:string,message:unknown){
 const e=entries.get(id);if(!e?.active||!message||typeof message!=='object')return false;
 const m=message as Record<string,unknown>;
 if(m.type!=='tafelraum:app-view'||m.protocol!==appViewProtocol||m.appId!==e.appId||m.token!==e.token||!Number.isSafeInteger(m.epoch)||!Number.isSafeInteger(m.sequence)||Number(m.epoch)<0||Number(m.sequence)<1)return false;
 const now=Date.now();if(now-e.windowAt>=1000){e.windowAt=now;e.windowCount=0;}
 if(++e.windowCount>30){mode(e,false);return false;}
 if(m.error===true){mode(e,false);return false;}
 const events=readAppViewEvents(m.events);if(!events)return false;
 if(m.epoch!==e.epoch){e.epoch=m.epoch as number;e.sequence=0;e.events=[];e.bytes=0;}
 if(m.sequence!==e.sequence+1){e.events=[];e.bytes=0;e.sequence=0;mode(e,true);return false;}
 e.sequence=m.sequence as number;
 for(const event of events){
  if(event.type===2){const meta=[...e.events,...events].reverse().find(item=>item.type===4);e.events=meta?[meta]:[];e.bytes=new TextEncoder().encode(JSON.stringify(e.events)).byteLength;}
  e.events.push(event);e.bytes+=new TextEncoder().encode(JSON.stringify(event)).byteLength;
 }
 if(e.bytes>appViewLimits.history||e.events.length>appViewLimits.events){e.events=[];e.bytes=0;e.sequence=0;mode(e,true);return false;}
 e.channel.postMessage({kind:'events',epoch:e.epoch,sequence:e.sequence,events});return true;
}

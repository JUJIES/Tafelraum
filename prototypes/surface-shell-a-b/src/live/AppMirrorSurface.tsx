import { t, useUiLocale } from "../i18n";
import {useEffect,useRef,useState} from 'react';
import {Replayer} from 'rrweb';
import 'rrweb/dist/style.css';
import './app-mirror.css';
import {readAppViewEvents,type AppViewEvent} from '../canvas/embedded-app-mirror';
type Replay={player:Replayer;node:HTMLDivElement;observer:MutationObserver|null};
/** Local visual replica. rrweb's nested frame has scripts/forms disabled; the provider never runs here. */
export function AppMirrorSurface({channel:token,onReady}:{channel:string;onReady():void}){
  useUiLocale();
 const root=useRef<HTMLDivElement>(null),ready=useRef(onReady);ready.current=onReady;
 const [status,setStatus]=useState(t("Wird verbunden"));
 useEffect(()=>{
  if(!root.current||!/^[a-f0-9-]{36}$/.test(token))return;
  const channel=new BroadcastChannel(`tafelraum-app-view:${token}`),viewer=crypto.randomUUID();
  let current:Replay|null=null,retired:Replay|null=null,meta:AppViewEvent|null=null;
  let epoch=-1,sequence=0,last=Date.now(),disposed=false,hasBaseline=false;
  function drop(replay:Replay|null){replay?.observer?.disconnect();replay?.player.destroy();replay?.node.remove();}
  function reset(){drop(current);drop(retired);current=null;retired=null;meta=null;epoch=-1;sequence=0;hasBaseline=false;}
  function begin(){
   // Full snapshots bound rrweb's own event history too. Swap only after the new DOM is complete.
   drop(retired);retired=current;
   const node=document.createElement('div');Object.assign(node.style,{position:'absolute',inset:'0',visibility:'hidden'});root.current!.append(node);
   const player=new Replayer([],{root:node,liveMode:true,mouseTail:false,triggerFocus:false,showWarning:false,
     insertStyleRules:['html{pointer-events:none!important}'],UNSAFE_replayCanvas:false});
   const replay:Replay={player,node,observer:null};current=replay;
   player.iframe.tabIndex=-1;
   player.iframe.setAttribute('allow',"autoplay 'none'; camera 'none'; microphone 'none'");
   player.on('fullsnapshot-rebuilded',()=>{
    if(disposed||current!==replay)return;
    const doc=player.iframe.contentDocument;
    const silence=()=>doc?.querySelectorAll('audio,video').forEach(node=>{const media=node as HTMLMediaElement;media.muted=true;media.autoplay=false;media.pause();});
    silence();if(doc){replay.observer=new MutationObserver(silence);replay.observer.observe(doc,{childList:true,subtree:true});}
    node.style.visibility='visible';drop(retired);retired=null;setStatus('');ready.current();
   });
   player.startLive(Date.now()-120);
  }
  channel.onmessage=({data})=>{
   if(disposed||!data)return;
   if(data.kind==='closed'){reset();setStatus("Verbindung unterbrochen");return;}
   if(!['snapshot','events'].includes(data.kind)||!Number.isSafeInteger(data.epoch)||data.epoch<0||!Number.isSafeInteger(data.sequence)||data.sequence<1)return;
   const events=readAppViewEvents(data.events,data.kind==='snapshot');if(!events)return;
   if(data.kind==='snapshot'&&current&&epoch===data.epoch&&hasBaseline)return;
   if(epoch!==data.epoch||data.kind==='snapshot'){epoch=data.epoch;sequence=0;meta=null;hasBaseline=false;}
   else if(sequence&&data.sequence!==sequence+1){reset();channel.postMessage({kind:'request',viewer});return;}
   sequence=data.sequence;last=Date.now();
   const latestMeta=[...events].reverse().find(event=>event.type===4);if(latestMeta)meta=latestMeta;
   const full=events.map(event=>event.type).lastIndexOf(2);
   let apply=events;
   if(full>=0){if(!meta)return;begin();hasBaseline=true;apply=[meta,...events.slice(full)];}
   if(!hasBaseline||!current)return;
   for(const event of apply)current.player.addEvent(event as Parameters<Replayer['addEvent']>[0]);
  };
  channel.postMessage({kind:'request',viewer});
  const timer=setInterval(()=>{
   channel.postMessage({kind:'lease',viewer});
   if(Date.now()-last>4000){setStatus("Verbindung unterbrochen");channel.postMessage({kind:'request',viewer});}
  },1500);
  return()=>{disposed=true;clearInterval(timer);channel.postMessage({kind:'release',viewer});channel.close();reset();};
 },[token]);
 return <div className="app-mirror-surface" aria-label={t("Lerndeck – Room-Ausgabe")}><div ref={root}/>{status&&<div className="app-mirror-status" role="status">{t(status)}</div>}</div>;
}

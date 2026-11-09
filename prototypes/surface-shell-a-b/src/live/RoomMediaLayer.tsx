import { t, useUiLocale } from "../i18n";
import type {RoomVideoStatus} from './room-video-status';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Volume2 } from 'lucide-react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { getInteractiveHtmlCoverProjection } from '../canvas/interactive-html-embed';
import { getYouTubeEmbedUrl } from '../canvas/youtube-embed';
import { roomMediaPosition, type RoomMedia } from './room-media';
import { getYouTubeCurrentTimeFromMessage } from '../canvas/youtube-embed';
import './room-media.css';

function formatTime(value:number) {
  const seconds=Math.floor(Math.max(0,value));
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}

export function RoomMediaLayer({media,api,onReady,onError,output=false,onStatus}:{media:RoomMedia;api:ExcalidrawImperativeAPI;onReady?():void;onError?(message:string):void;output?:boolean;onStatus?(status:RoomVideoStatus,sequence:number):void}) {
  useUiLocale();
  const video=useRef<HTMLVideoElement>(null);
  const iframe=useRef<HTMLIFrameElement>(null);
  const [loaded,setLoaded]=useState(false);
  const [loadError,setLoadError]=useState<string|null>(null);
  const errorCallback=useRef(onError);errorCallback.current=onError;
  const readyRef=useRef(false);
  const [,refresh]=useState(0);
  const appliedSequence=useRef(0),initialized=useRef(false),requestedPlaying=useRef(false);
  const youtubeStatus=useRef<RoomVideoStatus>({playing:false,position:0,duration:0,volume:1});
  const youtubeOrigin='https://www.youtube-nocookie.com';
  const youtubeUrl=useMemo(()=>{
    if(!media.videoId)return '';
    const url=new URL(getYouTubeEmbedUrl(media.videoId,window.location.origin));
    url.searchParams.set('controls','0');
    url.searchParams.set('mute',output?'0':'1');
    return url.href;
  },[media.videoId,output]);
  useEffect(()=>api.onScrollChange(()=>refresh(value=>value+1)),[api]);
  useEffect(()=>{setLoaded(false);setLoadError(null);readyRef.current=false;},[media.id,media.sourceUrl,media.videoId,media.attempt]);
  useEffect(()=>{
    if(media.kind!=='youtube'||loaded)return;
    const timer=setTimeout(()=>{
      if(readyRef.current)return;
      const message=t("YouTube konnte im Raumfenster nicht geladen werden.");
      setLoadError(message);errorCallback.current?.(message);
    },8000);
    return()=>clearTimeout(timer);
  },[media.kind,media.id,media.attempt,loaded]);
  useEffect(()=>{if(!output||media.kind==='audio')onReady?.();},[media.id,media.kind,onReady]);
  useEffect(()=>{
    if(media.kind!=='youtube')return;
    const receive=(event:MessageEvent)=>{
      if(event.source!==iframe.current?.contentWindow
        ||(event.origin!==youtubeOrigin&&event.origin!=='https://www.youtube.com'))return;
      let payload:unknown=event.data;
      if(typeof payload==='string'){
        try{payload=JSON.parse(payload) as unknown;}catch{return;}
      }
      if(!payload||typeof payload!=='object'||!('event' in payload)
        ||!['onReady','infoDelivery'].includes(String(payload.event)))return;
      if(!readyRef.current){readyRef.current=true;setLoadError(null);setLoaded(true);onReady?.();}
      const currentTime=getYouTubeCurrentTimeFromMessage(payload);
      const info=(payload as {info?:{playerState?:number;duration?:number;volume?:number}}).info;
      if(output&&initialized.current&&currentTime!==null&&info){
        youtubeStatus.current={position:currentTime,duration:Number.isFinite(info.duration)?info.duration!:youtubeStatus.current.duration,
          playing:typeof info.playerState==='number'?info.playerState===1:youtubeStatus.current.playing,volume:typeof info.volume==='number'?info.volume/100:youtubeStatus.current.volume};
        onStatus?.(youtubeStatus.current,appliedSequence.current);
      }
    };
    window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
  },[media.kind,media.videoId,onReady,output,onStatus]);
  const sendYouTube=(func:string,args:unknown[]=[])=>iframe.current?.contentWindow?.postMessage(
    JSON.stringify({event:'command',func,args}),youtubeOrigin);
  useEffect(()=>{
    if(!output||!loaded)return;
    const player=video.current;
    const play=()=>{
      requestedPlaying.current=true;
      if(media.kind==='youtube'){sendYouTube('playVideo');return;}
      if(player?.ended)player.currentTime=0;
      if(player?.paused)void player.play().then(()=>{
        if(!requestedPlaying.current||video.current!==player)player.pause();
      }).catch(()=>{if(requestedPlaying.current&&video.current===player)errorCallback.current?.(t("Wiedergabe blockiert. Bitte erneut auf Abspielen klicken."));});
    };
    const pause=()=>{requestedPlaying.current=false;if(media.kind==='youtube')sendYouTube('pauseVideo');else player?.pause();};
    const seek=(position:number)=>{if(media.kind==='youtube')sendYouTube('seekTo',[position,true]);else if(player)player.currentTime=position;};
    const volume=(value:number)=>{if(media.kind==='youtube'){sendYouTube('unMute');sendYouTube('setVolume',[value*100]);}else if(player)player.volume=value;};
    if(!initialized.current){
      initialized.current=true;appliedSequence.current=media.commandSequence??0;
      seek(roomMediaPosition(media));volume(media.volume??1);
      if(media.playing&&!media.suspended)play();else pause();
    }
    const command=media.command;
    if(command&&command.sequence>appliedSequence.current){
      appliedSequence.current=command.sequence;
      if(command.action.type==='play')play();
      else if(command.action.type==='pause')pause();
      else if(command.action.type==='seek'){seek(command.action.value);if(command.action.playing)play();else pause();}
      else if(command.action.type==='volume')volume(command.action.value);
    }
    if(media.suspended)pause();
  },[media.id,media.kind,media.command,media.suspended,loaded,output]);
  const statusCallback=useRef(onStatus);statusCallback.current=onStatus;
  useEffect(()=>{
    if(!output||media.kind!=='video')return;
    const send=()=>{const player=video.current;if(player&&initialized.current)statusCallback.current?.({playing:!player.paused&&!player.ended,position:player.currentTime,duration:Number.isFinite(player.duration)?player.duration:0,volume:player.volume},appliedSequence.current);};
    const currentPlayer=video.current;const timer=setInterval(send,100);send();return()=>{clearInterval(timer);requestedPlaying.current=false;currentPlayer?.pause();};
  },[output,media.kind,media.id]);
  const state=api.getAppState(),zoom=state.zoom.value;
  const docked=media.outsideTarget&&media.kind==='youtube';
  const hidden=media.outsideTarget&&!docked;
  const width=media.width*zoom,height=media.height*zoom;
  const style={left:(media.x+state.scrollX)*zoom,top:(media.y+state.scrollY)*zoom,width,height,
    '--room-media-zoom':zoom,
    transform:`rotate(${media.angle}rad)`} as CSSProperties;
  const cover=getInteractiveHtmlCoverProjection(width,height,media.cover??null);
  return <div className={`room-media${docked?' is-docked':''}${hidden?' is-offscreen':''}${!docked&&cover.fullyCovered?' is-fully-covered':''}`}
    style={docked?undefined:style} aria-hidden={hidden||undefined} aria-label={media.title}>
    <div className="room-media__visibility" style={docked?undefined:{clipPath:cover.clipPath}}>
      {!output&&media.kind!=='audio'&&<div className="room-media__audio"><strong>{media.title}</strong><span>{t("Wiedergabe im Room")}</span></div>}
      {output&&media.kind==='video'&&<video ref={video} src={media.sourceUrl} muted={!output} playsInline preload="auto"
        onLoadedData={()=>{if(!readyRef.current){readyRef.current=true;setLoaded(true);onReady?.();}}}
        onError={()=>{const message=t("Video konnte im Raumfenster nicht geladen werden.");setLoadError(message);errorCallback.current?.(message);}}/>}
      {output&&media.kind==='youtube'&&<iframe ref={iframe} src={youtubeUrl} title={media.title}
        allow="autoplay; encrypted-media; picture-in-picture"
        onLoad={()=>iframe.current?.contentWindow?.postMessage(JSON.stringify({event:'listening',id:media.id}),youtubeOrigin)}/>}
      {media.kind==='audio'&&<div className="room-media__audio"><Volume2 aria-hidden="true"/>
        <strong>{media.title}</strong><span>{formatTime(roomMediaPosition(media))}</span></div>}
      {loadError&&<div className="room-media__error" role="alert">{t(loadError)}</div>}
    </div>
    {!docked&&media.annotations.length>0&&<svg className="room-media__annotations" viewBox={`0 0 ${media.width} ${media.height}`} preserveAspectRatio="none">
      {media.annotations.map((annotation,index)=>annotation.kind==='stroke'
        ?<polyline key={index} fill={annotation.fillColor??'none'} opacity={annotation.opacity}
          points={annotation.points.map(point=>point.join(',')).join(' ')} stroke={annotation.strokeColor}
          strokeLinecap="round" strokeLinejoin="round" strokeWidth={annotation.strokeWidth}/>
        :<foreignObject key={index} x={annotation.x-annotation.width/2} y={annotation.y-annotation.height/2}
          width={annotation.width} height={annotation.height} opacity={annotation.opacity}
          transform={`rotate(${annotation.angle*180/Math.PI} ${annotation.x} ${annotation.y})`}>
          <div className="room-media__annotation-text" style={{color:annotation.color,fontSize:annotation.fontSize,
            lineHeight:annotation.lineHeight,textAlign:annotation.textAlign}}>{annotation.text}</div>
        </foreignObject>)}</svg>}
  </div>;
}

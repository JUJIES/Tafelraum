import { t, useUiLocale } from "../i18n";
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Play,Pause,RotateCcw,RotateCw,Expand,Minimize2} from 'lucide-react';
import {useRoomVideoStatus,sendRoomVideoCommand,type RoomVideoCommand} from '../live/room-video-status';
import type {VideoFullscreenControls} from './useVideoFullscreen';
import './room-video-controller.css';

type Frame={elementId:string;centerX:number;centerY:number;angle:number;width:number;height:number;covered:boolean};
export function RoomVideoController({frame,title,position,initialVolume=1,fullscreenControls,onPlayback,onContextMenu,onMoveStart}:{
  frame:Frame;title:string;position:number;initialVolume?:number;fullscreenControls?:VideoFullscreenControls;
  onPlayback?(id:string,playing:boolean,position:number,volume?:number):void;
  onContextMenu(event:React.MouseEvent<HTMLDivElement>,id:string):void;
  onMoveStart(event:React.PointerEvent<HTMLDivElement>,id:string):void;
}){
  useUiLocale();
  const status=useRoomVideoStatus(frame.elementId);
  const pending=useRef<{playing:boolean;position:number;volume:number}|null>(null);
  const [,refresh]=useState(0);
  useEffect(()=>{const intent=pending.current;if(intent&&status&&intent.playing===status.playing
    &&Math.abs(intent.volume-status.volume)<.02&&(intent.playing?status.position>=intent.position-.2&&status.position<intent.position+3:Math.abs(status.position-intent.position)<.2)){pending.current=null;refresh(v=>v+1);}},[status]);
  const pendingTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(pendingTimer.current),[]);
  const playback=useRef(onPlayback);playback.current=onPlayback;
  useEffect(()=>{playback.current?.(frame.elementId,false,position,initialVolume);},[frame.elementId]);
  const time=pending.current?.position??status?.position??position,playing=pending.current?.playing??status?.playing??false,volume=pending.current?.volume??status?.volume??initialVolume;
  const send=(action:RoomVideoCommand)=>{
    pending.current={playing:action.type==='play'?true:action.type==='pause'?false:playing,
      position:action.type==='seek'?action.value:time,volume:action.type==='volume'?action.value:volume};
    refresh(v=>v+1);clearTimeout(pendingTimer.current);
    pendingTimer.current=setTimeout(()=>{pending.current=null;refresh(v=>v+1);},2500);
    sendRoomVideoCommand(frame.elementId,action);
  };
  const format=(value:number)=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
  const fullscreen=fullscreenControls?.id===frame.elementId;
  const style={left:frame.centerX,top:frame.centerY,width:frame.width,height:frame.height,
    transform:`translate(-50%,-50%) rotate(${frame.angle}rad)`} as CSSProperties;
  return <div className={`room-video-controller${frame.covered?' is-covered':''}`} style={style} data-canvas-element-id={frame.elementId}
    onContextMenu={event=>{if(!(event.target as Element).closest('button,input,label'))onContextMenu(event,frame.elementId);}}
    onPointerDown={event=>{if(event.button===0&&!(event.target as Element).closest('button,input,label'))onMoveStart(event,frame.elementId);}}>
    <div className="room-video-controller__content">
      <strong>{title}</strong><span>{t("Wiedergabe im Room")}</span>
      <div className="room-video-controller__buttons">
        <button aria-label={t("10 Sekunden zurück")} onClick={()=>send({type:'seek',playing,value:Math.max(0,time-10)})}><RotateCcw/></button>
        <button aria-label={playing?t("Pausieren"):t("Abspielen")} onClick={()=>send({type:playing?'pause':'play'})}>{playing?<Pause/>:<Play/>}</button>
        <button aria-label={t("10 Sekunden vor")} onClick={()=>send({type:'seek',playing,value:Math.min(status?.duration||86400,time+10)})}><RotateCw/></button>
        <button aria-label={fullscreen?t("Vollbild verlassen"):t("Vollbild")} onClick={()=>fullscreenControls?.change(frame.elementId,!fullscreen)}>{fullscreen?<Minimize2/>:<Expand/>}</button>
      </div>
      <label>{t("Position")} <output>{format(time)} / {format(status?.duration??0)}</output>
        <input aria-label={t("Wiedergabeposition")} type="range" min="0" max={status?.duration||1} step="0.1" value={Math.min(time,status?.duration||1)} disabled={!status?.duration}
          onChange={event=>send({type:'seek',playing,value:Number(event.currentTarget.value)})}/></label>
      <label>{t("Lautstärke")}<input aria-label={t("Lautstärke")} type="range" min="0" max="1" step="0.05" value={volume} onChange={event=>send({type:'volume',value:Number(event.currentTarget.value)})}/></label>
    </div>
  </div>;
}

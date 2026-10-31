import {useSyncExternalStore} from 'react';

/** Confirmed local output status only; commands and authority stay in RoomCanvasHost. */
export type RoomVideoStatus={playing:boolean;position:number;duration:number;volume:number};
const values=new Map<string,RoomVideoStatus>();
const listeners=new Set<()=>void>();
export function validRoomVideoStatus(value:unknown):value is RoomVideoStatus {
  if(!value||typeof value!=='object')return false;
  const s=value as RoomVideoStatus;
  return Object.keys(value).every(key=>['playing','position','duration','volume'].includes(key))&&typeof s.playing==='boolean'&&[s.position,s.duration,s.volume].every(Number.isFinite)
    &&s.position>=0&&s.position<=86400&&s.duration>=0&&s.duration<=86400&&s.volume>=0&&s.volume<=1;
}
export function reportRoomVideoStatus(id:string,status:RoomVideoStatus){values.set(id,status);listeners.forEach(fn=>fn());}
export function pauseRoomVideoStatus(id:string){const value=values.get(id);if(value)reportRoomVideoStatus(id,{...value,playing:false});}
export function clearRoomVideoStatus(){values.clear();listeners.forEach(fn=>fn());}
export function getRoomVideoStatus(id:string){return values.get(id)??null;}
export function useRoomVideoStatus(id:string){
  return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>getRoomVideoStatus(id));
}

export type RoomVideoCommand={type:'play'|'pause'}|{type:'seek';value:number;playing:boolean}|{type:'volume';value:number};
export function validRoomVideoCommand(value:unknown):value is RoomVideoCommand{
  if(!value||typeof value!=='object')return false;
  const v=value as RoomVideoCommand;
  if(v.type==='play'||v.type==='pause')return Object.keys(v).length===1;
  if(v.type==='volume')return Object.keys(v).length===2&&Number.isFinite(v.value)&&v.value>=0&&v.value<=1;
  return v.type==='seek'&&Object.keys(v).length===3&&Number.isFinite(v.value)&&v.value>=0&&v.value<=86400&&typeof v.playing==='boolean';
}
const commands=new Set<(id:string,command:RoomVideoCommand)=>void>();
export function sendRoomVideoCommand(id:string,command:RoomVideoCommand){commands.forEach(fn=>fn(id,command));}
export function subscribeRoomVideoCommands(fn:(id:string,command:RoomVideoCommand)=>void){commands.add(fn);return()=>{commands.delete(fn);};}

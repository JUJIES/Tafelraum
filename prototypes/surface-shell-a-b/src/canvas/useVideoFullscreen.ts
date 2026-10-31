import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

export type VideoFullscreenControls = {
  active:boolean; id:string|null; change(elementId:string,active:boolean):void;
};
/** Keep the existing player mounted: native fullscreen is a view, not another playback instance. */
export function useVideoFullscreen(id:string,root:RefObject<HTMLDivElement|null>,controls?:VideoFullscreenControls) {
  const [active,setActive]=useState(false),[error,setError]=useState<string|null>(null);
  const controlsRef=useRef(controls);controlsRef.current=controls;
  const reported=useRef(false),linked=useRef(false);
  useEffect(()=>{
    const changed=()=>{
      const next=document.fullscreenElement===root.current;
      setActive(next);
      if(next!==reported.current){
        reported.current=next;if(next)linked.current=Boolean(controlsRef.current?.active);
        controlsRef.current?.change(id,next);
      }
    };
    document.addEventListener('fullscreenchange',changed);
    return()=>{
      document.removeEventListener('fullscreenchange',changed);
      if(reported.current)controlsRef.current?.change(id,false);
    };
  },[id,root]);
  useEffect(()=>{
    if(active&&linked.current&&(!controls?.active||controls.id!==id))void document.exitFullscreen().catch(()=>undefined);
  },[active,controls?.active,controls?.id,id]);
  const toggle=useCallback(async()=>{
    setError(null);
    try {
      if(document.fullscreenElement===root.current)await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    }catch{setError('Vollbild konnte nicht geöffnet werden. Bitte erneut versuchen.');}
  },[root]);
  return {active,error,toggle};
}

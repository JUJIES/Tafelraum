import { t, useUiLocale } from "../i18n";
import { createPortal, flushSync } from 'react-dom';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { LaserStyle } from '../../../../shared/live-canvas/protocol';
import { WandSparkles } from 'lucide-react';
import { FluentToolbarIcon } from '../icons/FluentToolbarIcon';
import { createHostPointerChannel } from './host-pointer-channel';
import { laserStyles } from './laser-trail';
import './laser.css';

/** A temporary overlay tool leaves the engine's underlying tool choice intact, like Clip. */
export function useLaserTool(api: ExcalidrawImperativeAPI | null, blocked: boolean, suspended = false) {
  const [pinned,setPinned]=useState(false), [held,setHeld]=useState(false), [options,setOptions]=useState(false);
  const [style,setStyle]=useState<LaserStyle>(()=>{try{const value=localStorage.getItem('tafelraum.laser-style');return laserStyles.find(s=>s.id===value)?.id??'comet';}catch{return 'comet';}});
  const [channel]=useState(createHostPointerChannel);
  const latest=useRef({api,blocked,pinned,held,options});latest.current={api,blocked,pinned,held,options};
  const down=useRef<string | null>(null);
  useEffect(()=>{
    // Visibility follows the effective tool. Releasing Y must not hide a pinned laser.
    const release=()=>{down.current=null;setHeld(false);};
    const keydown=(event:KeyboardEvent)=>{
      if(document.querySelector("dialog[open]"))return;
      if(event.key==='Escape' && (latest.current.pinned || latest.current.held)) {
        event.preventDefault();event.stopImmediatePropagation();
        if(latest.current.options)setOptions(false);else{release();setPinned(false);}return;
      }
      if(event.key.toLowerCase()!=='y' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing) return;
      const target=event.target instanceof Element?event.target:document.activeElement;
      if(target?.closest('input,textarea,select,[contenteditable=true],iframe') || document.activeElement?.tagName==='IFRAME'
        || document.querySelector('dialog[open]') || latest.current.api?.getAppState().editingTextElement || latest.current.blocked) return;
      event.preventDefault();event.stopImmediatePropagation();
      // An explicit exit (double-click/Escape) lasts until the next Y press.
      if(event.repeat && down.current===null)return;
      if(down.current===null){down.current=event.code;flushSync(()=>{setHeld(true);setOptions(false);});}
    };
    const keyup=(event:KeyboardEvent)=>{if(down.current!==null && event.code===down.current){event.preventDefault();event.stopImmediatePropagation();flushSync(release);}};
    const blur=()=>{release();setOptions(false);};
    window.addEventListener('keydown',keydown,true);window.addEventListener('keyup',keyup,true);
    window.addEventListener('blur',blur);document.addEventListener('visibilitychange',blur);
    return()=>{window.removeEventListener('keydown',keydown,true);window.removeEventListener('keyup',keyup,true);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',blur);};
  },[channel]);
  return {active:!blocked && !suspended && (pinned||held),pinned,held,style,channel,options,setOptions,
    cancel(){down.current=null;setPinned(false);setHeld(false);setOptions(false);channel.set(null);},
    choose(){setPinned(true);setOptions(pinned?!options:false);document.querySelector<HTMLElement>('.canvas-engine .excalidraw')?.focus();},
    setStyle(value:LaserStyle){setStyle(value);document.querySelector<HTMLElement>('.canvas-engine .excalidraw')?.focus();try{localStorage.setItem('tafelraum.laser-style',value);}catch{/* optional preference */}},
  };
}
export type LaserToolState=ReturnType<typeof useLaserTool>;
export function LaserToolButton({laser, disabled, header = false}:{laser:LaserToolState;disabled:boolean;header?:boolean}) {
  useUiLocale();
  const button=useRef<HTMLButtonElement>(null), panel=useRef<HTMLDivElement>(null);
  const [position,setPosition]=useState({left:0,top:0});
  useEffect(()=>{
    if(!laser.options)return;
    const update=()=>{const b=button.current!.getBoundingClientRect();setPosition({left:Math.max(8,Math.min(innerWidth-230,b.left-70)),top:b.top>100?b.top-86:b.bottom+10});};
    const close=(event:PointerEvent)=>{if(!button.current?.contains(event.target as Node)&&!panel.current?.contains(event.target as Node))laser.setOptions(false);};
    update();window.addEventListener('resize',update);window.addEventListener('pointerdown',close,true);
    return()=>{window.removeEventListener('resize',update);window.removeEventListener('pointerdown',close,true);};
  },[laser.options,laser.setOptions]);
  return <div className="laser-tool-wrap">
    <button ref={button} className="tool-button" aria-label={t("Zeiger")} title={t("Zeiger (Y halten)")} aria-keyshortcuts="Y" aria-pressed={laser.active} aria-expanded={laser.options} disabled={disabled} onClick={laser.choose}>
      {header ? <WandSparkles aria-hidden="true" strokeWidth={1.8}/> : <FluentToolbarIcon name="laser"/>}<span className="tool-button-label">{t("Zeiger")}</span>
    </button>
    {laser.options && createPortal(<div ref={panel} className="laser-options" role="group" aria-label={t("Zeigerstil")} style={position}>
      {laserStyles.map(style=><button key={style.id} data-style={style.id} aria-pressed={laser.style===style.id} onClick={()=>laser.setStyle(style.id)} style={{'--laser-color':style.color} as CSSProperties}><span className="laser-style-swatch" aria-hidden="true"/>{t(style.label)}</button>)}
    </div>,document.body)}
  </div>;
}

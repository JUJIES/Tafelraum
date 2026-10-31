import { t, useUiLocale } from "../i18n";
import {useState,type CSSProperties,type KeyboardEvent,type PointerEvent} from 'react';
import {textBoxResizeHandles,textBoxHandlePosition,textBoxHandleCursor,textBoxHandleAtPoint,type TextBoxFrame,type TextBoxHandle} from './text-box-geometry';
import './text-box-handles.css';

export function TextBoxHandles({frame,onPointerDown,onKeyDown}:{frame:TextBoxFrame;
  onPointerDown?:(event:PointerEvent<HTMLDivElement>)=>void;
  onKeyDown:(handle:TextBoxHandle,event:KeyboardEvent<HTMLButtonElement>)=>void;
}) {
  useUiLocale();
  const handles=[...textBoxResizeHandles,'rotate' as const];
  const [hovered,setHovered]=useState<TextBoxHandle|null>();
  const hover=(event:PointerEvent<HTMLDivElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    setHovered(textBoxHandleAtPoint(frame,{x:event.clientX-rect.left,y:event.clientY-rect.top}));
  };
  return <div className="text-box-selection" onPointerDownCapture={hover} onPointerDown={onPointerDown}
    onPointerMove={event=>{if(!event.buttons)hover(event);}} onPointerUp={hover} onPointerLeave={event=>{if(!event.buttons)setHovered(undefined);}}
    onPointerCancel={()=>setHovered(undefined)}>
    <div className="text-box-selection__frame" style={{left:frame.centerX,top:frame.centerY,width:frame.width+12,height:frame.height+12,
      transform:`translate(-50%,-50%) rotate(${frame.angle}rad)`}}/>
    {handles.map(handle=>{
      const position=textBoxHandlePosition(frame,handle);
      const label=handle==='rotate'?t("Text drehen"):handle==='w'||handle==='e'?t("Textbreite ändern"):t("Text proportional skalieren");
      return <button key={handle} type="button" className={`text-box-selection__handle is-${handle}`} data-text-box-handle={handle} data-highlighted={hovered===handle}
        aria-label={t(label)} title={t(label)} style={{left:position.x,top:position.y,cursor:hovered===null?'move':textBoxHandleCursor(hovered??handle,frame.angle),
          '--text-handle-angle':`${frame.angle}rad`} as CSSProperties}
        onKeyDown={event=>onKeyDown(handle,event)}><span/></button>;
    })}
  </div>;
}

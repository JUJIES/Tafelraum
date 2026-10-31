import { t, useUiLocale } from "../i18n";
import {resizeHtmlPageGeometry} from "../canvas/interactive-html-pages";
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { sceneCoordsToViewportCoords, viewportCoordsToSceneCoords } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { roomObjectAtPoint, roomObjectsAlongEraser, type RoomObjectGeometry, type RoomVisibleObject } from './room-object-edit';
import {TextBoxHandles} from '../canvas/TextBoxHandles';
import {textBoxHandleAtPoint,draggedTextBoxGeometry,type TextBoxHandle,type TextBoxFrame} from '../canvas/text-box-geometry';
import {transformedTextBox} from '../canvas/text-box-transform';
import {RichTextCanvasPreview} from '../canvas/RichTextCanvasPreview';
import type {RoomObjectPreview} from './room-object-preview';

type Handle='move'|'size'|TextBoxHandle;
type Drag={pointerId:number;object:RoomVisibleObject;start:{x:number;y:number};handle:Handle;moved:boolean};
const geometry=(object:RoomVisibleObject):RoomObjectGeometry=>({x:object.x,y:object.y,width:object.width,height:object.height,angle:object.angle});

export function RoomObjectInput({api,mode,objects,onTransform,onErase,onErasePreview,onPreview,pendingPreview}:{
  api:ExcalidrawImperativeAPI;mode:'selection'|'eraser';objects:readonly RoomVisibleObject[];
  onTransform(object:RoomVisibleObject,next:RoomObjectGeometry):void;
  onErase(objects:RoomVisibleObject[]):void;
  onErasePreview(objects:RoomVisibleObject[]):void;
  onPreview(object:RoomVisibleObject|null,next?:RoomObjectGeometry):void;
  pendingPreview?:RoomObjectPreview|null;
}){
  useUiLocale();
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [preview,setPreview]=useState<RoomObjectGeometry|null>(null);
  const [cameraRevision,setCameraRevision]=useState(0);
  const root=useRef<HTMLDivElement>(null);
  const drag=useRef<Drag|null>(null);
  const latestPreview=useRef<RoomObjectGeometry|null>(null);
  const keyboard=useRef<{object:RoomVisibleObject;next:RoomObjectGeometry}|null>(null);
  const updatePreview=(object:RoomVisibleObject,next:RoomObjectGeometry)=>{latestPreview.current=next;setPreview(next);onPreview(object,next);};
  const [cursor,setCursor]=useState<{x:number;y:number}|null>(null);
  const eraserPointer=useRef<number|null>(null);
  const previousPoint=useRef<{x:number;y:number}|null>(null);
  const erased=useRef(new Map<string,RoomVisibleObject>());
  useEffect(()=>{
    const scroll=api.onScrollChange(()=>setCameraRevision(value=>value+1));
    return()=>scroll();
  },[api]);
  useEffect(()=>{if(selectedId&&!objects.some(object=>object.id===selectedId))setSelectedId(null);},[objects,selectedId]);
  useEffect(()=>{setSelectedId(null);setPreview(null);drag.current=null;erased.current.clear();eraserPointer.current=null;previousPoint.current=null;setCursor(null);},[mode]);
  useEffect(()=>{
    const cancel=()=>{drag.current=null;keyboard.current=null;latestPreview.current=null;setPreview(null);onPreview(null);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&(drag.current||keyboard.current)){event.preventDefault();cancel();}};
    window.addEventListener('blur',cancel);window.addEventListener('keydown',escape,true);
    return()=>{window.removeEventListener('blur',cancel);window.removeEventListener('keydown',escape,true);if(drag.current||keyboard.current)onPreview(null);};
  },[mode]);
  const point=(event:ReactPointerEvent<HTMLDivElement>)=>viewportCoordsToSceneCoords(event,api.getAppState());
  const showCursor=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    setCursor({x:event.clientX-rect.left,y:event.clientY-rect.top});
  };
  const eraseTo=(current:{x:number;y:number})=>{
    const hits=roomObjectsAlongEraser(objects.filter(object=>object.erasable&&!erased.current.has(object.id)),
      previousPoint.current??current,current,24/api.getAppState().zoom.value);
    previousPoint.current=current;
    for(const hit of hits)if(erased.current.size<64)erased.current.set(hit.id,hit);
    if(hits.length)onErasePreview([...erased.current.values()]);
  };
  const down=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(event.button!==0||!event.isPrimary||eraserPointer.current!==null)return;
    event.preventDefault();event.stopPropagation();event.currentTarget.focus();
    const current=point(event),margin=12/api.getAppState().zoom.value;
    if(mode==='eraser'){
      eraserPointer.current=event.pointerId;previousPoint.current=null;
      erased.current.clear();showCursor(event);eraseTo(current);
    }else{
      const textGrip=(event.target as Element).closest('[data-text-box-handle]');
      const rect=event.currentTarget.getBoundingClientRect();
      const handle=textGrip&&textFrame?textBoxHandleAtPoint(textFrame,{x:event.clientX-rect.left,y:event.clientY-rect.top})??undefined
        :(event.target as Element).closest<HTMLElement>('[data-room-handle]')?.dataset.roomHandle as Handle|undefined;
      const selected=handle?objects.find(object=>object.id===selectedId):null;
      if(textGrip&&handle)event.currentTarget.querySelector<HTMLButtonElement>(`[data-text-box-handle="${handle}"]`)?.focus({preventScroll:true});
      const hit=selected??roomObjectAtPoint(objects,current,margin);
      setSelectedId(hit?.id??null);setPreview(null);latestPreview.current=null;
      drag.current=hit?{pointerId:event.pointerId,object:hit,start:current,handle:handle??'move',moved:false}:null;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(mode==='eraser'&&event.isPrimary)showCursor(event);
    if(!event.currentTarget.hasPointerCapture(event.pointerId))return;
    const current=point(event);
    if(mode==='eraser'){
      if(eraserPointer.current===event.pointerId)eraseTo(current);
      return;
    }
    const active=drag.current;if(!active||active.pointerId!==event.pointerId)return;
    const dx=current.x-active.start.x,dy=current.y-active.start.y;
    if(Math.hypot(dx,dy)>3/api.getAppState().zoom.value)active.moved=true;
    if(!active.moved)return;
    const base=active.object;
    if(active.handle==='move')updatePreview(base,{...geometry(base),x:base.x+dx,y:base.y+dy});
    else if(base.textContent&&active.handle!=='size'){
      let next=draggedTextBoxGeometry(base,active.handle,{x:dx,y:dy});
      if(active.handle==='rotate'){
        const cx=base.x+base.width/2,cy=base.y+base.height/2;
        next={...base,angle:base.angle+Math.atan2(current.y-cy,current.x-cx)-Math.atan2(active.start.y-cy,active.start.x-cx)};
      }
      const result=transformedTextBox(base.textContent,base,next,active.handle);
      updatePreview(base,{...result.geometry,textHandle:active.handle});
    }
    else if(active.handle==='size'&&base.pageOrientation)updatePreview(base,resizeHtmlPageGeometry(base,dx,dy));
    else if(active.handle==='size'){
      const cosine=Math.cos(base.angle),sine=Math.sin(base.angle);
      const localX=dx*cosine+dy*sine,localY=-dx*sine+dy*cosine;
      const width=Math.max(1,base.width+localX),height=Math.max(1,base.height+localY);
      updatePreview(base,{...geometry(base),x:base.x-(width-base.width)/2,y:base.y-(height-base.height)/2,width,height});
    }else{
      const center={x:base.x+base.width/2,y:base.y+base.height/2};
      const start=Math.atan2(active.start.y-center.y,active.start.x-center.x);
      const finish=Math.atan2(current.y-center.y,current.x-center.x);
      updatePreview(base,{...geometry(base),angle:base.angle+finish-start});
    }
  };
  const up=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(!event.currentTarget.hasPointerCapture(event.pointerId))return;
    event.preventDefault();event.stopPropagation();
    if(mode==='eraser'){
      eraseTo(point(event));eraserPointer.current=null;previousPoint.current=null;
      if(event.pointerType==='touch')setCursor(null);
      if(erased.current.size)onErase([...erased.current.values()]);
      erased.current.clear();event.currentTarget.releasePointerCapture(event.pointerId);return;
    }
    move(event);
    const active=drag.current,next=latestPreview.current;drag.current=null;
    if(active?.moved&&next)onTransform(active.object,next);else onPreview(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
    latestPreview.current=null;setPreview(null);
  };
  const cancel=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
    if(mode==='eraser'){onErasePreview([]);eraserPointer.current=null;previousPoint.current=null;setCursor(null);}
    drag.current=null;keyboard.current=null;latestPreview.current=null;erased.current.clear();setPreview(null);onPreview(null);
  };
  const selected=objects.find(object=>object.id===selectedId);
  const bounds=selected&&api.getAppState();
  const pending=selected&&pendingPreview?.object.id===selected.id?pendingPreview:null;
  const visible=selected&&bounds?preview??pending?.geometry??geometry(selected):null;
  const center=visible&&bounds?sceneCoordsToViewportCoords({sceneX:visible.x+visible.width/2,sceneY:visible.y+visible.height/2},bounds):null;
  const rect=root.current?.getBoundingClientRect();
  const textFrame:TextBoxFrame|null=visible&&center&&selected?.textContent?{centerX:center.x-(rect?.left??0),centerY:center.y-(rect?.top??0),
    width:visible.width*bounds!.zoom.value,height:visible.height*bounds!.zoom.value,angle:visible.angle}:null;
  const richPreview=textFrame&&visible&&selected?.textContent?.richText&&(preview||pending)
    ?visible.textHandle?transformedTextBox(selected.textContent,selected,visible,visible.textHandle).content:selected.textContent:null;
  const keyboardHandle=(handle:Handle,event:ReactKeyboardEvent<HTMLElement>)=>{
    if(!selected||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||event.altKey||event.metaKey||event.ctrlKey)return;
    event.preventDefault();event.stopPropagation();
    const base=keyboard.current?.next??geometry(selected);
    let next:RoomObjectGeometry;
    if(handle==='move'){
      const step=event.shiftKey?10:1;
      next={...base,x:base.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0),
        y:base.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)};
    }else if(handle==='rotate'){
      const step=event.key==='ArrowLeft'||event.key==='ArrowDown'?-Math.PI/12:Math.PI/12;
      next={...base,angle:base.angle+step};
    }else if(selected.textContent&&handle!=='size'){
      const factor=(event.key==='ArrowLeft'||event.key==='ArrowDown') ? .95 : 1.05;
      const c=Math.cos(base.angle),s=Math.sin(base.angle),dx=base.width*(factor-1)*(handle.includes('w')?-1:1);
      const dy=(handle==='w'||handle==='e'?0:base.height*(factor-1)*(handle.includes('n')?-1:1));
      const proposal=draggedTextBoxGeometry(base,handle,{x:dx*c-dy*s,y:dx*s+dy*c});
      next={...transformedTextBox(selected.textContent,selected,proposal,handle).geometry,textHandle:handle};
    }else{
      const scale=event.key==='ArrowLeft'||event.key==='ArrowDown'?0.95:1.05;
      const width=Math.max(1,base.width*scale),height=Math.max(1,base.height*scale);
      next={...base,x:base.x-(width-base.width)/2,y:base.y-(height-base.height)/2,width,height};
    }
    if(selected.textContent&&handle==='rotate')next.textHandle='rotate';
    keyboard.current={object:keyboard.current?.object??selected,next};updatePreview(selected,next);
  };
  const finishKeyboard=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||!keyboard.current)return;
    event.preventDefault();event.stopPropagation();
    const active=keyboard.current;keyboard.current=null;latestPreview.current=null;setPreview(null);onTransform(active.object,active.next);
  };
  void cameraRevision;
  return <div ref={root} className={`room-object-input is-${mode}`} tabIndex={-1} aria-label={t("Objektauswahl vorne")} onKeyDown={event=>{if(!(event.target instanceof HTMLButtonElement))keyboardHandle('move',event);}} onKeyUp={finishKeyboard} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onPointerLeave={()=>{if(eraserPointer.current===null)setCursor(null);}}>
    {mode==='eraser'&&cursor&&<div className="room-eraser-cursor" aria-hidden style={{left:cursor.x,top:cursor.y}}/>}
    {richPreview&&textFrame&&visible&&<RichTextCanvasPreview content={richPreview} frame={textFrame} sceneWidth={visible.width}/>}
    {mode==='selection'&&textFrame?<TextBoxHandles frame={textFrame} onKeyDown={keyboardHandle}/>:mode==='selection'&&visible&&center&&<div className="room-object-selection" style={{left:center.x,top:center.y,
      width:Math.max(24,visible.width*bounds!.zoom.value),height:Math.max(24,visible.height*bounds!.zoom.value),
      transform:`translate(-50%, -50%) rotate(${visible.angle}rad)`}}>
      <button type="button" className="room-object-selection__rotate" data-room-handle="rotate"
        aria-label={t("Objekt drehen")} title={t("Mit Ziehen oder Pfeiltasten drehen")} onKeyDown={event=>keyboardHandle('rotate',event)}/>
      <button type="button" className="room-object-selection__size" data-room-handle="size"
        aria-label={t("Objektgröße ändern")} title={t("Mit Ziehen oder Pfeiltasten skalieren")} onKeyDown={event=>keyboardHandle('size',event)}/>
    </div>}
  </div>;
}

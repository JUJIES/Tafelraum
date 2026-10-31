import { t, useUiLocale } from "../i18n";
import {resizeHtmlPageGeometry} from "./interactive-html-pages";
import {flushSync} from "react-dom";
import {useEffect, useRef, type PointerEvent as ReactPointerEvent} from 'react';
import {CaptureUpdateAction, viewportCoordsToSceneCoords} from '@excalidraw/excalidraw';
import type {ExcalidrawImperativeAPI} from '@excalidraw/excalidraw/types';
import type {ExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import type {InteractiveHtmlCanvasFrameData} from './InteractiveHtmlCanvasFrame';
import {transformMaterialBundle, type CanvasObjectGeometry} from './material-transform';

type Drag = {pointerId:number;handle:'size'|'rotate';base:ExcalidrawElement;source:readonly ExcalidrawElement[];start:{x:number;y:number};next:CanvasObjectGeometry};
export function HtmlPageSelection({api,frame,onBusy}:{api:ExcalidrawImperativeAPI;frame:InteractiveHtmlCanvasFrameData;onBusy(active:boolean):void}) {
  useUiLocale();
  const drag=useRef<Drag|null>(null);
  const restore=(active:Drag, capture:CaptureUpdateActionType=CaptureUpdateAction.NEVER)=>{
    const ids=new Set(transformMaterialBundle(active.base,active.source,active.base).map(item=>item.original.id));
    api.updateScene({elements:api.getSceneElements().map(item=>ids.has(item.id)?active.source.find(original=>original.id===item.id)??item:item),captureUpdate:capture});
  };
  useEffect(()=>{
    const cancel=()=>{const active=drag.current;drag.current=null;if(active)restore(active);onBusy(false);};
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'&&drag.current){event.preventDefault();event.stopPropagation();cancel();}};
    window.addEventListener('blur',cancel);window.addEventListener('keydown',key,true);
    return()=>{window.removeEventListener('blur',cancel);window.removeEventListener('keydown',key,true);if(drag.current)cancel();};
  },[api]);
  const update=(active:Drag,next:CanvasObjectGeometry,capture:CaptureUpdateActionType)=>{
    const replacements=new Map(transformMaterialBundle(active.base,active.source,next).map(item=>[item.original.id,item.updated]));
    api.updateScene({elements:api.getSceneElements().map(item=>replacements.get(item.id)??item),captureUpdate:capture});
  };
  const down=(event:ReactPointerEvent<HTMLButtonElement>,handle:'size'|'rotate')=>{
    if(event.button!==0||!event.isPrimary||drag.current)return;
    const base=api.getSceneElements().find(item=>item.id===frame.elementId&&!item.isDeleted&&!item.locked);
    if(!base)return;
    event.preventDefault();event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);
    drag.current={pointerId:event.pointerId,handle,base,source:api.getSceneElements().slice(),start:viewportCoordsToSceneCoords(event,api.getAppState()),next:base};onBusy(true);
  };
  const move=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const active=drag.current;if(!active||active.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    const point=viewportCoordsToSceneCoords(event,api.getAppState()),base=active.base;
    const center={x:base.x+base.width/2,y:base.y+base.height/2};
    if(active.handle==='rotate'){
      const angle=base.angle+Math.atan2(point.y-center.y,point.x-center.x)-Math.atan2(active.start.y-center.y,active.start.x-center.x);
      active.next={...base,angle:event.shiftKey?Math.round(angle/(Math.PI/12))*(Math.PI/12):angle};
    }else{
      active.next=resizeHtmlPageGeometry(base,point.x-active.start.x,point.y-active.start.y);
    }
    update(active,active.next,CaptureUpdateAction.EVENTUALLY);
  };
  const up=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const active=drag.current;if(!active||active.pointerId!==event.pointerId)return;
    move(event);drag.current=null;flushSync(()=>restore(active,CaptureUpdateAction.EVENTUALLY));
    update(active,active.next,CaptureUpdateAction.IMMEDIATELY);onBusy(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    event.currentTarget.closest("[data-page-selection]")?.querySelector<HTMLElement>(".excalidraw")?.focus();
  };
  const cancel=(event:ReactPointerEvent<HTMLButtonElement>)=>{
    const active=drag.current;drag.current=null;if(active)restore(active);onBusy(false);
    if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div className="html-page-selection" style={{left:frame.centerX,top:frame.centerY,width:frame.width,height:frame.height,transform:`translate(-50%,-50%) rotate(${frame.angle}rad)`}}>
    {['n','e','s','w','nw','ne','sw'].map(position=><span key={position} className={`html-page-selection__guard at-${position}`} onPointerDown={event=>{event.preventDefault();event.stopPropagation();}}/>)}
    {(['size','rotate'] as const).map(handle=><button key={handle} type="button" className={`html-page-selection__${handle}`} aria-label={handle==='size'?t("Arbeitsblatt proportional skalieren"):t("Arbeitsblatt drehen")}
      onKeyDown={event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
        event.preventDefault();event.stopPropagation();
        const base=api.getSceneElements().find(item=>item.id===frame.elementId&&!item.locked);if(!base)return;
        const positive=event.key==='ArrowRight'||event.key==='ArrowUp',factor=positive?1.05:.95;
        const width=base.width*factor,height=base.height*factor;
        const next=handle==='rotate'?{...base,angle:base.angle+(positive?1:-1)*Math.PI/12}:{...base,x:base.x+(base.width-width)/2,y:base.y+(base.height-height)/2,width,height};
        const replacements=new Map(transformMaterialBundle(base,api.getSceneElements(),next).map(item=>[item.original.id,item.updated]));
        api.updateScene({elements:api.getSceneElements().map(item=>replacements.get(item.id)??item),captureUpdate:CaptureUpdateAction.IMMEDIATELY});
      }} onPointerDown={event=>down(event,handle)} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onLostPointerCapture={event=>{if(drag.current)cancel(event);}}/>)}
  </div>;
}
type CaptureUpdateActionType = typeof CaptureUpdateAction[keyof typeof CaptureUpdateAction];

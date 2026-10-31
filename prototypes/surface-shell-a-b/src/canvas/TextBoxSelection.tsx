import { t, useUiLocale } from "../i18n";
import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent,type KeyboardEvent as ReactKeyboardEvent} from 'react';
import {flushSync} from 'react-dom';
import {CaptureUpdateAction,newElementWith,sceneCoordsToViewportCoords,viewportCoordsToSceneCoords} from '@excalidraw/excalidraw';
import type {ExcalidrawImperativeAPI} from '@excalidraw/excalidraw/types';
import type {ExcalidrawTextElement} from '@excalidraw/excalidraw/element/types';
import {annotationScrollProjection,independentAnnotationMovePatch} from './annotation-move';
import {getCanvasAnnotationSelectionIntent,getCanvasAnnotationEditingGroupId} from './image-annotation-selection';
import {TextBoxHandles} from './TextBoxHandles';
import {textBoxHandleAtPoint,draggedTextBoxGeometry,type TextBoxFrame,type TextBoxHandle} from './text-box-geometry';
import {textBoxTransformPatch} from './text-box-transform';
import {dispatchPointerDownToCanvas} from './projected-media-gestures';

type Selection=TextBoxFrame&{id:string};
type Drag={original:ExcalidrawTextElement;base:ExcalidrawTextElement;handle:TextBoxHandle;start:{x:number;y:number};pointerId:number;target:HTMLElement;moved:boolean};

export function TextBoxSelection({api,root,scrollOffsets,onError,panReady,onBusy}:{api:ExcalidrawImperativeAPI;root:HTMLElement;panReady:boolean;onBusy:(active:boolean)=>void;
  scrollOffsets:ReadonlyMap<string,{x:number;y:number}>;onError:(message:string)=>void}) {
  useUiLocale();
  const [selection,setSelection]=useState<Selection|null>(null);
  const drag=useRef<Drag|null>(null);
  const selectedText=()=>{
    const state=api.getAppState();
    if(panReady||state.activeTool.type!=='selection'||state.editingTextElement||state.croppingElementId)return null;
    const selected=api.getSceneElements().filter(item=>!item.isDeleted&&state.selectedElementIds[item.id]);
    const item=selected.length===1&&selected[0].type==='text'?selected[0]:null;
    if(!item||item.locked||item.containerId)return null;
    // Ordinary engine groups retain their own selection/transform contract.
    if(item.groupIds.length&&(getCanvasAnnotationSelectionIntent(item)?.mode!=='annotation'||getCanvasAnnotationEditingGroupId(item)!==null))return null;
    return item;
  };
  const normalized=(item:ExcalidrawTextElement)=>{
    const projection=annotationScrollProjection(item,api.getSceneElements(),scrollOffsets);
    return {...item,...independentAnnotationMovePatch(item,{x:0,y:0},projection.translation,projection.currentScrollAnchor)};
  };
  const restore=(active:Drag,capture:typeof CaptureUpdateAction[keyof typeof CaptureUpdateAction]=CaptureUpdateAction.NEVER)=>api.updateScene({
    elements:api.getSceneElementsIncludingDeleted().map(item=>item.id===active.original.id?active.original:item),
    appState:{editingGroupId:null,selectedElementIds:{[active.original.id]:true},selectedGroupIds:{}},captureUpdate:capture,
  });
  const cancel=()=>{
    const active=drag.current;drag.current=null;
    if(active){restore(active);if(active.target.hasPointerCapture(active.pointerId))active.target.releasePointerCapture(active.pointerId);}
    onBusy(false);
  };
  useEffect(()=>{
    let frame=0;
    const refresh=()=>{
      const item=selectedText(),state=api.getAppState(),rect=root.getBoundingClientRect();
      const visible=item&&normalized(item);
      const center=visible&&sceneCoordsToViewportCoords({sceneX:visible.x+visible.width/2,sceneY:visible.y+visible.height/2},state);
      const next=visible&&center?{id:visible.id,centerX:center.x-rect.left,centerY:center.y-rect.top,
        width:visible.width*state.zoom.value,height:visible.height*state.zoom.value,angle:visible.angle}:null;
      setSelection(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);
    };
    const scroll=(event:MessageEvent)=>{if(event.data?.type==='tafelraum:interactive-scroll'){
      cancelAnimationFrame(frame);frame=requestAnimationFrame(refresh);
    }};
    const resize=new ResizeObserver(refresh);resize.observe(root);
    const stop=api.onChange(refresh),stopScroll=api.onScrollChange(refresh);
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&drag.current){event.preventDefault();event.stopPropagation();cancel();}};
    window.addEventListener('message',scroll);window.addEventListener('blur',cancel);window.addEventListener('keydown',escape,true);refresh();
    return()=>{stop();stopScroll();resize.disconnect();cancelAnimationFrame(frame);window.removeEventListener('message',scroll);
      window.removeEventListener('blur',cancel);window.removeEventListener('keydown',escape,true);cancel();};
  },[api,root,scrollOffsets,panReady]);

  const down=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(event.button!==0||!event.isPrimary||drag.current||!selection)return;
    event.preventDefault();event.stopPropagation();
    const rect=root.getBoundingClientRect(),handle=textBoxHandleAtPoint(selection,{x:event.clientX-rect.left,y:event.clientY-rect.top});
    if(!handle){dispatchPointerDownToCanvas(root,event.nativeEvent);return;}
    const original=selectedText();if(!original)return;
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-text-box-handle="${handle}"]`)?.focus({preventScroll:true});
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current={original,base:normalized(original),handle,start:viewportCoordsToSceneCoords(event,api.getAppState()),
      pointerId:event.pointerId,target:event.currentTarget,moved:false};
    onBusy(true);
  };
  const move=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const active=drag.current;if(!active||active.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    const point=viewportCoordsToSceneCoords(event,api.getAppState()),base=active.base;
    const delta={x:point.x-active.start.x,y:point.y-active.start.y};
    if(Math.hypot(delta.x,delta.y)*api.getAppState().zoom.value<2&&!active.moved)return;
    active.moved=true;
    let next=draggedTextBoxGeometry(base,active.handle,delta);
    if(active.handle==='rotate'){
      const cx=base.x+base.width/2,cy=base.y+base.height/2;
      let angle=base.angle+Math.atan2(point.y-cy,point.x-cx)-Math.atan2(active.start.y-cy,active.start.x-cx);
      if(event.shiftKey)angle=Math.round(angle/(Math.PI/12))*(Math.PI/12);
      next={...base,angle};
    }
    try{
      const patch=textBoxTransformPatch(base,base,next,active.handle);
      api.updateScene({elements:api.getSceneElementsIncludingDeleted().map(item=>item.id===base.id?newElementWith(item,patch):item),captureUpdate:CaptureUpdateAction.EVENTUALLY});
    }catch(error){cancel();onError(error instanceof Error?error.message:t("Text konnte nicht geändert werden."));}
  };
  const up=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const active=drag.current;if(!active||active.pointerId!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    move(event);if(drag.current!==active)return;
    drag.current=null;
    const final=api.getSceneElements().find(item=>item.id===active.original.id);
    if(active.moved&&final){
      flushSync(()=>restore(active,CaptureUpdateAction.EVENTUALLY));
      api.updateScene({elements:api.getSceneElementsIncludingDeleted().map(item=>item.id===final.id?newElementWith(final,{}):item),
        appState:{editingGroupId:null,selectedElementIds:{[final.id]:true},selectedGroupIds:{}},captureUpdate:CaptureUpdateAction.IMMEDIATELY});
    }
    if(active.target.hasPointerCapture(active.pointerId))active.target.releasePointerCapture(active.pointerId);
    onBusy(false);
  };
  const key=(handle:TextBoxHandle,event:ReactKeyboardEvent<HTMLButtonElement>)=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||event.altKey||event.metaKey||event.ctrlKey)return;
    const original=selectedText();if(!original)return;
    event.preventDefault();event.stopPropagation();
    const base=normalized(original),factor=(event.key==='ArrowLeft'||event.key==='ArrowDown') ? .95 : 1.05;
    const signX=handle.includes('w')?-1:1,signY=handle.includes('n')?-1:1,c=Math.cos(base.angle),s=Math.sin(base.angle);
    const dx=base.width*(factor-1)*signX,dy=(handle==='w'||handle==='e'?0:base.height*(factor-1)*signY);
    const next=handle==='rotate'?{...base,angle:base.angle+(factor<1?-1:1)*Math.PI/12}
      :draggedTextBoxGeometry(base,handle,{x:dx*c-dy*s,y:dx*s+dy*c});
    try{api.updateScene({elements:api.getSceneElementsIncludingDeleted().map(item=>item.id===base.id?newElementWith(item,textBoxTransformPatch(base,base,next,handle)):item),captureUpdate:CaptureUpdateAction.IMMEDIATELY});}
    catch(error){onError(error instanceof Error?error.message:t("Text konnte nicht geändert werden."));}
  };
  return selection?<div className="text-box-selection-layer" onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}
    onLostPointerCapture={()=>{if(drag.current)cancel();}}><TextBoxHandles frame={selection} onPointerDown={down} onKeyDown={key}/></div>:null;
}

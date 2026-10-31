import { useCallback, useEffect, useRef } from 'react';
import { sceneCoordsToViewportCoords } from '@excalidraw/excalidraw';
import type { ExcalidrawFreeDrawElement, ExcalidrawLinearElement } from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { RoomInteractiveMaterial } from '../canvas/interactive-html-live';
import { useInkInput, type ExternalInkCommit } from '../canvas/useInkInput';

type InkElement = ExcalidrawFreeDrawElement | ExcalidrawLinearElement;

export function RoomInkInput({api,tool,color,width,materials,pendingInkIds,onCommit,onPreviewChange}:{
  api:ExcalidrawImperativeAPI|null;
  tool:'pen'|'marker';
  color:string;
  width:number;
  materials:readonly RoomInteractiveMaterial[];
  pendingInkIds:readonly string[];
  onCommit(stroke:ExternalInkCommit):void;
  onPreviewChange(id:string|null):void;
}){
  const previewId=useRef<string|null>(null);
  const activeId=useRef<string|null>(null);
  const previews=useRef(new Map<string,InkElement>());
  const materialsRef=useRef(materials);materialsRef.current=materials;
  const canvasRef=useRef<HTMLCanvasElement>(null);

  const paint=useCallback(()=>{
    const canvas=canvasRef.current;
    if(!api||!canvas)return;
    const rect=canvas.getBoundingClientRect();
    const ratio=window.devicePixelRatio||1;
    const width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const context=canvas.getContext('2d');if(!context)return;
    context.setTransform(ratio,0,0,ratio,0,0);
    context.clearRect(0,0,rect.width,rect.height);
    if(!previews.current.size||!materialsRef.current.length)return;
    const state=api.getAppState(),zoom=state.zoom.value;
    // Native ink is below the HTML iframe. Paint the same transient geometry
    // only within HTML frames until the authoritative annotation arrives.
    for(const material of materialsRef.current){
      const center=sceneCoordsToViewportCoords({sceneX:material.x+material.width/2,sceneY:material.y+material.height/2},state);
      context.save();
      context.translate(center.x-rect.left,center.y-rect.top);
      context.rotate(material.angle);
      context.beginPath();context.rect(-material.width*zoom/2,-material.height*zoom/2,material.width*zoom,material.height*zoom);
      context.clip();
      context.setTransform(ratio,0,0,ratio,0,0);
      for(const element of previews.current.values()){
        const origin=sceneCoordsToViewportCoords({sceneX:element.x,sceneY:element.y},state);
        context.beginPath();
        element.points.forEach(([x,y],index)=>{
          const px=origin.x-rect.left+x*zoom,py=origin.y-rect.top+y*zoom;
          if(index===0)context.moveTo(px,py);else context.lineTo(px,py);
        });
        context.globalAlpha=element.opacity/100;
        if(element.type==='freedraw'){
          context.strokeStyle=element.strokeColor;context.lineWidth=element.strokeWidth*zoom;
          context.lineCap='round';context.lineJoin='round';context.stroke();
        }else{
          context.fillStyle=element.backgroundColor;context.fill('evenodd');
        }
      }
      context.restore();
    }
  },[api]);

  const onTransient=useCallback((element:InkElement)=>{
    previews.current.set(element.id,element);
    paint();
  },[paint]);
  const handlePreviewChange=useCallback((id:string|null)=>{
    activeId.current=id;onPreviewChange(id);
  },[onPreviewChange]);
  const start=useInkInput(api,tool,color,width,previewId,handlePreviewChange,undefined,onCommit,onTransient);

  useEffect(()=>{
    const keep=new Set(pendingInkIds);
    if(activeId.current)keep.add(activeId.current);
    for(const id of previews.current.keys())if(!keep.has(id))previews.current.delete(id);
    paint();
  },[pendingInkIds,paint]);
  useEffect(()=>{
    if(!api)return;
    const scroll=api.onScrollChange(paint),change=api.onChange(paint);
    const observer=new ResizeObserver(paint);
    if(canvasRef.current)observer.observe(canvasRef.current);
    paint();
    return()=>{scroll();change();observer.disconnect();};
  },[api,paint]);

  return <div className="room-ink-input" onPointerDownCapture={event=>{start(event,false);}}>
    <canvas ref={canvasRef} className="interactive"/>
  </div>;
}

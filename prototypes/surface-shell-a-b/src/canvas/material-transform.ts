import {htmlPageSize,readHtmlPageOrientation} from "./interactive-html-pages.ts";
import {newElementWith} from '@excalidraw/excalidraw';
import type {ExcalidrawElement} from '@excalidraw/excalidraw/element/types';
import {getCanvasAnnotationSelectionIntent} from './image-annotation-selection.ts';
export type CanvasObjectGeometry = Pick<ExcalidrawElement,'x'|'y'|'width'|'height'|'angle'>;
/** A gesture only supplies geometry. The native source retains all
 * styling, material provenance, bindings and file references. */
export function transformCanvasObject(element:ExcalidrawElement,geometry:CanvasObjectGeometry):ExcalidrawElement {
  const pageOrientation=readHtmlPageOrientation(element.customData?.interactiveHtmlPageOrientation);
  if(pageOrientation){
    const page=htmlPageSize(pageOrientation);
    if(Math.abs(geometry.width/geometry.height-page.width/page.height)>1e-6)throw new Error('Arbeitsblätter können nur proportional skaliert werden.');
  }
  const scaleX=geometry.width/Math.max(1,element.width);
  const scaleY=geometry.height/Math.max(1,element.height);
  const transformedPoints='points' in element
    ?element.points.map(([x,y])=>[x*scaleX,y*scaleY] as [number,number]):null;
  if(transformedPoints?.some(point=>point.some(value=>!Number.isFinite(value)||Math.abs(value)>1_000_000)))
    throw new Error('Die Objektgröße überschreitet den zulässigen Bereich.');
  const points=transformedPoints?{points:transformedPoints}:{};
  const font=element.type==='text'?{fontSize:Math.min(10_000,Math.max(1,element.fontSize*Math.min(scaleX,scaleY)))}:{};
  const angle=((geometry.angle%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
  return newElementWith(element,{...geometry,angle,...points,...font} as Partial<ExcalidrawElement>);
}

/** Native material and shape bundles keep their annotations and covers together. */
export function transformMaterialBundle(element:ExcalidrawElement,source:readonly ExcalidrawElement[],next:CanvasObjectGeometry){
  const intent=getCanvasAnnotationSelectionIntent(element);
  const members=intent?.mode==='bundle'
    ?source.filter(candidate=>!candidate.isDeleted&&(candidate.id===element.id||candidate.groupIds.includes(intent.groupId)))
    :[element];
  const sx=next.width/Math.max(1,element.width),sy=next.height/Math.max(1,element.height);
  const previousCenter={x:element.x+element.width/2,y:element.y+element.height/2};
  const newCenter={x:next.x+next.width/2,y:next.y+next.height/2};
  const delta=next.angle-element.angle;
  return members.map(original=>{
    if(original.id===element.id)return {original,updated:transformCanvasObject(original,next)};
    const center={x:original.x+original.width/2,y:original.y+original.height/2};
    const dx=center.x-previousCenter.x,dy=center.y-previousCenter.y;
    const localX=dx*Math.cos(element.angle)+dy*Math.sin(element.angle);
    const localY=-dx*Math.sin(element.angle)+dy*Math.cos(element.angle);
    const scaledX=localX*sx,scaledY=localY*sy;
    const movedX=newCenter.x+scaledX*Math.cos(next.angle)-scaledY*Math.sin(next.angle);
    const movedY=newCenter.y+scaledX*Math.sin(next.angle)+scaledY*Math.cos(next.angle);
    const width=Math.max(1,original.width*sx),height=Math.max(1,original.height*sy);
    return {original,updated:transformCanvasObject(original,{
      x:movedX-width/2,y:movedY-height/2,width,height,angle:original.angle+delta,
    })};
  });
}

/** Paged materials retain paper proportions even through multi-selection/API transforms. */
export function normalizeHtmlPageFrames(elements: readonly ExcalidrawElement[]) {
  let result=elements;
  for(const item of elements){
    const orientation=readHtmlPageOrientation(item.customData?.interactiveHtmlPageOrientation);
    if(item.isDeleted||!orientation)continue;
    const page=htmlPageSize(orientation),height=item.width*page.height/page.width;
    if(Math.abs(item.height-height)<1e-6)continue;
    const next={x:item.x,y:item.y+(item.height-height)/2,width:item.width,height,angle:item.angle};
    const replacements=new Map(transformMaterialBundle(item,result,next).map(update=>[update.original.id,update.updated]));
    result=result.map(element=>replacements.get(element.id)??element);
  }
  return result;
}

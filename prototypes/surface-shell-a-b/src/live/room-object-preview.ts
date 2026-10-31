import {transformedTextBox} from '../canvas/text-box-transform.ts';
import type {Scene,PublicElement} from '../../../../shared/live-canvas/protocol.ts';
import type {RoomInteractiveMaterial} from '../canvas/interactive-html-live.ts';
import {projectInteractiveHtmlAnnotations} from '../canvas/interactive-html-annotations.ts';
import type {RoomVisibleObject,RoomObjectGeometry} from './room-object-edit.ts';

export type RoomObjectPreview={object:RoomVisibleObject;geometry:RoomObjectGeometry;revision:number};

/** A disposable view of one confirmed object, using the existing native and
 * clipped HTML renderers. Never sent back as a scene or stored in the archive. */
export function previewRoomAnnotation(scene:Scene,preview:RoomObjectPreview|null,scroll:ReadonlyMap<string,{x:number;y:number}>):Scene {
  const source=preview?.object.renderElement;
  if(!preview||!source||!preview.object.annotation)return scene;
  const {object}=preview;
  const {textHandle,...geometry}=preview.geometry;
  const text=textHandle&&object.textContent?transformedTextBox(object.textContent,object,geometry,textHandle):null;
  const sx=geometry.width/Math.max(1,object.width),sy=geometry.height/Math.max(1,object.height);
  const moved:PublicElement={...source,...geometry,id:object.id,version:(source.version??0)+preview.revision,
    ...(source.points?{points:source.points.map(([x,y])=>[x*sx,y*sy])}:{}),
    ...(text?{fontSize:text.content.fontSize,text:text.content.text}:source.fontSize?{fontSize:source.fontSize*Math.min(sx,sy)}:{})};
  const candidate={...moved,angle:moved.angle??0,opacity:moved.opacity??100,strokeColor:moved.strokeColor??'#000000',
    strokeWidth:moved.strokeWidth??1,version:moved.version??1,groupIds:[],
    customData:object.markerRibbon?{role:'marker-ribbon'}:{}};
  const materials=(scene.materials as RoomInteractiveMaterial[]|undefined)?.map(material=>{
    const id=material.roomLocalId??material.instanceId,current=scroll.get(id)??{x:0,y:0};
    const projected=projectInteractiveHtmlAnnotations({...material,id},[candidate],'',{},new Set(),current,object.id);
    const annotations=projected.annotations.map(annotation=>annotation.kind==='stroke'?{
      kind:'stroke' as const,x:annotation.x,y:annotation.y,width:annotation.width,height:annotation.height,angle:annotation.angle,
      opacity:annotation.opacity,strokeColor:annotation.strokeColor,strokeWidth:annotation.strokeWidth,
      points:annotation.points.map(point=>[point.x,point.y] as [number,number]),
      ...(annotation.fillColor?{fillColor:annotation.fillColor}:{}),roomObjectId:object.id,roomScrollAnchor:current,
    }:{kind:'text' as const,x:annotation.x,y:annotation.y,width:annotation.width,height:annotation.height,angle:annotation.angle,
      opacity:annotation.opacity,color:annotation.color,fontSize:annotation.fontSize,lineHeight:annotation.lineHeight,
      text:annotation.text,textAlign:annotation.textAlign,roomObjectId:object.id,roomScrollAnchor:current});
    return {...material,annotations:[...(material.annotations??[]).filter(annotation=>annotation.roomObjectId!==object.id),...annotations]};
  });
  return {...scene,coverTransition:undefined,elements:[...scene.elements.filter(element=>element.id!==object.id&&!object.renderElementIds?.includes(element.id)),moved],materials};
}

export function hideRoomAnnotations(scene:Scene,ids:ReadonlySet<string>):Scene {
  if(!ids.size)return scene;
  return {...scene,elements:scene.elements.filter(element=>!ids.has(element.id)),
    materials:(scene.materials as RoomInteractiveMaterial[]|undefined)?.map(material=>({...material,
      annotations:material.annotations?.filter(annotation=>!annotation.roomObjectId||!ids.has(annotation.roomObjectId))}))};
}

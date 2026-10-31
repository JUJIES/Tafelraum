import { imageAnnotationGroupId, isShapeAnnotationGroupId, isIndependentMaterialAnnotation } from './image-annotation-selection.ts';
export {isIndependentMaterialAnnotation} from './image-annotation-selection.ts';
import { materialContainsPoint, isMaterialAnnotationTarget, findTopmostMaterialAnnotationTargetAtPoint } from './material-annotation-targets.ts';
import { getInteractiveHtmlAnnotationScrollTranslation, normalizeInteractiveHtmlContentZoom } from './interactive-html-embed.ts';
import { htmlPageProjection, readHtmlPageOrientation } from './interactive-html-pages.ts';

type Geometry = {id:string;type:string;x:number;y:number;width:number;height:number;angle:number;isDeleted?:boolean;customData?:Record<string,unknown>};
type Annotation = Geometry & {groupIds:readonly string[];containerId?:string|null};
type ScrollOffset = {x:number;y:number};

export function annotationScrollProjection(annotation:Annotation,elements:readonly Geometry[],scrollOffsets:ReadonlyMap<string,ScrollOffset>) {
  const material=elements.find(element=>element.customData?.materialKind==='interactive-html'
    && !element.isDeleted && annotation.groupIds.includes(imageAnnotationGroupId(element.id)));
  if(!material)return {translation:{x:0,y:0}};
  const anchor=annotation.customData?.interactiveHtmlScrollAnchor as ScrollOffset|undefined;
  const current=scrollOffsets.get(material.id)??{x:0,y:0};
  const page=readHtmlPageOrientation(material.customData?.interactiveHtmlPageOrientation);
  const local=getInteractiveHtmlAnnotationScrollTranslation(anchor,current,
    normalizeInteractiveHtmlContentZoom(material.customData?.interactiveHtmlContentZoom),
    page?htmlPageProjection(material.width,material.height,page).scale:undefined);
  const c=Math.cos(material.angle),s=Math.sin(material.angle);
  return {translation:{x:local.x*c-local.y*s,y:local.x*s+local.y*c},
    currentScrollAnchor:{materialId:material.id,...current}};
}

/** Keep native drawing and the clipped HTML projection in the same visible
 * scene coordinates throughout a drag. The original remains the undo basis. */
export function independentAnnotationMovePatch(
  start: Annotation, delta: ScrollOffset, visibleTranslation: ScrollOffset,
  currentScrollAnchor?: ScrollOffset & {materialId:string},
) {
  return {
    x: start.x + delta.x + visibleTranslation.x,
    y: start.y + delta.y + visibleTranslation.y,
    ...(currentScrollAnchor ? {customData:{...start.customData,interactiveHtmlScrollAnchor:currentScrollAnchor}} : {}),
  };
}
/** Called only when an individual object was deliberately dragged, never on material movement. */
export function annotationAfterIndependentMove<T extends Annotation>(
  annotation:T, elements:readonly Geometry[], visibleTranslation={x:0,y:0},
  scrollOffsets:ReadonlyMap<string,ScrollOffset>=new Map(),
):T {
  if(annotation.groupIds.some(isShapeAnnotationGroupId))return annotation;
  const material=elements.find(element=>isMaterialAnnotationTarget(element)
    && annotation.groupIds.includes(imageAnnotationGroupId(element.id)) && element.id!==annotation.id);
  const x=annotation.x+(material?visibleTranslation.x:0),y=annotation.y+(material?visibleTranslation.y:0);
  const center={x:x+annotation.width/2,y:y+annotation.height/2};
  if(material&&materialContainsPoint(material,center))return annotation;
  const destination=isIndependentMaterialAnnotation(annotation)
    ? findTopmostMaterialAnnotationTargetAtPoint(elements.filter(element=>element.id!==annotation.id),center) : null;
  if(!material&&!destination)return annotation;
  const customData={...annotation.customData};
  delete customData.interactiveHtmlScrollAnchor;
  const groupIds=material?annotation.groupIds.filter(id=>id!==imageAnnotationGroupId(material.id)):[...annotation.groupIds];
  if(destination){
    groupIds.push(imageAnnotationGroupId(destination.id));
    if(destination.customData?.materialKind==='interactive-html'){
      const scroll=scrollOffsets.get(destination.id)??{x:0,y:0};
      customData.interactiveHtmlScrollAnchor={materialId:destination.id,x:scroll.x,y:scroll.y};
    }
  }
  return {...annotation,x,y,customData,groupIds};
}

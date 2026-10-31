import type { ExcalidrawElement, ExcalidrawImageElement } from '@excalidraw/excalidraw/element/types';
import { applyImageCropRect, type NormalizedImageCropRect } from './image-crop.ts';
import { imageAnnotationGroupId } from './image-annotation-selection.ts';

// Existing pixel geometry and bound annotations must never move implicitly.
export function documentImageCropAllowed(image: ExcalidrawImageElement, elements: readonly ExcalidrawElement[]) {
  return !image.crop && image.scale[0] === 1 && image.scale[1] === 1
    && !image.groupIds.some(group => group !== imageAnnotationGroupId(image.id)) && !image.boundElements?.length
    && !elements.some(element => !element.isDeleted && element.id !== image.id && (
      element.customData?.imageId === image.id || element.customData?.materialId === image.id
      || element.groupIds.includes(imageAnnotationGroupId(image.id))
    ));
}

export function documentImageTargetUnchanged(before: ExcalidrawImageElement, current: ExcalidrawElement | undefined) {
  return current?.type === 'image' && !current.isDeleted && before.id === current.id
    && before.version === current.version && before.versionNonce === current.versionNonce && before.fileId === current.fileId;
}

export function centeredDocumentCrop(image: ExcalidrawImageElement, rect: NormalizedImageCropRect, natural: {width:number; height:number}) {
  if (rect.x === 0 && rect.y === 0 && rect.width === 1 && rect.height === 1) return {};
  const crop = applyImageCropRect(image, rect, natural);
  return { ...crop, x: image.x + (image.width - crop.width)/2, y: image.y + (image.height - crop.height)/2 };
}

export function centeredDocumentPerspective(image: ExcalidrawImageElement, natural: {width:number; height:number}) {
  const scale = Math.min(Math.abs(image.width)/natural.width, Math.abs(image.height)/natural.height);
  const width=natural.width*scale, height=natural.height*scale;
  return {width,height,x:image.x+(image.width-width)/2,y:image.y+(image.height-height)/2,crop:null};
}

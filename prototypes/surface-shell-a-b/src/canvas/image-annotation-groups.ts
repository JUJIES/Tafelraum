import { newElementWith } from "@excalidraw/excalidraw";
import { eraserLockStateKey, withTemporaryEraserState, withoutTemporaryEraserState } from "./eraser-policy";
import type { ExcalidrawElement, ExcalidrawImageElement } from "@excalidraw/excalidraw/element/types";
import {
  imageGroupIdsAfterIndependentShapeDetach,
  imageAnnotationGroupId,
  independentShapeIds,
  isCanvasAnnotationGroupId,
  isIndependentCanvasShape,
  isShapeAnnotationGroupId,
  shapeAnnotationGroupId,
  shapeAnnotationGroupPrefix,
} from "./image-annotation-selection";
import { isShapedCoverTarget } from "./canvas-cover-geometry";
import { canvasCoverGroupId } from "./canvas-cover-target";
import {
  constrainImageCoverGeometry,
  isImageCoverElement,
} from "./image-cover";
import { isInteractiveHtmlMaterialElement } from "./interactive-html-embed";
import type { InteractiveHtmlScrollOffset } from "./interactive-html-embed";
import { isYouTubeMaterialElement } from "./youtube-embed";
import { isEmbeddedAppElement } from "../embedded-apps";
import { isMarkerRibbonElement, markerRibbonHit } from "./marker-stroke";
import {
  findTopmostCanvasAnnotationTargetAtPoint,
  materialContainsPoint,
} from "./material-annotation-targets";

export {
  getCanvasAnnotationEditingGroupId,
  getCanvasAnnotationSelectionIntent,
  imageAnnotationGroupId,
  isCanvasAnnotationGroupId,
  isImageAnnotationGroupId,
  isShapeAnnotationGroupId,
  preservesIndependentImageAnnotationMultiSelection,
  shapeAnnotationGroupPrefix,
} from "./image-annotation-selection";

const annotatableElementTypes = new Set<ExcalidrawElement["type"]>([
  "arrow",
  "freedraw",
  "line",
  "text",
]);

function isMaterialCoverTarget(element: ExcalidrawElement) {
  return (element.type === "image" && element.customData?.role !== "rich-text-rendition-v1")
    || isYouTubeMaterialElement(element)
    || isInteractiveHtmlMaterialElement(element)
    || isEmbeddedAppElement(element);
}

function elementCenter(element: ExcalidrawElement) {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  };
}

export function detachIndependentShapesFromImages(elements: readonly ExcalidrawElement[]) {
  const shapeIds = independentShapeIds(elements);
  let changed = false;
  const detachedElements = elements.map((element) => {
    const groupIds = imageGroupIdsAfterIndependentShapeDetach(element, shapeIds);
    if (groupIds.length === element.groupIds.length) return element;

    changed = true;
    return newElementWith<ExcalidrawElement>(element, { groupIds });
  });
  return { changed, elements: detachedElements };
}

export function imageContainsPoint(image: ExcalidrawImageElement, point: { x: number; y: number }) {
  return materialContainsPoint(image, point);
}

export function findTopmostImageAtPoint(elements: readonly ExcalidrawElement[], point: { x: number; y: number }) {
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (element.type === "image" && !element.isDeleted && element.customData?.role !== "rich-text-rendition-v1" && imageContainsPoint(element, point)) return element;
  }
  return null;
}

function withGroupId(element: ExcalidrawElement, groupId: string) {
  return element.groupIds.includes(groupId)
    ? element
    : newElementWith<ExcalidrawElement>(element, { groupIds: [...element.groupIds, groupId] });
}

function isShapeInkAnnotation(element: ExcalidrawElement) {
  return element.type === "freedraw" || isMarkerRibbonElement(element);
}

function reconcileShapeAnnotationGroups(elements: readonly ExcalidrawElement[]) {
  const shapes = new Map(elements.filter((element) => !element.isDeleted && isIndependentCanvasShape(element))
    .map((element) => [element.id, element]));
  const coveredShapeIds = new Set(elements.flatMap((element) => {
    const id = isImageCoverElement(element) && !element.isDeleted ? element.customData?.imageId : null;
    return typeof id === "string" && shapes.has(id) ? [id] : [];
  }));
  const annotatedShapeIds = new Set(elements.flatMap((element) => (
    isShapeInkAnnotation(element) && !element.isDeleted
      ? element.groupIds.filter(isShapeAnnotationGroupId)
        .map((groupId) => groupId.slice(shapeAnnotationGroupPrefix.length))
        .filter((id) => shapes.has(id))
      : []
  )));
  let changed = false;
  const prepared = elements.map((element) => {
    const shapeId = shapes.has(element.id) ? element.id
      : element.type === "text" && element.containerId && shapes.has(element.containerId) ? element.containerId
      : isImageCoverElement(element) && typeof element.customData?.imageId === "string" && shapes.has(element.customData.imageId)
        ? element.customData.imageId : null;
    if (shapeId) {
      const groupId = shapeAnnotationGroupId(shapeId);
      const shouldJoin = annotatedShapeIds.has(shapeId) && !element.isDeleted;
      const groupIds = shouldJoin
        ? [...new Set([...element.groupIds, groupId])]
        : element.groupIds.filter((candidate) => candidate !== groupId);
      if (groupIds.length === element.groupIds.length) return element;
      changed = true;
      return newElementWith<ExcalidrawElement>(element, { groupIds });
    }
    if (!isShapeInkAnnotation(element) || element.isDeleted) return element;
    const shapeGroupId = element.groupIds.find(isShapeAnnotationGroupId);
    if (!shapeGroupId) return element;
    const ownerId = shapeGroupId.slice(shapeAnnotationGroupPrefix.length);
    const coverGroupId = canvasCoverGroupId(ownerId);
    const groupIds = coveredShapeIds.has(ownerId)
      ? [...new Set([...element.groupIds, coverGroupId])]
      : element.groupIds.filter((candidate) => candidate !== coverGroupId);
    if (groupIds.length === element.groupIds.length) return element;
    changed = true;
    return newElementWith<ExcalidrawElement>(element, { groupIds });
  });
  return { changed, elements: prepared };
}

export function prepareCanvasAnnotationGroups(elements: readonly ExcalidrawElement[]) {
  const detached = detachIndependentShapesFromImages(elements);
  let changed = detached.changed;
  const preparedElements = detached.elements.map((element) => {
    if (!isMaterialCoverTarget(element) || element.isDeleted) return element;
    const preparedImage = withGroupId(element, imageAnnotationGroupId(element.id));
    changed ||= preparedImage !== element;
    return preparedImage;
  });

  const constrained = constrainImageCoversToImages(preparedElements);
  const shapes = reconcileShapeAnnotationGroups(constrained.elements);
  return { changed: changed || constrained.changed || shapes.changed, elements: shapes.elements };
}

export function constrainImageCoversToImages(elements: readonly ExcalidrawElement[]) {
  const coverTargets = new Map(elements.flatMap((element) => (
    isMaterialCoverTarget(element) && !element.isDeleted
      ? [[element.id, element] as const]
      : []
  )));
  const coveredTargetIds = new Set(elements.flatMap((element) => {
    const imageId = isImageCoverElement(element) && !element.isDeleted
      ? element.customData?.imageId
      : null;
    return typeof imageId === "string" && coverTargets.has(imageId) ? [imageId] : [];
  }));
  let changed = false;
  const groupedElements = elements.map((element) => {
    const imageId = isImageCoverElement(element) && !element.isDeleted
      ? element.customData?.imageId
      : null;
    const targetId = isMaterialCoverTarget(element) && !element.isDeleted
      ? element.id
      : typeof imageId === "string" && coverTargets.has(imageId)
        ? imageId
        : null;
    if (!targetId || !coveredTargetIds.has(targetId)) return element;

    const groupedElement = withGroupId(element, imageAnnotationGroupId(targetId));
    changed ||= groupedElement !== element;
    return groupedElement;
  });
  const groupedTargets = new Map(groupedElements.flatMap((element) => (
    isMaterialCoverTarget(element) && !element.isDeleted
      ? [[element.id, element] as const]
      : []
  )));
  const constrainedElements = groupedElements.map((element) => {
    if (!isImageCoverElement(element) || element.isDeleted) return element;
    const imageId = element.customData?.imageId;
    const image = typeof imageId === "string" ? groupedTargets.get(imageId) : null;
    if (!image) return element;

    // Contour covers retain their target-local aperture; CanvasSurface derives
    // the clipped polygon after material transforms, never from polygon bounds.
    if (isShapedCoverTarget(image) && element.type === "line") return element;
    const geometry = constrainImageCoverGeometry(image, element);
    const isAligned = Math.abs(element.x - geometry.x) < 0.001
      && Math.abs(element.y - geometry.y) < 0.001
      && Math.abs(element.width - geometry.width) < 0.001
      && Math.abs(element.height - geometry.height) < 0.001
      && Math.abs(element.angle - geometry.angle) < 0.001;
    if (isAligned) return element;

    changed = true;
    return newElementWith<ExcalidrawElement>(element, geometry);
  });
  return { changed, elements: constrainedElements };
}

export function attachNewAnnotationsToCanvasTargets(
  elements: readonly ExcalidrawElement[],
  annotationIds: ReadonlySet<ExcalidrawElement["id"]>,
  interactiveHtmlScrollOffsets: ReadonlyMap<ExcalidrawElement["id"], InteractiveHtmlScrollOffset> = new Map(),
) {
  // Membership is decided once at creation time. Existing elements must never
  // be attached merely because a later move places them over material.
  const prepared = prepareCanvasAnnotationGroups(elements);
  const independentShapes = independentShapeIds(prepared.elements);
  let changed = prepared.changed;
  const attachedElements = prepared.elements.map((element) => {
    if (
      !annotationIds.has(element.id)
      || element.isDeleted
      || !annotatableElementTypes.has(element.type)
      || (element.type === "text" && typeof element.containerId === "string" && independentShapes.has(element.containerId))
      || element.groupIds.some(isCanvasAnnotationGroupId)
    ) {
      return element;
    }

    const center = elementCenter(element);
    const containingTarget = findTopmostCanvasAnnotationTargetAtPoint(prepared.elements, center);
    if (!containingTarget) return element;
    if (isIndependentCanvasShape(containingTarget) && !isShapeInkAnnotation(element)) return element;

    changed = true;
    const grouped = withGroupId(element, isIndependentCanvasShape(containingTarget)
      ? shapeAnnotationGroupId(containingTarget.id) : imageAnnotationGroupId(containingTarget.id));
    const scrollOffset = isInteractiveHtmlMaterialElement(containingTarget)
      ? interactiveHtmlScrollOffsets.get(containingTarget.id)
      : null;
    if (!scrollOffset) return grouped;
    return newElementWith<ExcalidrawElement>(grouped, {
      customData: {
        ...grouped.customData,
        interactiveHtmlScrollAnchor: {
          materialId: containingTarget.id,
          x: scrollOffset.x,
          y: scrollOffset.y,
        },
      },
    });
  });

  const shapeGroups = reconcileShapeAnnotationGroups(attachedElements);
  return { changed: changed || shapeGroups.changed, elements: shapeGroups.elements };
}

export function prepareCanvasAnnotationsForEraser(elements: readonly ExcalidrawElement[]) {
  const prepared=withTemporaryEraserState(elements);
  let changed=false;
  const next=prepared.map((element,index)=>{
    if(element===elements[index])return element;
    changed=true;
    return newElementWith(elements[index],{groupIds:element.groupIds,locked:element.locked,customData:element.customData});
  });
  return {changed,elements:next};
}

/** Adapt native filled-line hit testing using the existing transient lock path. */
export function gateMarkerEraserHits(elements: readonly ExcalidrawElement[], point: { x: number; y: number }, radius: number, previous = point) {
  let changed = false;
  const next = elements.map(element => {
    if (element.type !== "line" || !isMarkerRibbonElement(element) || element.isDeleted
      || element.customData?.[eraserLockStateKey] !== false) return element;
    const cx = element.x + element.width / 2, cy = element.y + element.height / 2;
    const c = Math.cos(element.angle), s = Math.sin(element.angle);
    const local = (p: { x: number; y: number }) => ({
      x: (p.x - cx) * c + (p.y - cy) * s + element.width / 2,
      y: -(p.x - cx) * s + (p.y - cy) * c + element.height / 2,
    });
    const start = local(previous), end = local(point);
    let hit = false;
    if (Math.max(start.x, end.x) >= -radius && Math.min(start.x, end.x) <= element.width + radius
      && Math.max(start.y, end.y) >= -radius && Math.min(start.y, end.y) <= element.height + radius) {
      const steps = Math.max(1, Math.ceil(Math.hypot(end.x - start.x, end.y - start.y) / Math.max(1, radius)));
      for (let i = 0; i <= steps && !hit; i++) hit = markerRibbonHit(element.points, {
        x: start.x + (end.x - start.x) * i / steps, y: start.y + (end.y - start.y) * i / steps,
      }, radius);
    }
    const locked = !hit;
    if (element.locked === locked) return element;
    changed = true;
    return newElementWith(element, { locked });
  });
  return { changed, elements: next };
}

export function restoreCanvasAnnotationsAfterEraser(elements: readonly ExcalidrawElement[]) {
  const canonical = withoutTemporaryEraserState(elements);
  return {changed:canonical !== elements, elements:canonical.map((element,index) => element === elements[index]
    ? element : newElementWith(elements[index],{customData:element.customData,groupIds:[...element.groupIds],locked:element.locked}))};
}

export function getImageAnnotationBundle(elements: readonly ExcalidrawElement[], image: ExcalidrawImageElement) {
  const groupId = imageAnnotationGroupId(image.id);
  return elements.filter((element) => element.id === image.id || element.groupIds.includes(groupId));
}

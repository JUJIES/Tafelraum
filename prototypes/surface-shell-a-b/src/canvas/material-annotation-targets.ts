import { isIndependentCanvasShape } from "./image-annotation-selection.ts";

type MaterialAnnotationTarget = {
  angle: number;
  customData?: Record<string, unknown>;
  height: number;
  id: string;
  isDeleted?: boolean;
  type: string;
  width: number;
  x: number;
  y: number;
};

export function isMaterialAnnotationTarget(element: MaterialAnnotationTarget) {
  return !element.isDeleted
    && ((element.type === "image" && element.customData?.role !== "rich-text-rendition-v1")
      || element.customData?.materialKind === "interactive-html"
      || element.customData?.surfaceKind === "embedded-app");
}

export function materialContainsPoint(element: MaterialAnnotationTarget, point: { x: number; y: number }) {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const deltaX = point.x - centerX;
  const deltaY = point.y - centerY;
  const cos = Math.cos(element.angle);
  const sin = Math.sin(element.angle);
  const localX = deltaX * cos + deltaY * sin;
  const localY = -deltaX * sin + deltaY * cos;

  return Math.abs(localX) <= Math.abs(element.width) / 2
    && Math.abs(localY) <= Math.abs(element.height) / 2;
}

export function findTopmostMaterialAnnotationTargetAtPoint(
  elements: readonly MaterialAnnotationTarget[],
  point: { x: number; y: number },
) {
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (isMaterialAnnotationTarget(element) && materialContainsPoint(element, point)) return element;
  }
  return null;
}

export function shapeContainsPoint(element: MaterialAnnotationTarget, point: { x: number; y: number }) {
  if (!isIndependentCanvasShape(element) || element.isDeleted) return false;
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const deltaX = point.x - centerX;
  const deltaY = point.y - centerY;
  const cos = Math.cos(element.angle);
  const sin = Math.sin(element.angle);
  const localX = deltaX * cos + deltaY * sin;
  const localY = -deltaX * sin + deltaY * cos;
  const halfWidth = Math.abs(element.width) / 2;
  const halfHeight = Math.abs(element.height) / 2;
  if (halfWidth === 0 || halfHeight === 0) return false;
  if (element.type === "ellipse") return (localX / halfWidth) ** 2 + (localY / halfHeight) ** 2 <= 1;
  if (element.type === "diamond") return Math.abs(localX) / halfWidth + Math.abs(localY) / halfHeight <= 1;
  return Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight;
}

export function findTopmostCanvasAnnotationTargetAtPoint(
  elements: readonly MaterialAnnotationTarget[],
  point: { x: number; y: number },
) {
  for (let index = elements.length - 1; index >= 0; index -= 1) {
    const element = elements[index];
    if (shapeContainsPoint(element, point) || (isMaterialAnnotationTarget(element) && materialContainsPoint(element, point))) return element;
  }
  return null;
}

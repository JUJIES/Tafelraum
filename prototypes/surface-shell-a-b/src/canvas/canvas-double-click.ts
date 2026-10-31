const basicShapeTypes = new Set(["rectangle", "ellipse", "diamond"]);

type CanvasDoubleClickTarget = {
  angle?: number;
  boundElements?: readonly { id: string; type: string }[] | null;
  containerId?: string | null;
  customData?: Record<string, unknown> | null;
  height?: number;
  id?: string;
  isDeleted?: boolean;
  type: string;
  width?: number;
  x?: number;
  y?: number;
};

export function isBasicShapeType(type: string) {
  return basicShapeTypes.has(type);
}

function isPlainBasicShape(target: CanvasDoubleClickTarget | null | undefined) {
  return Boolean(
    target
    && isBasicShapeType(target.type)
    && (!target.customData || Object.keys(target.customData).length === 0),
  );
}

function basicShapeContainsPoint(shape: CanvasDoubleClickTarget, point: { x: number; y: number }) {
  if (
    typeof shape.x !== "number"
    || typeof shape.y !== "number"
    || typeof shape.width !== "number"
    || typeof shape.height !== "number"
  ) return false;
  const halfWidth = Math.abs(shape.width) / 2;
  const halfHeight = Math.abs(shape.height) / 2;
  if (halfWidth === 0 || halfHeight === 0) return false;

  const centerX = shape.x + shape.width / 2;
  const centerY = shape.y + shape.height / 2;
  const deltaX = point.x - centerX;
  const deltaY = point.y - centerY;
  const angle = shape.angle ?? 0;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const localX = deltaX * cos + deltaY * sin;
  const localY = -deltaX * sin + deltaY * cos;

  if (shape.type === "ellipse") {
    return (localX / halfWidth) ** 2 + (localY / halfHeight) ** 2 <= 1;
  }
  if (shape.type === "diamond") {
    return Math.abs(localX) / halfWidth + Math.abs(localY) / halfHeight <= 1;
  }
  return Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight;
}

export function editableShapeAboveImageAtPoint<T extends CanvasDoubleClickTarget & { id: string }>(
  elements: readonly T[],
  imageId: string,
  point: { x: number; y: number },
) {
  const imageIndex = elements.findIndex((element) => element.id === imageId);
  if (imageIndex < 0) return null;
  for (let index = elements.length - 1; index > imageIndex; index -= 1) {
    const element = elements[index];
    if (!element.isDeleted && isPlainBasicShape(element) && basicShapeContainsPoint(element, point)) return element;
  }
  return null;
}

export function allowsNativeTextDoubleClick(
  target: CanvasDoubleClickTarget | null | undefined,
  textContainer?: CanvasDoubleClickTarget | null,
) {
  if (!target) return false;
  if (target.type === "text") {
    return !target.containerId || isPlainBasicShape(textContainer);
  }
  return isPlainBasicShape(target);
}

export function existingTextSelectionTarget<T extends CanvasDoubleClickTarget & { id: string }>(
  target: T | null | undefined,
  textContainer: T | null | undefined,
  elements: readonly T[],
) {
  if (!target || !allowsNativeTextDoubleClick(target, textContainer)) return null;
  if (target.type === "text") return textContainer ?? target;
  const hasBoundText = target.boundElements?.some(
    (binding) => binding.type === "text" && elements.some((element) => element.id === binding.id && element.type === "text"),
  );
  return hasBoundText ? target : null;
}

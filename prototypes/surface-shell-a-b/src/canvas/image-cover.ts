export const imageCoverRole = "image-cover";
const imageCoverMemoryKey = "tafelraumImageCoverMemory";

export type ImageGeometry = {
  angle: number;
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ImageCoverRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ImageCoverHandle =
  | "move"
  | "north"
  | "north-east"
  | "east"
  | "south-east"
  | "south"
  | "south-west"
  | "west"
  | "north-west";

export type ImageCoverEdge = "left" | "right" | "top" | "bottom";

export type ImageCoverMemory = {
  edge: ImageCoverEdge;
  rect: ImageCoverRect;
};

export const initialImageCoverEdge: ImageCoverEdge = "right";

export const initialImageCoverRect: ImageCoverRect = {
  height: 1,
  width: 1,
  x: 0,
  y: 0,
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function isImageCoverEdge(value: unknown): value is ImageCoverEdge {
  return value === "left" || value === "right" || value === "top" || value === "bottom";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isImageCoverElement(element: { customData?: Record<string, unknown> }) {
  return element.customData?.role === imageCoverRole
    && typeof element.customData.imageId === "string";
}

export function imageCoverBelongsTo(element: { customData?: Record<string, unknown> }, imageId: string) {
  return isImageCoverElement(element) && element.customData?.imageId === imageId;
}

export function rememberImageCover(
  customData: Record<string, unknown> | null | undefined,
  rect: ImageCoverRect,
  edge: ImageCoverEdge,
) {
  return {
    ...customData,
    [imageCoverMemoryKey]: {
      edge,
      rect: constrainImageCoverRect(rect),
      version: 1,
    },
  };
}

export function recallImageCover(element: { customData?: Record<string, unknown> }): ImageCoverMemory | null {
  const stored = element.customData?.[imageCoverMemoryKey];
  if (!stored || typeof stored !== "object") return null;
  const candidate = stored as { edge?: unknown; rect?: unknown; version?: unknown };
  if (candidate.version !== 1 || !isImageCoverEdge(candidate.edge) || !candidate.rect || typeof candidate.rect !== "object") {
    return null;
  }
  const rect = candidate.rect as Partial<ImageCoverRect>;
  if (!isFiniteNumber(rect.x) || !isFiniteNumber(rect.y) || !isFiniteNumber(rect.width) || !isFiniteNumber(rect.height)) {
    return null;
  }
  return {
    edge: candidate.edge,
    rect: constrainImageCoverRect(rect as ImageCoverRect),
  };
}

export function forgetImageCover(customData: Record<string, unknown> | null | undefined) {
  const nextCustomData = { ...customData };
  delete nextCustomData[imageCoverMemoryKey];
  return nextCustomData;
}

export function constrainImageCoverRect(rect: ImageCoverRect): ImageCoverRect {
  const width = clamp(Math.abs(rect.width), 0, 1);
  const height = clamp(Math.abs(rect.height), 0, 1);
  return {
    height,
    width,
    x: clamp(rect.x, 0, 1 - width),
    y: clamp(rect.y, 0, 1 - height),
  };
}

export function isImageCoverFull(rect: ImageCoverRect, tolerance = 0.001) {
  const constrained = constrainImageCoverRect(rect);
  return constrained.x <= tolerance
    && constrained.y <= tolerance
    && constrained.width >= 1 - tolerance
    && constrained.height >= 1 - tolerance;
}

export function nearestImageCoverEdge(rect: ImageCoverRect, fallback: ImageCoverEdge = "right") {
  const constrained = constrainImageCoverRect(rect);
  const centerX = constrained.x + constrained.width / 2;
  const centerY = constrained.y + constrained.height / 2;
  const distances: Record<ImageCoverEdge, number> = {
    left: centerX,
    right: 1 - centerX,
    top: centerY,
    bottom: 1 - centerY,
  };
  const shortest = Math.min(...Object.values(distances));
  const candidates = (Object.keys(distances) as ImageCoverEdge[])
    .filter((edge) => Math.abs(distances[edge] - shortest) < 0.001);
  return candidates.includes(fallback) ? fallback : candidates[0];
}

export function transformImageCoverRect(
  start: ImageCoverRect,
  handle: ImageCoverHandle,
  deltaX: number,
  deltaY: number,
  minimumWidth: number,
  minimumHeight: number,
): ImageCoverRect {
  const constrainedStart = constrainImageCoverRect(start);
  const minWidth = clamp(minimumWidth, 0, 1);
  const minHeight = clamp(minimumHeight, 0, 1);

  if (handle === "move") {
    return {
      ...constrainedStart,
      x: clamp(constrainedStart.x + deltaX, 0, 1 - constrainedStart.width),
      y: clamp(constrainedStart.y + deltaY, 0, 1 - constrainedStart.height),
    };
  }

  let left = constrainedStart.x;
  let top = constrainedStart.y;
  let right = constrainedStart.x + constrainedStart.width;
  let bottom = constrainedStart.y + constrainedStart.height;

  if (handle.includes("west")) left = clamp(left + deltaX, 0, right - minWidth);
  if (handle.includes("east")) right = clamp(right + deltaX, left + minWidth, 1);
  if (handle.includes("north")) top = clamp(top + deltaY, 0, bottom - minHeight);
  if (handle.includes("south")) bottom = clamp(bottom + deltaY, top + minHeight, 1);

  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  };
}

function rotateDelta(deltaX: number, deltaY: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: deltaX * cos - deltaY * sin,
    y: deltaX * sin + deltaY * cos,
  };
}

export function imagePointToNormalized(image: ImageGeometry, point: { x: number; y: number }) {
  const width = Math.max(Number.EPSILON, Math.abs(image.width));
  const height = Math.max(Number.EPSILON, Math.abs(image.height));
  const center = {
    x: image.x + image.width / 2,
    y: image.y + image.height / 2,
  };
  const local = rotateDelta(point.x - center.x, point.y - center.y, -image.angle);
  return {
    x: local.x / width + 0.5,
    y: local.y / height + 0.5,
  };
}

export function imageCoverRectToScene(image: ImageGeometry, cover: ImageCoverRect): ImageGeometry {
  const imageWidth = Math.abs(image.width);
  const imageHeight = Math.abs(image.height);
  const width = imageWidth * cover.width;
  const height = imageHeight * cover.height;
  const localCenter = {
    x: (cover.x + cover.width / 2 - 0.5) * imageWidth,
    y: (cover.y + cover.height / 2 - 0.5) * imageHeight,
  };
  const centerOffset = rotateDelta(localCenter.x, localCenter.y, image.angle);
  const imageCenter = {
    x: image.x + image.width / 2,
    y: image.y + image.height / 2,
  };
  return {
    angle: image.angle,
    height,
    width,
    x: imageCenter.x + centerOffset.x - width / 2,
    y: imageCenter.y + centerOffset.y - height / 2,
  };
}

export function sceneCoverToImageRect(image: ImageGeometry, cover: ImageGeometry): ImageCoverRect {
  const imageWidth = Math.max(Number.EPSILON, Math.abs(image.width));
  const imageHeight = Math.max(Number.EPSILON, Math.abs(image.height));
  const imageCenter = {
    x: image.x + image.width / 2,
    y: image.y + image.height / 2,
  };
  const coverCenter = {
    x: cover.x + cover.width / 2,
    y: cover.y + cover.height / 2,
  };
  const localCenter = rotateDelta(
    coverCenter.x - imageCenter.x,
    coverCenter.y - imageCenter.y,
    -image.angle,
  );
  const width = Math.abs(cover.width) / imageWidth;
  const height = Math.abs(cover.height) / imageHeight;
  return {
    height,
    width,
    x: localCenter.x / imageWidth + 0.5 - width / 2,
    y: localCenter.y / imageHeight + 0.5 - height / 2,
  };
}

export function constrainImageCoverGeometry(image: ImageGeometry, cover: ImageGeometry): ImageGeometry {
  return imageCoverRectToScene(image, constrainImageCoverRect(sceneCoverToImageRect(image, cover)));
}

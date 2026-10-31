import type { ExcalidrawImageElement, ImageCrop } from "@excalidraw/excalidraw/element/types";

export type NormalizedImageCropRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type ImageCropTrimHandle =
  | "north"
  | "north-east"
  | "east"
  | "south-east"
  | "south"
  | "south-west"
  | "west"
  | "north-west";

export function shouldExitImageCropUi(
  activeImageId: string | null,
  visibleQuickActionImageId: string | null,
) {
  return activeImageId !== null && activeImageId !== visibleQuickActionImageId;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function imageCropRectFromPoints(
  start: { x: number; y: number },
  end: { x: number; y: number },
): NormalizedImageCropRect {
  const startX = clamp(start.x, 0, 1);
  const startY = clamp(start.y, 0, 1);
  const endX = clamp(end.x, 0, 1);
  const endY = clamp(end.y, 0, 1);
  return {
    height: Math.abs(endY - startY),
    width: Math.abs(endX - startX),
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
  };
}

export function imageCropRectFromTrimHandle(
  start: NormalizedImageCropRect,
  handle: ImageCropTrimHandle,
  point: { x: number; y: number },
  minimumSize = 0.02,
): NormalizedImageCropRect {
  const minimumWidth = clamp(minimumSize, 0, 1);
  const minimumHeight = clamp(minimumSize, 0, 1);
  let left = clamp(start.x, 0, 1);
  let top = clamp(start.y, 0, 1);
  let right = clamp(start.x + start.width, left, 1);
  let bottom = clamp(start.y + start.height, top, 1);

  if (handle.includes("west")) left = clamp(point.x, 0, right - minimumWidth);
  if (handle.includes("east")) right = clamp(point.x, left + minimumWidth, 1);
  if (handle.includes("north")) top = clamp(point.y, 0, bottom - minimumHeight);
  if (handle.includes("south")) bottom = clamp(point.y, top + minimumHeight, 1);

  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  };
}

function rotateOffset(x: number, y: number, angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

export function applyImageCropRect(
  image: ExcalidrawImageElement,
  rect: NormalizedImageCropRect,
  natural: { height: number; width: number },
): Pick<ExcalidrawImageElement, "crop" | "height" | "width" | "x" | "y"> {
  const baseCrop: ImageCrop = image.crop ?? {
    height: natural.height,
    naturalHeight: natural.height,
    naturalWidth: natural.width,
    width: natural.width,
    x: 0,
    y: 0,
  };
  const width = Math.abs(image.width) * rect.width;
  const height = Math.abs(image.height) * rect.height;
  const localCenter = {
    x: (rect.x + rect.width / 2 - 0.5) * Math.abs(image.width),
    y: (rect.y + rect.height / 2 - 0.5) * Math.abs(image.height),
  };
  const centerOffset = rotateOffset(localCenter.x, localCenter.y, image.angle);
  const imageCenter = {
    x: image.x + image.width / 2,
    y: image.y + image.height / 2,
  };
  const cropXProgress = image.scale[0] === -1 ? 1 - rect.x - rect.width : rect.x;
  const cropYProgress = image.scale[1] === -1 ? 1 - rect.y - rect.height : rect.y;

  return {
    crop: {
      height: baseCrop.height * rect.height,
      naturalHeight: baseCrop.naturalHeight,
      naturalWidth: baseCrop.naturalWidth,
      width: baseCrop.width * rect.width,
      x: baseCrop.x + baseCrop.width * cropXProgress,
      y: baseCrop.y + baseCrop.height * cropYProgress,
    },
    height,
    width,
    x: imageCenter.x + centerOffset.x - width / 2,
    y: imageCenter.y + centerOffset.y - height / 2,
  };
}

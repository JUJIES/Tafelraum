export type RotationPointerType = "mouse" | "pen" | "touch" | string;

// Mirrors Excalidraw 0.18's visible rotation-handle geometry. Keeping the
// adapter values together makes an engine upgrade fail visibly in one place.
export function nativeRotationHandleOffset(hasMultipleSelectedElements: boolean) {
  return hasMultipleSelectedElements ? 22 : 16;
}

export function nativeRotationHandleHitRadius(pointerType: RotationPointerType) {
  if (pointerType === "touch") return 14;
  if (pointerType === "pen") return 8;
  return 4;
}

export function pointerHitsNativeRotationHandle(input: {
  clientX: number;
  clientY: number;
  handleClientX: number;
  handleClientY: number;
  pointerType: RotationPointerType;
}) {
  const radius = nativeRotationHandleHitRadius(input.pointerType);
  return Math.abs(input.clientX - input.handleClientX) <= radius
    && Math.abs(input.clientY - input.handleClientY) <= radius;
}

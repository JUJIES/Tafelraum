import type { CanvasRotationDirection } from "./canvas-port";

export const keyboardRotationStep = Math.PI / 12;

function normalizeRotation(angle: number) {
  const fullRotation = Math.PI * 2;
  const normalized = angle % fullRotation;
  return normalized < 0 ? normalized + fullRotation : normalized;
}

export function keyboardRotationDelta(direction: CanvasRotationDirection) {
  return direction === "left" ? -keyboardRotationStep : keyboardRotationStep;
}

export function rotateElementAroundSelectionCenter({
  angle,
  center,
  direction,
  elementCenter,
  x,
  y,
}: {
  angle: number;
  center: { x: number; y: number };
  direction: CanvasRotationDirection;
  elementCenter: { x: number; y: number };
  x: number;
  y: number;
}) {
  const delta = keyboardRotationDelta(direction);
  const cosine = Math.cos(delta);
  const sine = Math.sin(delta);
  const offsetX = elementCenter.x - center.x;
  const offsetY = elementCenter.y - center.y;
  const rotatedCenter = {
    x: center.x + offsetX * cosine - offsetY * sine,
    y: center.y + offsetX * sine + offsetY * cosine,
  };

  return {
    angle: normalizeRotation(angle + delta),
    x: x + rotatedCenter.x - elementCenter.x,
    y: y + rotatedCenter.y - elementCenter.y,
  };
}

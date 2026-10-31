import type { StrokePoint } from "./stroke-sampling";

export const penRole = "ink-pen";
export const penPressure = 0.5;
// Excalidraw 0.18.1 uses size=strokeWidth*4.25 and a sine pressure easing.
// A fixed .5 pressure has radius=size*sin(pi/4). Calibrate physical diameter,
// not the engine's pressure-dependent strokeWidth setting.
export const penEngineWidth = (diameter: number) => diameter / (8.5 * Math.sin(Math.PI / 4));
export const penDiameter = (toolWidth: number) => toolWidth * 2;

/** Native freedraw centerline. No custom outline, polygon union or second paint
 * path. The engine already supplies local smoothing and round joins/caps. */
export function penGeometry(input: readonly StrokePoint[], tip = input[input.length - 1]) {
  if (!input.length) throw new Error("A pen needs at least one point.");
  const last = input[input.length - 1];
  const source = last[0] === tip[0] && last[1] === tip[1] ? input : [...input, tip];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of source) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const points = source.map(([x, y]): [number, number] => [x - minX, y - minY]);
  // Native freehand needs two endpoints even for a tap. A zero-length stroke
  // produces a round cap at the actual contact, not an artificial diagonal.
  if (points.length === 1) points.push([...points[0]]);
  return {
    x: minX, y: minY, width: maxX - minX, height: maxY - minY,
    points, pressures: points.map(() => penPressure), simulatePressure: false,
    // Excalidraw clears this transient flag on restore. Keeping it null during
    // BOTH drawing and commit makes native preview/export/reload identical.
    // Fine sampling bounds the native streamline's trailing distance; don't
    // enable a different end-cap calculation only on pointerup.
    lastCommittedPoint: null,
  };
}

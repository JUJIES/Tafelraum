import type { CanvasCoverShape } from "./canvas-cover-target";

export type CoverSweepGeometry = (CanvasCoverShape | { type: "polygon"; roundness: null; points: readonly (readonly [number, number])[] }) & {
  height: number;
  strokeWidth: number;
  width: number;
};

/** Match the native cover's unscaled path. The SVG's moving clip window
 * intersects this fixed silhouette at every intermediate frame. */
export function coverSweepPath(geometry: CoverSweepGeometry): string {
  const { height, roundness, type, width } = geometry;
  if (type === "polygon") {
    const points = geometry.points.slice(0, -1);
    return points.length < 3 ? "" : `M ${points[0][0]} ${points[0][1]} ${points.slice(1).map(point => `L ${point[0]} ${point[1]}`).join(" ")} Z`;
  }
  if (type === "ellipse") {
    return `M ${width / 2} 0 A ${width / 2} ${height / 2} 0 1 1 ${width / 2} ${height} A ${width / 2} ${height / 2} 0 1 1 ${width / 2} 0 Z`;
  }
  if (type === "diamond") {
    return `M ${width / 2} 0 L ${width} ${height / 2} L ${width / 2} ${height} L 0 ${height / 2} Z`;
  }
  const minimum = Math.min(width, height);
  const radius = !roundness ? 0 : roundness.type === 3
    ? Math.min(minimum * 0.25, roundness.value ?? 32)
    : minimum * 0.25;
  if (!radius) return `M 0 0 H ${width} V ${height} H 0 Z`;
  // Excalidraw uses quadratic corners, not CSS's circular border-radius.
  return `M ${radius} 0 L ${width - radius} 0 Q ${width} 0 ${width} ${radius} L ${width} ${height - radius} Q ${width} ${height} ${width - radius} ${height} L ${radius} ${height} Q 0 ${height} 0 ${height - radius} L 0 ${radius} Q 0 0 ${radius} 0 Z`;
}

/** Native line coordinates start at a contour vertex; overlays use its bounds. */
export function coverPolygonBounds(points: readonly (readonly [number, number])[]) {
  const x = Math.min(...points.map(point => point[0]));
  const y = Math.min(...points.map(point => point[1]));
  return { x, y, points: points.map(point => [point[0] - x, point[1] - y] as [number, number]) };
}

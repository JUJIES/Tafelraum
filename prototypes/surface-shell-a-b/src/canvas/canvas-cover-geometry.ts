import { isInteractiveHtmlMaterialElement } from "./interactive-html-embed.ts";
import { constrainImageCoverRect, sceneCoverToImageRect, type ImageCoverRect, type ImageGeometry } from "./image-cover.ts";
import { canvasCoverShapeForTarget, isPlainCanvasCoverTarget, type CanvasCoverElement } from "./canvas-cover-target.ts";

type Point = readonly [number, number];
type ShapedTarget = ImageGeometry & CanvasCoverElement;
type StoredCover = ImageGeometry & { customData?: Record<string, unknown> };

function isRect(value: unknown): value is ImageCoverRect {
  if (!value || typeof value !== "object") return false;
  const rect = value as Partial<ImageCoverRect>;
  return [rect.x, rect.y, rect.width, rect.height].every(value => typeof value === "number" && Number.isFinite(value))
    && rect.width! > 0 && rect.height! > 0;
}

/** The movable aperture is the one source for shaped covers. Older native
 * shapes encoded it in their bounds and are read without a separate migration. */
export function coverRectForTarget(target: ImageGeometry, cover: StoredCover): ImageCoverRect {
  const stored = cover.customData?.coverRect;
  return isRect(stored) ? constrainImageCoverRect(stored) : constrainImageCoverRect(sceneCoverToImageRect(target, cover));
}

function shapeOutline(target: ShapedTarget, outset: number): Point[] {
  const width = Math.abs(target.width), height = Math.abs(target.height);
  const shape = canvasCoverShapeForTarget(target);
  if (shape.type === "diamond") {
    const diagonal = Math.hypot(width / 2, height / 2);
    const outwardX = outset * diagonal / Math.max(height / 2, Number.EPSILON);
    const outwardY = outset * diagonal / Math.max(width / 2, Number.EPSILON);
    return [[width / 2, -outwardY], [width + outwardX, height / 2], [width / 2, height + outwardY], [-outwardX, height / 2]];
  }
  if (shape.type === "ellipse") {
    // Adaptive curve fidelity for normal canvas sizes, capped for the public point budget.
    const count = Math.min(256, Math.max(32, Math.ceil(Math.PI * Math.sqrt(Math.max(width, height) / 0.7))));
    return Array.from({ length: count }, (_, index) => {
      const angle = -Math.PI / 2 + index * 2 * Math.PI / count;
      return [width / 2 + (width / 2 + outset) * Math.cos(angle), height / 2 + (height / 2 + outset) * Math.sin(angle)];
    });
  }
  const minimum = Math.min(width, height);
  const roundness = shape.roundness;
  const radius = !roundness ? 0 : roundness.type === 3
    ? Math.min(minimum * (isInteractiveHtmlMaterialElement(target) ? 0.5 : 0.25), roundness.value ?? 32)
    : minimum * 0.25;
  if (!radius) return [[-outset, -outset], [width + outset, -outset], [width + outset, height + outset], [-outset, height + outset]];
  if (target.type === "image" || isInteractiveHtmlMaterialElement(target)) {
    // Images and HTML viewports use circular corners; native shapes use
    // quadratic corners. Preserve that contour when clipping a partial cover.
    const steps = Math.min(64, Math.max(8, Math.ceil(Math.PI / 2 * Math.sqrt((radius + outset) / 0.2))));
    const arc = (cx: number, cy: number, start: number): Point[] =>
      Array.from({ length: steps + 1 }, (_, index) => {
        const angle = start + index / steps * Math.PI / 2;
        return [cx + (radius + outset) * Math.cos(angle), cy + (radius + outset) * Math.sin(angle)];
      });
    return [...arc(width - radius, radius, -Math.PI / 2),
      ...arc(width - radius, height - radius, 0),
      ...arc(radius, height - radius, Math.PI / 2), ...arc(radius, radius, Math.PI)];
  }
  const steps = Math.min(32, Math.max(4, Math.ceil(Math.sqrt((radius + outset) / 0.35))));
  const corner = (start: Point, control: Point, end: Point): Point[] =>
    Array.from({ length: steps }, (_, index) => {
      const t = (index + 1) / steps, inverse = 1 - t;
      return [inverse * inverse * start[0] + 2 * inverse * t * control[0] + t * t * end[0],
        inverse * inverse * start[1] + 2 * inverse * t * control[1] + t * t * end[1]];
    });
  return [
    [radius, -outset], [width - radius, -outset],
    ...corner([width - radius, -outset], [width + outset, -outset], [width + outset, radius]),
    [width + outset, height - radius],
    ...corner([width + outset, height - radius], [width + outset, height + outset], [width - radius, height + outset]),
    [radius, height + outset],
    ...corner([radius, height + outset], [-outset, height + outset], [-outset, height - radius]),
    [-outset, radius],
    ...corner([-outset, radius], [-outset, -outset], [radius, -outset]),
  ];
}

function clipHalfPlane(points: Point[], axis: 0 | 1, boundary: number, keepGreater: boolean): Point[] {
  if (!points.length) return [];
  const inside = (point: Point) => keepGreater ? point[axis] >= boundary : point[axis] <= boundary;
  const result: Point[] = [];
  let previous = points[points.length - 1];
  for (const current of points) {
    const wasInside = inside(previous), isInside = inside(current);
    if (wasInside !== isInside) {
      const fraction = (boundary - previous[axis]) / (current[axis] - previous[axis]);
      result.push(axis === 0
        ? [boundary, previous[1] + fraction * (current[1] - previous[1])]
        : [previous[0] + fraction * (current[0] - previous[0]), boundary]);
    }
    if (isInside) result.push(current);
    previous = current;
  }
  return result;
}

/** Convex target silhouette ∩ axis-aligned target-local aperture. The result
 * is one native filled line, never a scaled copy of the target shape. */
export function shapedCoverGeometry(target: ShapedTarget, rect: ImageCoverRect, outset: number) {
  const width = Math.abs(target.width), height = Math.abs(target.height);
  const aperture = constrainImageCoverRect(rect);
  const left = aperture.x === 0 ? -outset : aperture.x * width;
  const right = aperture.x + aperture.width === 1 ? width + outset : (aperture.x + aperture.width) * width;
  const top = aperture.y === 0 ? -outset : aperture.y * height;
  const bottom = aperture.y + aperture.height === 1 ? height + outset : (aperture.y + aperture.height) * height;
  let polygon = shapeOutline(target, outset);
  polygon = clipHalfPlane(polygon, 0, left, true);
  polygon = clipHalfPlane(polygon, 0, right, false);
  polygon = clipHalfPlane(polygon, 1, top, true);
  polygon = clipHalfPlane(polygon, 1, bottom, false);
  const area = polygon.reduce((sum, point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return sum + point[0] * next[1] - point[1] * next[0];
  }, 0) / 2;
  const empty = polygon.length < 3 || Math.abs(area) < 0.000001;
  if (empty) polygon = [[left, top], [left + 0.001, top], [left + 0.001, top + 0.001], [left, top + 0.001]];
  const minX = Math.min(...polygon.map(point => point[0])), maxX = Math.max(...polygon.map(point => point[0]));
  const minY = Math.min(...polygon.map(point => point[1])), maxY = Math.max(...polygon.map(point => point[1]));
  const localCenterX = (minX + maxX) / 2 - width / 2;
  const localCenterY = (minY + maxY) / 2 - height / 2;
  const cos = Math.cos(target.angle), sin = Math.sin(target.angle);
  const centerX = target.x + target.width / 2 + localCenterX * cos - localCenterY * sin;
  const centerY = target.y + target.height / 2 + localCenterX * sin + localCenterY * cos;
  // A native line starts at its first contour vertex, not the bounding-box
  // corner. Adding that corner to a filled path would square off the silhouette.
  const [originX, originY] = polygon[0];
  const points = [...polygon, polygon[0]].map(point => [point[0] - originX, point[1] - originY]) as [number, number][];
  // The existing public cover contract requires at least five points.
  if (points.length < 5) points.push([0, 0]);
  return {
    angle: target.angle,
    empty,
    height: maxY - minY,
    points,
    width: maxX - minX,
    x: centerX - (maxX - minX) / 2 + originX - minX,
    y: centerY - (maxY - minY) / 2 + originY - minY,
  };
}

export function isShapedCoverTarget(target: CanvasCoverElement) {
  return (isPlainCanvasCoverTarget(target) && target.type !== "text")
    || (target.type === "image" && !target.isDeleted && Boolean(target.roundness))
    || isInteractiveHtmlMaterialElement(target);
}

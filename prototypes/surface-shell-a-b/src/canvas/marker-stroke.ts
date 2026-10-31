import polygonClipping, { type MultiPolygon } from "polygon-clipping";

export type MarkerPoint = readonly [number, number];
export type MarkerUnionCache = object;

type MarkerBuildState = {
  input: readonly MarkerPoint[];
  width: number;
  nextCenter: number;
  stable: MultiPolygon;
  stableLast: MarkerPoint;
  stableAngle: number;
  result?: MultiPolygon;
  resultLength?: number;
  resultTip?: MarkerPoint;
};

const markerBuildStates = new WeakMap<MarkerUnionCache, MarkerBuildState>();

export const markerOpacity = 32;
export const markerRole = "marker-ribbon";

export function isMarkerRibbonElement(element: { customData?: Record<string, unknown> | null } | null | undefined) {
  return element?.customData?.role === markerRole;
}

export function canStraightenMarker(points: readonly MarkerPoint[], width: number) {
  if (points.length < 2) return false;
  const [first, last] = [points[0], points[points.length - 1]];
  const dx = last[0] - first[0], dy = last[1] - first[1];
  const length = Math.hypot(dx, dy);
  if (length < width * 2) return false;
  return points.every(([x, y]) => {
    const along = ((x - first[0]) * dx + (y - first[1]) * dy) / length;
    const across = Math.abs((x - first[0]) * dy - (y - first[1]) * dx) / length;
    return along >= -width / 2 && along <= length + width / 2
      && across <= Math.max(width * 0.6, length * 0.055);
  });
}

const coordinateGrid = 1e-3;
const snap = (value: number) => Math.round(value / coordinateGrid) * coordinateGrid;
const snappedPoint = (point: MarkerPoint): [number, number] => [snap(point[0]), snap(point[1])];

const nibBaseAngle = -40 * Math.PI / 180;
const nibRatio = 0.36;
const nibRadius = nibRatio * 0.18;
// Three vertices per rounded corner keep long flat edges without a dense mesh.
const nibTemplate: MarkerPoint[] = Array.from({ length: 12 }, (_, index) => {
  const corner = Math.floor(index / 3), angle = (corner * 90 + index % 3 * 45) * Math.PI / 180;
  const cx = (corner === 0 || corner === 3 ? 1 : -1) * (1 - nibRadius);
  const cy = (corner < 2 ? 1 : -1) * (nibRatio - nibRadius);
  return [cx + Math.cos(angle) * nibRadius, cy + Math.sin(angle) * nibRadius];
});
const nibVertical = nibTemplate.map(([x, y]) => x * Math.sin(nibBaseAngle) + y * Math.cos(nibBaseAngle));
const nibHeight = Math.max(...nibVertical) - Math.min(...nibVertical);

function markerStamp([x, y]: MarkerPoint, width: number, offset = 0): MarkerPoint[] {
  const angle = nibBaseAngle + offset, scale = width / nibHeight;
  const points = nibTemplate.map(([px, py]) => snappedPoint([
    x + (px * Math.cos(angle) - py * Math.sin(angle)) * scale,
    y + (px * Math.sin(angle) + py * Math.cos(angle)) * scale,
  ]));
  return [...points, points[0]];
}

/** Distance-based orientation only: no position lag, timers or reversal flip. */
export function nextMarkerNibAngle(previous: number, dx: number, dy: number, width: number) {
  const length = Math.hypot(dx, dy);
  if (length < coordinateGrid) return previous;
  const target = (5 * Math.PI / 180) * (2 * dx * dy / (length * length));
  return previous + (target - previous) * -Math.expm1(-length / (width * 1.5));
}

function smoothedCenter(input: readonly MarkerPoint[], index: number) {
  const before = input[index - 1], current = input[index], after = input[index + 1];
  const start: MarkerPoint = [(before[0] + current[0]) / 2, (before[1] + current[1]) / 2];
  const end: MarkerPoint = [(current[0] + after[0]) / 2, (current[1] + after[1]) / 2];
  if ((current[0] - before[0]) * (after[0] - current[0])
    + (current[1] - before[1]) * (after[1] - current[1]) < 0) {
    return [start, current, end].map(snappedPoint);
  }
  const steps = Math.max(2, Math.min(12, Math.ceil(Math.hypot(end[0] - start[0], end[1] - start[1]) / 3)));
  const points: MarkerPoint[] = [];
  for (let step = index === 1 ? 0 : 1; step <= steps; step++) {
    const t = step / steps, u = 1 - t;
    points.push(snappedPoint([u * u * start[0] + 2 * u * t * current[0] + t * t * end[0],
      u * u * start[1] + 2 * u * t * current[1] + t * t * end[1]]));
  }
  return points;
}

function appendSweptFaces(faces: MultiPolygon, start: MarkerPoint, points: readonly MarkerPoint[], width: number, angle = 0) {
  let a = start;
  for (const b of points) {
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < coordinateGrid) { a = b; continue; }
    const nextAngle = nextMarkerNibAngle(angle, b[0] - a[0], b[1] - a[1], width);
    // Include intermediate orientations for sparse/straight-preview segments.
    // Each hull spans at most 0.5 degrees, rather than bridging a whole turn.
    const steps = Math.max(1, Math.ceil(Math.abs(nextAngle - angle) / (Math.PI / 360)));
    let previousPoint = a, previousAngle = angle;
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const point: MarkerPoint = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const stepAngle = angle + (nextAngle - angle) * t;
      const vertices = [...markerStamp(previousPoint, width, previousAngle).slice(0, -1), ...markerStamp(point, width, stepAngle).slice(0, -1)]
        .sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      const cross = (p: MarkerPoint, q: MarkerPoint, r: MarkerPoint) =>
        (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      const hullHalf = (ordered: MarkerPoint[]) => {
        const hull: MarkerPoint[] = [];
        for (const p of ordered) {
          while (hull.length >= 2 && cross(hull[hull.length - 2], hull.at(-1)!, p) <= 0) hull.pop();
          hull.push(p);
        }
        return hull.slice(0, -1);
      };
      const hull = [...hullHalf(vertices), ...hullHalf([...vertices].reverse())];
      faces.push([hull.map(snappedPoint)]);
      previousPoint = point; previousAngle = stepAngle;
    }
    angle = nextAngle;
    a = b;
  }
  if (!faces.length) faces.push([markerStamp(a, width, angle).slice(0, -1).map(snappedPoint)]);
  return angle;
}

function normalizeUnion(polygons: MultiPolygon): MultiPolygon {
  return polygons.map((polygon) => polygon.map((ring) => {
    const normalized: [number, number][] = [];
    for (const point of ring) {
      const snapped = snappedPoint(point) as [number, number];
      const previous = normalized.at(-1);
      if (!previous || previous[0] !== snapped[0] || previous[1] !== snapped[1]) normalized.push(snapped);
    }
    if (normalized.length > 1 && normalized[0][0] === normalized.at(-1)?.[0]
      && normalized[0][1] === normalized.at(-1)?.[1]) normalized.pop();
    return normalized;
  }).filter((ring) => ring.length >= 3)).filter((polygon) => polygon.length) as MultiPolygon;
}

function union(first: MultiPolygon, ...polygons: MultiPolygon[]) {
  // Clipping intersections produce tiny binary-float discrepancies even when
  // all input samples are stable. Returning every intermediate result to a
  // sub-pixel grid prevents those errors from accumulating during a long hold.
  return normalizeUnion(polygonClipping.union(first, ...polygons));
}

function unionFaces(faces: MultiPolygon) {
  if (!faces.length) return [] as MultiPolygon;
  // Merge as a balanced tree and quantize between levels. Giving a sweep
  // thousands of mutually crossing faces at once is both slower and less
  // numerically stable than joining small native polygons progressively.
  let batches: MultiPolygon[] = faces.map((polygon) => [polygon]);
  while (batches.length > 1) {
    const next: MultiPolygon[] = [];
    for (let index = 0; index < batches.length; index += 2) {
      if (index + 1 === batches.length) { next.push(batches[index]); continue; }
      next.push(union(batches[index], batches[index + 1]));
    }
    batches = next;
  }
  return batches[0];
}

function buildMarker(input: readonly MarkerPoint[], width: number, cache?: MarkerUnionCache, tip = input[input.length - 1]) {
  let state = cache ? markerBuildStates.get(cache) : undefined;
  if (!state || state.input !== input || state.width !== width || state.nextCenter > input.length - 1) {
    state = { input, width, nextCenter: 1, stable: [], stableLast: snappedPoint(input[0]), stableAngle: 0 };
    if (cache) markerBuildStates.set(cache, state);
  }
  if (state.result && state.resultLength === input.length
    && state.resultTip?.[0] === tip[0] && state.resultTip?.[1] === tip[1]) return state.result;
  const newFaces: MultiPolygon = [];
  for (let index = state.nextCenter; index < input.length - 1; index++) {
    const smoothed = smoothedCenter(input, index);
    state.stableAngle = appendSweptFaces(newFaces, state.stableLast, smoothed, width, state.stableAngle);
    state.stableLast = smoothed.at(-1) ?? state.stableLast;
  }
  state.nextCenter = Math.max(state.nextCenter, input.length - 1);
  if (newFaces.length) {
    const addition = unionFaces(newFaces);
    state.stable = state.stable.length ? union(state.stable, addition) : addition;
  }
  const tailFaces: MultiPolygon = [];
  appendSweptFaces(tailFaces, state.stableLast, [snappedPoint(input[input.length - 1]), snappedPoint(tip)], width, state.stableAngle);
  const tail = unionFaces(tailFaces);
  const result = state.stable.length && tail.length ? union(state.stable, tail) : state.stable.length ? state.stable : tail;
  state.result = result;
  state.resultLength = input.length;
  state.resultTip = tip;
  return result;
}

/** A native filled polygon, not a second renderer or a rasterized annotation. */
export function markerOutline(input: readonly MarkerPoint[], width: number, cache?: MarkerUnionCache, tip = input[input.length - 1]): MarkerPoint[] {
  if (!input.length) return [];
  if (input.length === 1 && input[0][0] === tip[0] && input[0][1] === tip[1]) return markerStamp(input[0], width);
  // The engine fills polygons with evenodd. Unite the swept faces first so
  // repeated passes stay one translucent painted area instead of XOR holes.
  const polygons = buildMarker(input, width, cache, tip);
  if (!polygons.length) return markerStamp(input[0], width);
  const anchor = polygons[0][0][0];
  const outline: MarkerPoint[] = [anchor];
  // Retraced bridges have zero area. Retain genuine interior holes (e.g. a
  // circle) while representing the union as one native, editable element.
  for (const polygon of polygons) {
    for (const ring of polygon) outline.push(...ring, ring[0], anchor);
  }
  return outline;
}

export function markerGeometry(points: readonly MarkerPoint[], width: number, cache?: MarkerUnionCache, tip = points[points.length - 1]) {
  const outline = markerOutline(points, width, cache, tip);
  if (!outline.length) throw new Error("A marker needs at least one point.");
  const [x, y] = outline[0];
  let minX = x, maxX = x, minY = y, maxY = y;
  for (const [px, py] of outline) {
    minX = Math.min(minX, px); maxX = Math.max(maxX, px);
    minY = Math.min(minY, py); maxY = Math.max(maxY, py);
  }
  return {
    x: minX, y: minY,
    width: maxX - minX,
    height: maxY - minY,
    // Native line geometry begins at [0, 0]. A retraced, transparent bridge
    // connects that bounding-box origin to the closed ribbon (zero fill area).
    // This keeps rotation, grouping and projected material geometry canonical.
    points: [[0, 0], ...outline.map((point) => [point[0] - minX, point[1] - minY]), [0, 0]] as [number, number][],
  };
}

export function markerContainsPoint(points: readonly MarkerPoint[], point: { x: number; y: number }) {
  let winding = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1], b = points[index];
    const cross = (b[0] - a[0]) * (point.y - a[1]) - (point.x - a[0]) * (b[1] - a[1]);
    if (a[1] <= point.y && b[1] > point.y && cross > 0) winding++;
    if (a[1] > point.y && b[1] <= point.y && cross < 0) winding--;
  }
  return winding !== 0;
}

/** Hit the painted ribbon, excluding its retraced zero-area bridges. */
export function markerRibbonHit(points: readonly MarkerPoint[], point: { x: number; y: number }, radius: number) {
  if (markerContainsPoint(points, point)) return true;
  const edges = new Map<string, { a: MarkerPoint; b: MarkerPoint; winding: number }>();
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1], b = points[index];
    const aKey = `${a[0]},${a[1]}`, bKey = `${b[0]},${b[1]}`;
    if (aKey === bKey) continue;
    const key = aKey < bKey ? `${aKey}:${bKey}` : `${bKey}:${aKey}`;
    const edge = edges.get(key) ?? { a, b, winding: 0 };
    edge.winding += aKey < bKey ? 1 : -1;
    edges.set(key, edge);
  }
  for (const { a, b, winding } of edges.values()) {
    if (!winding) continue;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((point.x - a[0]) * dx + (point.y - a[1]) * dy) / (dx * dx + dy * dy)));
    if (Math.hypot(point.x - a[0] - t * dx, point.y - a[1] - t * dy) <= radius) return true;
  }
  return false;
}

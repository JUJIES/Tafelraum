import assert from "node:assert/strict";
import test from "node:test";
import { markerRibbonHit } from "./marker-stroke.ts";
import { canStraightenMarker, isMarkerRibbonElement, markerContainsPoint, markerGeometry, markerOpacity, markerOutline, markerRole, nextMarkerNibAngle, type MarkerPoint } from "./marker-stroke.ts";
import { createStrokeSampler, sampleStrokePoint } from "./stroke-sampling.ts";
import { projectInteractiveHtmlAnnotations } from "./interactive-html-annotations.ts";

// Match RoughJS/Excalidraw's fill rule, not only our selection winding test.
function evenoddContains(points: readonly MarkerPoint[], x: number, y: number) {
  let inside = false;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if ((a[1] > y) !== (b[1] > y)
      && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

test("marker erasure ignores empty bounds, hollow interiors and retraced bridges", () => {
  const marker = markerGeometry([[100, 100], [200, 200]], 10);
  const local = (x: number, y: number) => ({ x: x - marker.x, y: y - marker.y });
  assert.equal(markerRibbonHit(marker.points, local(150, 150), 2), true);
  assert.equal(markerRibbonHit(marker.points, local(110, 190), 2), false);
  const bridged: MarkerPoint[] = [[0, 0], [100, 100], [120, 100], [120, 120], [100, 120], [100, 100], [0, 0]];
  assert.equal(markerRibbonHit(bridged, { x: 50, y: 50 }, 2), false);
  assert.equal(markerRibbonHit(bridged, { x: 110, y: 110 }, 0), true);
  assert.equal(markerRibbonHit(bridged, { x: 121, y: 110 }, 2), true);
  assert.equal(markerRibbonHit(bridged, { x: 124, y: 110 }, 2), false);
  const ring: MarkerPoint[] = [[0, 0], [100, 0], [100, 100], [0, 100], [0, 0],
    [20, 20], [20, 80], [80, 80], [80, 20], [20, 20], [0, 0]];
  assert.equal(markerRibbonHit(ring, { x: 50, y: 50 }, 2), false);
});

test("backtracking and crossing strokes remain filled with the native evenodd rule", () => {
  const outline = markerOutline([[0, 0], [100, 0], [0, 0], [100, 0], [0, 0]], 20);
  for (let x = 10; x < 90; x += 5) {
    for (const y of [-5, 0, 5]) assert.equal(evenoddContains(outline, x, y), true, `${x},${y}`);
  }
  const crossed = markerOutline([[0, 0], [100, 100], [0, 100], [100, 0]], 20);
  assert.equal(evenoddContains(crossed, 50, 50), true);
  assert.equal(markerContainsPoint(crossed, { x: 50, y: 50 }), true);
});

test("union preserves the genuinely unpainted inside of a circle", () => {
  const circle: MarkerPoint[] = Array.from({ length: 65 }, (_, i) => [Math.cos(i / 64 * Math.PI * 2) * 50, Math.sin(i / 64 * Math.PI * 2) * 50]);
  const outline = markerOutline(circle, 17);
  assert.equal(evenoddContains(outline, 0, 0), false);
  assert.equal(markerContainsPoint(outline, { x: 0, y: 0 }), false);
  assert.equal(evenoddContains(outline, -50, 0), true);
});

test("cached incremental union equals a fresh computation after drawing and straightening", () => {
  const cache = new Map();
  const path: MarkerPoint[] = [[0, 0], [100, 10], [0, 5], [100, 0]];
  markerGeometry(path, 20, cache);
  path.push([5, -5]);
  assert.deepEqual(markerGeometry(path, 20, cache), markerGeometry(path, 20));
  assert.deepEqual(markerGeometry([path[0], path[4]], 20, cache), markerGeometry([path[0], path[4]], 20));
  assert.deepEqual(markerGeometry(path, 20, cache), markerGeometry(path, 20));
});

test("a tap is a closed chisel stamp, not a circular pressure dot", () => {
  const outline = markerOutline([[20, 30]], 20);
  assert.equal(outline.length, 13); // Four softened corners, three vertices each.
  assert.deepEqual(outline[0], outline.at(-1));
  assert.equal(Math.max(...outline.map((p) => p[1])) - Math.min(...outline.map((p) => p[1])), 20);
  assert.notEqual(outline[0][0], outline[3][0]);
});

test("straight marking has constant width and oblique ends in either direction", () => {
  for (const path of [[[0, 0], [100, 0]], [[100, 0], [0, 0]]] as MarkerPoint[][]) {
    const outline = markerOutline(path, 24);
    assert.equal(Math.max(...outline.map((p) => p[1])) - Math.min(...outline.map((p) => p[1])), 24);
    assert.deepEqual(outline[0], outline.at(-1));
    assert.ok(outline.every((point) => point.every(Number.isFinite)));
  }
  assert.equal(markerOpacity, 32);
});

test("resampling keeps a direct tip even before the next stable sample", () => {
  const sampler = createStrokeSampler([0, 0], 1, 17);
  sampleStrokePoint(sampler, [0.2, 0.1]);
  assert.equal(sampler.points.length, 1);
  assert.deepEqual(sampler.tip, [0.2, 0.1]);
  const cache = new Map();
  const before = markerGeometry(sampler.points, 17, cache, sampler.tip);
  sampleStrokePoint(sampler, [1, 0.1]);
  const after = markerGeometry(sampler.points, 17, cache, sampler.tip);
  assert.ok(after.width > before.width);
  assert.deepEqual(after, markerGeometry(sampler.points, 17, undefined, sampler.tip));
});

test("smoothing stays consistent across viewport zoom", () => {
  const normal = createStrokeSampler([0, 0], 1, 17), zoomed = createStrokeSampler([0, 0], 2, 17);
  sampleStrokePoint(normal, [5, 1]);
  sampleStrokePoint(zoomed, [2.5, 0.5]);
  assert.deepEqual(normal.points, zoomed.points.map(point => point.map(value => value * 2)));
});

test("hold may straighten a wavering line but never a circle or a short mark", () => {
  assert.equal(canStraightenMarker([[0, 0], [30, 2], [60, -3], [100, 1]], 17), true);
  assert.equal(canStraightenMarker([[0, 0], [8, 2]], 17), false);
  assert.equal(canStraightenMarker([[0, 0], [30, 60], [80, 60], [100, 0]], 17), false);
  assert.equal(canStraightenMarker([[0, 0], [80, 0], [10, 0]], 17), false);
});

test("curves and reversals produce deterministic finite native geometry", () => {
  const path: MarkerPoint[] = [[0, 0], [20, 20], [20, 20], [30, -20], [0, 0], [-10, 30]];
  const geometry = markerGeometry(path, 17);
  assert.deepEqual(geometry.points[0], [0, 0]);
  assert.deepEqual(geometry.points.at(-1), [0, 0]);
  assert.ok(geometry.points.every((point) => point.every(Number.isFinite)));
  assert.ok(geometry.points.every(([x, y]) => x >= 0 && y >= 0));
  assert.ok(geometry.width > 0 && geometry.height > 0);
  assert.deepEqual(markerGeometry(path, 17), geometry);
  assert.deepEqual(JSON.parse(JSON.stringify(geometry)), geometry);
});

test("HTML material projects the same filled native marker and opacity", () => {
  const geometry = markerGeometry([[10, 20], [110, 20]], 20);
  const result = projectInteractiveHtmlAnnotations({ id: "paper", x: 0, y: 0, width: 200, height: 200, angle: 0 }, [{
    ...geometry, id: "marker", type: "line", groupIds: ["paper-group"], angle: 0,
    strokeColor: "transparent", backgroundColor: "#efca63", strokeWidth: 0,
    customData: { role: markerRole }, opacity: markerOpacity, version: 1,
  }], "paper-group", {});
  const annotation = result.annotations[0];
  assert.equal(annotation.kind, "stroke");
  if (annotation.kind !== "stroke") return;
  assert.equal(annotation.fillColor, "#efca63");
  assert.equal(annotation.opacity, 0.32);
  assert.ok(Math.abs(annotation.x - 60) < 1e-9);
  assert.equal(annotation.y, 20);
  const expected = geometry.points.map(([x, y]) => [x + geometry.x, y + geometry.y]);
  annotation.points.forEach((point, index) => {
    assert.ok(Math.abs(point.x - expected[index][0]) < 1e-9);
    assert.ok(Math.abs(point.y - expected[index][1]) < 1e-9);
  });
});

test("a wide marker is selectable from its filled middle, not just its edges", () => {
  const geometry = markerGeometry([[10, 20], [110, 20]], 47);
  assert.equal(markerContainsPoint(geometry.points, { x: 60 - geometry.x, y: 20 - geometry.y }), true);
  assert.equal(markerContainsPoint(geometry.points, { x: 60 - geometry.x, y: 70 - geometry.y }), false);
});

test("only marker ribbons use the simple bounding-box selection", () => {
  assert.equal(isMarkerRibbonElement({ customData: { role: markerRole } }), true);
  assert.equal(isMarkerRibbonElement({ customData: { role: "youtube-material" } }), false);
  assert.equal(isMarkerRibbonElement({}), false);
  assert.equal(isMarkerRibbonElement(null), false);
});

test("a long local scribble stays numerically stable and incrementally responsive", () => {
  const sampler = createStrokeSampler([100, 100], 1, 17);
  const points = sampler.points;
  const cache = new Map();
  let seed = 42;
  const random = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  const started = performance.now();
  for (let index = 0; index < 5_000; index++) {
    sampleStrokePoint(sampler, [100 + (random() - 0.5) * 12, 100 + (random() - 0.5) * 12]);
    // Approximate several coalesced pointer samples per animation frame.
    if (index % 16 === 0) markerGeometry(points, 17, cache, sampler.tip);
  }
  const geometry = markerGeometry(points, 17, cache, sampler.tip);
  assert.ok(geometry.points.every((point) => point.every(Number.isFinite)));
  assert.ok(geometry.points.length < 1_000, `unexpected contour growth: ${geometry.points.length}`);
  // Broad enough for shared CI, but catches the former full-history rebuild
  // which needed multiple seconds for one 5k computation alone.
  assert.ok(performance.now() - started < 5_000);
});

test("resampling a straight gesture is independent of event density", () => {
  const replay = (steps: number) => {
    const sampler = createStrokeSampler([0, 0], 1, 17);
    for (let i = 1; i <= steps; i++) sampleStrokePoint(sampler, [i * 100 / steps, i * 30 / steps]);
    return sampler;
  };
  const reference = replay(1);
  for (const steps of [4, 60, 240]) {
    const actual = replay(steps);
    assert.equal(actual.points.length, reference.points.length);
    actual.points.forEach((point, i) => assert.ok(Math.hypot(point[0] - reference.points[i][0], point[1] - reference.points[i][1]) < 1e-7));
    assert.deepEqual(actual.tip, reference.tip);
  }
});

test("chisel variation comes from orientation, never collapses, and caps contain the tap", () => {
  const apparentWidth = (angle: number) => {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const outline = markerOutline([[0, 0], [dx * 100, dy * 100]], 24);
    const normal = outline.map(([x, y]) => -dy * x + dx * y);
    return Math.max(...normal) - Math.min(...normal);
  };
  const angle = -40 * Math.PI / 180;
  const ratio = apparentWidth(angle) / apparentWidth(angle + Math.PI / 2);
  // The nib now turns by up to five degrees: the full stroke envelope is
  // wider than the former fixed nib's 0.36 ratio, but remains distinctly flat.
  assert.ok(ratio > 0.32 && ratio < 0.48, `apparent ratio ${ratio}`);
  for (const end of [[1, 1], [100, 0], [-100, 0], [0, 100]] as MarkerPoint[]) {
    const outline = markerOutline([[0, 0], end], 24);
    for (const [x, y] of markerOutline([[0, 0]], 24).slice(0, 4)) {
      assert.equal(evenoddContains(outline, x * 0.99, y * 0.99), true);
    }
  }
});

test("nib orientation is bounded, distance-based and invariant under reversal", () => {
  const once = nextMarkerNibAngle(0, 100, 100, 17);
  let many = 0;
  for (let i = 0; i < 100; i++) many = nextMarkerNibAngle(many, 1, 1, 17);
  assert.ok(Math.abs(once - many) < 1e-12);
  assert.equal(once, nextMarkerNibAngle(0, -100, -100, 17));
  let angle = 0;
  for (let i = 0; i < 1000; i++) {
    angle = nextMarkerNibAngle(angle, Math.sin(i) * 10, Math.cos(i) * 10, 17);
    assert.ok(Math.abs(angle) <= 5 * Math.PI / 180);
  }
  assert.equal(nextMarkerNibAngle(angle, 0, 0, 17), angle);
});

test("frame batching preserves filled geometry and final preview is already final", () => {
  const path: MarkerPoint[] = Array.from({ length: 160 }, (_, i) => [i * 1.3, Math.sin(i / 12) * 22]);
  const replay = (batch: number) => {
    const sampler = createStrokeSampler(path[0], 1, 17), cache = new Map();
    for (let i = 1; i < path.length; i++) {
      sampleStrokePoint(sampler, path[i]);
      if (i % batch === 0) markerGeometry(sampler.points, 17, cache, sampler.tip);
    }
    const preview = markerGeometry(sampler.points, 17, cache, sampler.tip);
    assert.deepEqual(preview, markerGeometry(sampler.points, 17, cache, sampler.tip));
    return markerOutline(sampler.points, 17, cache, sampler.tip);
  };
  const reference = replay(160);
  for (const batch of [1, 8, 32]) {
    const actual = replay(batch);
    for (let x = -10; x < 220; x += 2) for (let y = -35; y < 35; y += 2)
      assert.equal(evenoddContains(actual, x, y), evenoddContains(reference, x, y), `${batch}: ${x},${y}`);
  }
});

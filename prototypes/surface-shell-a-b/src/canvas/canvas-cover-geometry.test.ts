import assert from "node:assert/strict";
import test from "node:test";
import { coverRectForTarget, isShapedCoverTarget, shapedCoverGeometry as nativeShapedCoverGeometry } from "./canvas-cover-geometry.ts";

// Compare contour bounds; native line position is its first vertex.
function shapedCoverGeometry(...args: Parameters<typeof nativeShapedCoverGeometry>) {
  const result = nativeShapedCoverGeometry(...args);
  assert.deepEqual(result.points[0], [0, 0]);
  assert.deepEqual(result.points.at(-1), [0, 0]);
  const minX = Math.min(...result.points.map(point => point[0]));
  const minY = Math.min(...result.points.map(point => point[1]));
  return { ...result, x: result.x + minX, y: result.y + minY,
    points: result.points.map(([x,y]) => [x-minX,y-minY]) };
}

const target = (type: "rectangle" | "ellipse" | "diamond", angle = 0) => ({
  type, roundness: null, id: "target", groupIds: [], x: 100, y: 200, width: 200, height: 100, angle,
});
const aperture = { x: 0.25, y: 0, width: 0.5, height: 1 };

test("a partial ellipse is the original ellipse clipped at fixed x limits, not a narrower ellipse", () => {
  const result = shapedCoverGeometry(target("ellipse"), aperture, 0);
  assert.equal(result.empty, false);
  assert.ok(Math.abs(result.x - 150) < 0.001);
  assert.ok(Math.abs(result.width - 100) < 0.001);
  assert.ok(Math.abs(result.y - 200) < 0.001);
  assert.ok(Math.abs(result.height - 100) < 0.001);
  const leftBoundary = result.points.slice(0, -1).filter(point => Math.abs(point[0]) < 0.001);
  assert.ok(leftBoundary.some(point => point[1] < 10));
  assert.ok(leftBoundary.some(point => point[1] > 90));
  assert.ok(leftBoundary.every(point => point[1] > 0 && point[1] < 100));
});

test("diamond crop follows the original straight slopes and rotation follows target center", () => {
  const plain = shapedCoverGeometry(target("diamond"), { x: 0.25, y: 0, width: 0.25, height: 1 }, 0);
  assert.deepEqual([plain.x, plain.y, plain.width, plain.height], [150, 200, 50, 100]);
  const rotated = shapedCoverGeometry(target("diamond", Math.PI / 2), { x: 0.25, y: 0, width: 0.25, height: 1 }, 0);
  assert.ok(Math.abs(rotated.x - 175) < 0.001);
  assert.ok(Math.abs(rotated.y - 175) < 0.001);
  assert.equal(rotated.width, 50);
  assert.equal(rotated.height, 100);
});

test("rounded rectangles use the same clipping window on their original quadratic corners", () => {
  const rounded = { ...target("rectangle"), roundness: { type: 3 as const, value: 20 } };
  const topHalf = shapedCoverGeometry(rounded, { x: 0, y: 0, width: 1, height: 0.5 }, 0);
  assert.equal(topHalf.empty, false);
  assert.ok(Math.abs(topHalf.y - 200) < 0.001);
  assert.ok(Math.abs(topHalf.height - 50) < 0.001);
  assert.ok(topHalf.points.some(point => Math.abs(point[1] - 50) < 0.001));
  assert.ok(topHalf.points.every(point => point[1] >= -0.000001 && point[1] <= 50.000001));
});

test("outset hides a full target stroke while a corner aperture can be truly empty", () => {
  const full = shapedCoverGeometry(target("rectangle"), { x: 0, y: 0, width: 1, height: 1 }, 4);
  assert.deepEqual([full.x, full.y, full.width, full.height], [96, 196, 208, 108]);
  const empty = shapedCoverGeometry(target("ellipse"), { x: 0, y: 0, width: 0.05, height: 0.05 }, 0);
  assert.equal(empty.empty, true);
});

test("stored aperture survives a clipped native polygon whose bounding box is smaller", () => {
  assert.deepEqual(coverRectForTarget(target("diamond"), {
    x: 150, y: 225, width: 50, height: 50, angle: 0,
    customData: { coverRect: { x: 0.25, y: 0, width: 0.25, height: 1 } },
  }), { x: 0.25, y: 0, width: 0.25, height: 1 });
});

const roundedImage = { ...target("rectangle"), type: "image", roundness: { type: 3 as const, value: 20 } };

test("image covers retain circular image corners rather than quadratic shape corners", () => {
  assert.equal(isShapedCoverTarget(roundedImage), true);
  assert.equal(isShapedCoverTarget({ ...roundedImage, roundness: null }), false);
  const full = shapedCoverGeometry(roundedImage, { x: 0, y: 0, width: 1, height: 1 }, 0);
  assert.equal(full.empty, false);
  assert.deepEqual([full.x, full.y, full.width, full.height], [100, 200, 200, 100]);
  const topLeft = full.points.slice(0, -1).filter(([x, y]) => x < 20 && y < 20);
  assert.ok(topLeft.length > 4);
  for (const [x, y] of topLeft) assert.ok(Math.abs(Math.hypot(x - 20, y - 20) - 20) < 0.000001);
});

test("a partial image cover clips the original circular contour with a straight reveal edge", () => {
  const half = shapedCoverGeometry(roundedImage, { x: .5, y: 0, width: .5, height: 1 }, 0);
  assert.deepEqual([half.x, half.y, half.width, half.height], [200, 200, 100, 100]);
  const points = half.points.slice(0, -1);
  assert.ok(points.some(([x, y]) => x === 0 && y === 0));
  assert.ok(points.some(([x, y]) => x === 0 && y === 100));
  assert.ok(points.every(([x, y]) => x >= 0 && x <= 100 && y >= 0 && y <= 100));
  assert.equal(shapedCoverGeometry(roundedImage, { x: 0, y: 0, width: .005, height: .01 }, 0).empty, true);
});

test("small and resized image covers follow the native adaptive radius and preserve aperture", () => {
  const small = { ...roundedImage, width: 40, height: 20, angle: Math.PI / 2 };
  const cover = shapedCoverGeometry(small, { x: 0, y: 0, width: 1, height: 1 }, 0);
  assert.ok(cover.points.some(([x,y]) => Math.abs(x - 5) < .000001 && Math.abs(y) < .000001));
  assert.equal(cover.angle, Math.PI / 2);
  const aperture = { x: .25, y: 0, width: .75, height: 1 };
  assert.deepEqual(coverRectForTarget(small, { ...cover, customData: { coverRect: aperture } }), aperture);
});

const worksheet = { ...target("rectangle"), customData: { materialKind: "interactive-html" } };

test("HTML covers match the circular viewport corners even with a square native carrier", () => {
  assert.equal(isShapedCoverTarget(worksheet), true);
  assert.equal(isShapedCoverTarget({ ...worksheet, isDeleted: true }), false);
  assert.equal(isShapedCoverTarget({ ...worksheet, customData: { surfaceKind: "embedded-app" } }), false);
  const full = shapedCoverGeometry(worksheet, { x: 0, y: 0, width: 1, height: 1 }, 0);
  assert.deepEqual([full.x, full.y, full.width, full.height], [100, 200, 200, 100]);
  const corner = full.points.slice(0, -1).filter(([x, y]) => x < 14 && y < 14);
  assert.ok(corner.length > 3);
  for (const [x, y] of corner) assert.ok(Math.abs(Math.hypot(x - 14, y - 14) - 14) < 0.000001);
  assert.ok(!full.points.slice(0, -1).some(([x, y]) => x === 0 && y === 0));
});

test("partially opened HTML covers retain outer corners and a straight inner edge after rotation", () => {
  const rect = { x: 0, y: 0, width: 0.5, height: 1 };
  const partial = shapedCoverGeometry(worksheet, rect, 0);
  assert.deepEqual([partial.x, partial.y, partial.width, partial.height], [100, 200, 100, 100]);
  const cut = partial.points.slice(0, -1).filter(([x]) => Math.abs(x - 100) < 0.000001);
  assert.ok(cut.some(([, y]) => Math.abs(y) < 0.000001));
  assert.ok(cut.some(([, y]) => Math.abs(y - 100) < 0.000001));
  const rotated = shapedCoverGeometry({ ...worksheet, angle: Math.PI / 2 }, rect, 0);
  assert.ok(Math.abs(rotated.x - 150) < 0.000001);
  assert.ok(Math.abs(rotated.y - 150) < 0.000001);
  assert.deepEqual(rotated.points, partial.points);
  // Old rectangular covers keep their aperture while acquiring the viewport contour.
  assert.deepEqual(coverRectForTarget(worksheet, { x: 100, y: 200, width: 100, height: 100, angle: 0 }), rect);
});

test("tiny HTML viewports clamp corners to half their short side like CSS border-radius", () => {
  const small = shapedCoverGeometry({ ...worksheet, width: 20, height: 100 }, { x: 0, y: 0, width: 1, height: 1 }, 0);
  assert.ok(small.points.slice(0, -1).some(([x, y]) => Math.abs(x - 10) < 0.000001 && Math.abs(y) < 0.000001));
});

import assert from "node:assert/strict";
import test from "node:test";
import { coverSweepPath, type CoverSweepGeometry } from "./cover-sweep-geometry.ts";

const rectangle: CoverSweepGeometry = {
  type: "rectangle", roundness: null, width: 200, height: 100, strokeWidth: 1,
};

test("sweep silhouette uses native rectangle and quadratic corner geometry", () => {
  assert.equal(coverSweepPath(rectangle), "M 0 0 H 200 V 100 H 0 Z");
  assert.match(coverSweepPath({ ...rectangle, roundness: { type: 2 } }), /^M 25 0 L 175 0 Q 200 0 200 25/);
  assert.match(coverSweepPath({ ...rectangle, roundness: { type: 3, value: 12 } }), /^M 12 0 L 188 0 Q 200 0 200 12/);
  assert.match(coverSweepPath({ ...rectangle, roundness: { type: 3, value: 12 } }), /L 0 12 Q 0 0 12 0 Z$/);
  assert.match(coverSweepPath({ ...rectangle, width: 40, height: 20, roundness: { type: 3, value: 12 } }), /^M 5 0 L 35 0 Q 40 0 40 5/);
});

test("ellipse and diamond keep their complete contour independently of wipe direction", () => {
  assert.equal(coverSweepPath({ ...rectangle, type: "ellipse" }),
    "M 100 0 A 100 50 0 1 1 100 100 A 100 50 0 1 1 100 0 Z");
  assert.equal(coverSweepPath({ ...rectangle, type: "diamond" }),
    "M 100 0 L 200 50 L 100 100 L 0 50 Z");
});

test("a native clipped cover reuses its exact polygon in the short wipe", () => {
  assert.equal(coverSweepPath({ type: "polygon", roundness: null, width: 50, height: 100, strokeWidth: 0,
    points: [[0, 0], [50, -25], [50, 75], [0, 50], [0, 0]] }),
  "M 0 0 L 50 -25 L 50 75 L 0 50 Z");
});

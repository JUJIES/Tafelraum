import assert from "node:assert/strict";
import test from "node:test";
import {
  keyboardRotationDelta,
  keyboardRotationStep,
  rotateElementAroundSelectionCenter,
} from "./selection-rotation.ts";

test("uses the existing fifteen degree rotation grid in both directions", () => {
  assert.equal(keyboardRotationStep, Math.PI / 12);
  assert.equal(keyboardRotationDelta("left"), -Math.PI / 12);
  assert.equal(keyboardRotationDelta("right"), Math.PI / 12);
});

test("keeps a single element centered while rotating it", () => {
  assert.deepEqual(rotateElementAroundSelectionCenter({
    angle: 0,
    center: { x: 150, y: 120 },
    direction: "right",
    elementCenter: { x: 150, y: 120 },
    x: 100,
    y: 80,
  }), {
    angle: Math.PI / 12,
    x: 100,
    y: 80,
  });
});

test("moves each element center around the common selection center", () => {
  const rotated = rotateElementAroundSelectionCenter({
    angle: 0,
    center: { x: 100, y: 100 },
    direction: "right",
    elementCenter: { x: 200, y: 100 },
    x: 180,
    y: 80,
  });

  assert.ok(Math.abs(rotated.x - 176.59258262890683) < 0.000001);
  assert.ok(Math.abs(rotated.y - 105.88190451025207) < 0.000001);
  assert.equal(rotated.angle, Math.PI / 12);
});

test("normalizes a left turn from zero to a positive canvas angle", () => {
  const rotated = rotateElementAroundSelectionCenter({
    angle: 0,
    center: { x: 0, y: 0 },
    direction: "left",
    elementCenter: { x: 0, y: 0 },
    x: 0,
    y: 0,
  });
  assert.equal(rotated.angle, Math.PI * 2 - Math.PI / 12);
});

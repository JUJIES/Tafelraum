import assert from "node:assert/strict";
import test from "node:test";
import { snapImageRotation } from "./rotation-snap.ts";

const degrees = (value: number) => value * Math.PI / 180;

test("snaps free rotation to nearby right angles", () => {
  assert.equal(snapImageRotation(degrees(3.9), false), 0);
  assert.equal(snapImageRotation(degrees(86.1), false), Math.PI / 2);
  assert.equal(snapImageRotation(degrees(181.5), false), Math.PI);
  assert.equal(snapImageRotation(degrees(273), false), Math.PI * 1.5);
});

test("keeps free rotation outside the four-degree threshold", () => {
  assert.equal(snapImageRotation(degrees(4.1), false), degrees(4.1));
  assert.equal(snapImageRotation(degrees(84), false), degrees(84));
});

test("normalizes the restored zero-degree position", () => {
  assert.equal(snapImageRotation(degrees(-1), false), 0);
  assert.equal(snapImageRotation(degrees(359), false), 0);
});

test("uses the existing fifteen-degree grid while Shift is held", () => {
  assert.equal(snapImageRotation(degrees(22), true), degrees(15));
  assert.equal(snapImageRotation(degrees(23), true), degrees(30));
});

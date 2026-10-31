import assert from "node:assert/strict";
import test from "node:test";
import { nearestDock, type DockBounds } from "./toolbar-docking.ts";

const openArchiveCanvas: DockBounds = {
  top: 68,
  right: 1600,
  bottom: 900,
  left: 304,
};

test("uses the visible canvas edges when the archive is open", () => {
  assert.equal(nearestDock(952, 82, openArchiveCanvas), "top");
  assert.equal(nearestDock(952, 886, openArchiveCanvas), "bottom");
  assert.equal(nearestDock(318, 484, openArchiveCanvas), "left");
  assert.equal(nearestDock(1586, 484, openArchiveCanvas), "right");
});

test("chooses the nearest canvas edge even outside the canvas bounds", () => {
  assert.equal(nearestDock(250, 20, openArchiveCanvas), "top");
  assert.equal(nearestDock(250, 450, openArchiveCanvas), "left");
});

test("adapts the left edge when the archive is closed", () => {
  const closedArchiveCanvas = { ...openArchiveCanvas, left: 0 };
  assert.equal(nearestDock(14, 484, closedArchiveCanvas), "left");
  assert.equal(nearestDock(952, 82, closedArchiveCanvas), "top");
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  getElementFocusDimPanels,
  nextElementFocusIds,
  shouldRetargetElementFocus,
  type FocusDimPanel,
} from "./element-focus.ts";

function panelArea(panels: readonly FocusDimPanel[]) {
  return panels.reduce((area, panel) => area + panel.width * panel.height, 0);
}

test("switches a single focus target on a normal click", () => {
  assert.deepEqual(nextElementFocusIds(["first"], "second", false), ["second"]);
});

test("adds and removes focus targets with Shift", () => {
  assert.deepEqual(nextElementFocusIds(["first"], "second", true), ["first", "second"]);
  assert.deepEqual(nextElementFocusIds(["first", "second"], "first", true), ["second"]);
});

test("clears focus on an empty canvas click", () => {
  assert.deepEqual(nextElementFocusIds(["first", "second"], null, false), []);
});

test("keeps focus while the camera is moved with the hand tool", () => {
  assert.equal(shouldRetargetElementFocus("hand", false), false);
});

test("keeps focus during temporary space-bar panning", () => {
  assert.equal(shouldRetargetElementFocus("selection", true), false);
});

test("allows an actual selection click to retarget or clear focus", () => {
  assert.equal(shouldRetargetElementFocus("selection", false), true);
});

test("dims a single straight sheet with four lightweight panels", () => {
  const panels = getElementFocusDimPanels([
    { angle: 0, centerX: 50, centerY: 50, height: 40, width: 20 },
  ], 100, 100);
  assert.ok(panels);
  assert.equal(panels.length, 4);
  assert.equal(panelArea(panels), 10_000 - 800);
});

test("keeps multiple straight sheets as separate undimmed regions", () => {
  const panels = getElementFocusDimPanels([
    { angle: 0, centerX: 20, centerY: 30, height: 20, width: 20 },
    { angle: 0, centerX: 80, centerY: 70, height: 20, width: 20 },
  ], 100, 100);
  assert.ok(panels);
  assert.equal(panelArea(panels), 10_000 - 800);
});

test("does not double-count overlapping focus regions", () => {
  const panels = getElementFocusDimPanels([
    { angle: 0, centerX: 45, centerY: 50, height: 20, width: 20 },
    { angle: 0, centerX: 55, centerY: 50, height: 20, width: 20 },
  ], 100, 100);
  assert.ok(panels);
  assert.equal(panelArea(panels), 10_000 - 600);
});

test("keeps the precise SVG fallback for rotated targets", () => {
  assert.equal(getElementFocusDimPanels([
    { angle: Math.PI / 4, centerX: 50, centerY: 50, height: 40, width: 20 },
  ], 100, 100), null);
});

test("material focus uses engine insets for the unobstructed shell viewport", async () => {
  const { materialFocusCanvasOffsets } = await import("./element-focus.ts");
  assert.deepEqual(materialFocusCanvasOffsets(
    { left: 304, top: 68, width: 378, height: 508 },
    { offsetLeft: 304, offsetTop: 68, width: 720, height: 508 }),
    { left: 0, top: 0, right: 342, bottom: 0 });
  assert.deepEqual(materialFocusCanvasOffsets(
    {left: 320, top: 80, width: 650, height: 450},
    {offsetLeft: 304, offsetTop: 68, width: 720, height: 508}),
    { left: 16, top: 12, right: 54, bottom: 46 });
  assert.deepEqual(materialFocusCanvasOffsets(
    {left: 304, top: 68, width: 720, height: 508},
    {offsetLeft: 304, offsetTop: 68, width: 720, height: 508}),
    { left: 0, top: 0, right: 0, bottom: 0 });
});

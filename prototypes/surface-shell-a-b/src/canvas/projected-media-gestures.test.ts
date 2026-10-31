import assert from "node:assert/strict";
import test from "node:test";
import {
  getProjectedMediaWheelIntent,
  hasCanvasZoomModifier,
} from "./projected-media-gestures.ts";

test("recognizes the canvas zoom modifiers on both desktop platforms", () => {
  assert.equal(hasCanvasZoomModifier({ ctrlKey: true, metaKey: false }), true);
  assert.equal(hasCanvasZoomModifier({ ctrlKey: false, metaKey: true }), true);
  assert.equal(hasCanvasZoomModifier({ ctrlKey: false, metaKey: false }), false);
});

test("routes projected-media wheel gestures to the matching canvas camera action", () => {
  assert.equal(getProjectedMediaWheelIntent({
    ctrlKey: true,
    metaKey: false,
    projectedMediaTarget: true,
  }), "zoom");
  assert.equal(getProjectedMediaWheelIntent({
    ctrlKey: false,
    metaKey: false,
    projectedMediaTarget: true,
  }), "pan");
  assert.equal(getProjectedMediaWheelIntent({
    ctrlKey: false,
    metaKey: true,
    projectedMediaTarget: true,
  }), "zoom");
  assert.equal(getProjectedMediaWheelIntent({
    ctrlKey: true,
    metaKey: false,
    projectedMediaTarget: false,
  }), null);
});

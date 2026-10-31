import assert from "node:assert/strict";
import test from "node:test";
import { toolbarOverflowState, toolbarScrollDistance } from "./toolbar-overflow.ts";

test("shows no controls when every toolbar item fits", () => {
  assert.deepEqual(toolbarOverflowState({ clientSize: 640, scrollOffset: 0, scrollSize: 640 }), {
    backward: false,
    forward: false,
  });
});

test("offers only directions that still contain hidden tools", () => {
  assert.deepEqual(toolbarOverflowState({ clientSize: 400, scrollOffset: 0, scrollSize: 900 }), {
    backward: false,
    forward: true,
  });
  assert.deepEqual(toolbarOverflowState({ clientSize: 400, scrollOffset: 250, scrollSize: 900 }), {
    backward: true,
    forward: true,
  });
  assert.deepEqual(toolbarOverflowState({ clientSize: 400, scrollOffset: 500, scrollSize: 900 }), {
    backward: true,
    forward: false,
  });
});

test("scrolls by a useful portion while retaining a full touch target minimum", () => {
  assert.equal(toolbarScrollDistance(400), 288);
  assert.equal(toolbarScrollDistance(50), 54);
});

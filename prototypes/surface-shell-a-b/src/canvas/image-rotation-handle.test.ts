import assert from "node:assert/strict";
import test from "node:test";
import {
  nativeRotationHandleHitRadius,
  nativeRotationHandleOffset,
  pointerHitsNativeRotationHandle,
} from "./image-rotation-handle.ts";

test("matches the native single and multi-selection rotation-handle offsets", () => {
  assert.equal(nativeRotationHandleOffset(false), 16);
  assert.equal(nativeRotationHandleOffset(true), 22);
});

test("matches the native hit sizes for mouse, pen, and touch", () => {
  assert.equal(nativeRotationHandleHitRadius("mouse"), 4);
  assert.equal(nativeRotationHandleHitRadius("pen"), 8);
  assert.equal(nativeRotationHandleHitRadius("touch"), 14);
});

test("only redirects pointers that hit the visible native rotation point", () => {
  const base = {
    handleClientX: 140,
    handleClientY: 90,
    pointerType: "mouse",
  } as const;

  assert.equal(pointerHitsNativeRotationHandle({ ...base, clientX: 144, clientY: 86 }), true);
  assert.equal(pointerHitsNativeRotationHandle({ ...base, clientX: 145, clientY: 90 }), false);
});

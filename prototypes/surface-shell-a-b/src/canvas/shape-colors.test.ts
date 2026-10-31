import assert from "node:assert/strict";
import test from "node:test";
import { shapeBackgroundColor, shapeTextColor } from "./shape-colors.ts";

test("keeps empty shapes transparent", () => {
  assert.equal(shapeBackgroundColor("empty", "#5a9fc5"), "transparent");
});

test("uses a real alpha tint for translucent shapes", () => {
  assert.equal(shapeBackgroundColor("translucent", "#5a9fc5"), "rgba(90, 159, 197, 0.24)");
});

test("uses the selected color directly for solid shapes", () => {
  assert.equal(shapeBackgroundColor("solid", "#5a9fc5"), "#5a9fc5");
});

test("uses dark text on the light canvas and on the standard solid shape colors", () => {
  assert.equal(shapeTextColor("empty", "#5a9fc5", "#f4f3ef"), "#111111");
  assert.equal(shapeTextColor("solid", "#5a9fc5", "#f4f3ef"), "#111111");
});

test("uses light text on dark canvas or a dark solid shape", () => {
  assert.equal(shapeTextColor("translucent", "#5a9fc5", "#1c222b"), "#fffdf8");
  assert.equal(shapeTextColor("solid", "#111111", "#f4f3ef"), "#fffdf8");
});

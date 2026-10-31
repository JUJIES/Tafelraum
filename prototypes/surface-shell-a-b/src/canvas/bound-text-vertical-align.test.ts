import assert from "node:assert/strict";
import test from "node:test";
import { boundTextY, inferLegacyBoundTextAlign } from "./bound-text-vertical-align.ts";

test("bound text aligns at the native top, center and bottom positions", () => {
  const rectangle = { type: "rectangle", x: 20, y: 100, width: 300, height: 400 };
  assert.equal(boundTextY(rectangle, 100, "top"), 105);
  assert.equal(boundTextY(rectangle, 100, "middle"), 250);
  assert.equal(boundTextY(rectangle, 100, "bottom"), 395);
  assert.equal(boundTextY({ ...rectangle, type: "diamond" }, 100, "top"), 205);
  assert.ok(boundTextY({ ...rectangle, type: "ellipse" }, 100, "top") > 105);
});

test("upgrades a visually top-aligned old text without changing correctly centered text", () => {
  const shape = { type: "rectangle", x: 1220, y: -650, width: 538, height: 464 };
  assert.equal(inferLegacyBoundTextAlign(shape, -607, 243, "middle"), "top");
  assert.equal(inferLegacyBoundTextAlign(shape, boundTextY(shape, 243, "middle"), 243, "middle"), "middle");
});

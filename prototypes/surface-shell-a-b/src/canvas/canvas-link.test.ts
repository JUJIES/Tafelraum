import assert from "node:assert/strict";
import test from "node:test";
import { canvasLinkPresentation } from "./canvas-link.ts";

test("presents a canvas link as a compact labelled chip", () => {
  const presentation = canvasLinkPresentation("Material zur Vertiefung", "light");

  assert.equal(presentation.text, "↗  Material zur Vertiefung");
  assert.ok(presentation.width >= 168);
  assert.ok(presentation.width <= 520);
  assert.equal(presentation.height, 50);
  assert.notEqual(presentation.backgroundColor, presentation.textColor);
});

test("keeps long labels bounded and dark links readable", () => {
  const presentation = canvasLinkPresentation("Sehr lange Beschriftung ".repeat(20), "dark");

  assert.equal(presentation.width, 520);
  assert.equal(presentation.textColor, "#e0f1f8");
  assert.equal(presentation.strokeColor, "#76b6d2");
});

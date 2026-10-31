import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultToolStrokeSizeId,
  toolStrokeSizes,
  toolStrokeWidth,
} from "./tool-stroke-widths.ts";

test("keeps the existing pen and marker widths as the normal defaults", () => {
  assert.equal(defaultToolStrokeSizeId, "regular");
  assert.equal(toolStrokeWidth("pen", defaultToolStrokeSizeId), 2);
  assert.equal(toolStrokeWidth("marker", defaultToolStrokeSizeId), 4);
});

test("offers four strictly increasing native widths for each ink tool", () => {
  assert.equal(toolStrokeSizes.length, 4);
  for (const tool of ["pen", "marker"] as const) {
    const widths = toolStrokeSizes.map((size) => size.widths[tool]);
    assert.deepEqual(widths, [...widths].sort((left, right) => left - right));
    assert.equal(new Set(widths).size, widths.length);
  }
});

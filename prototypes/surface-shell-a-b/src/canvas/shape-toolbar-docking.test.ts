import assert from "node:assert/strict";
import test from "node:test";
import { clampShapeToolbarPosition, shapeToolbarDockAt, shapeToolbarDockPosition } from "./shape-toolbar-docking.ts";

const viewport = { width: 1024, height: 576 };

test("snaps only near an edge and chooses a stable corner or side slot", () => {
  assert.deepEqual(shapeToolbarDockAt({ x: 990, y: 52 }, viewport), { side: "right", align: "start" });
  assert.deepEqual(shapeToolbarDockAt({ x: 1000, y: 280 }, viewport), { side: "right", align: "center" });
  assert.deepEqual(shapeToolbarDockAt({ x: 20, y: 530 }, viewport), { side: "left", align: "end" });
  assert.deepEqual(shapeToolbarDockAt({ x: 510, y: 20 }, viewport), { side: "top", align: "center" });
  assert.deepEqual(shapeToolbarDockAt({ x: 42, y: 34 }, viewport, { side: "left", align: "start" }), { side: "left", align: "start" });
  assert.deepEqual(shapeToolbarDockAt({ x: 50, y: 20 }, viewport, { side: "left", align: "start" }), { side: "top", align: "start" });
  assert.equal(shapeToolbarDockAt({ x: 500, y: 270 }, viewport), null);
});

test("side slots remain compact and bottom slots leave room for the main toolbar", () => {
  assert.deepEqual(shapeToolbarDockPosition({ side: "right", align: "start" }, viewport), { x: 844, y: 12 });
  assert.deepEqual(shapeToolbarDockPosition({ side: "right", align: "end" }, viewport), { x: 844, y: 186 });
  assert.deepEqual(shapeToolbarDockPosition({ side: "bottom", align: "end" }, viewport), { x: 462, y: 412 });
  assert.deepEqual(clampShapeToolbarPosition({ x: 900, y: 550 }, viewport), { x: 462, y: 412 });
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  canvasCoverGroupId,
  canvasCoverShapeForTarget,
  canvasCoverStrokeWidth,
  canvasCoverTargetMembers,
  isPlainCanvasCoverTarget,
  resolvePlainCanvasCoverTarget,
  type CanvasCoverElement,
} from "./canvas-cover-target.ts";

const element = (patch: Partial<CanvasCoverElement> & Pick<CanvasCoverElement, "id" | "type">): CanvasCoverElement => ({
  groupIds: [],
  ...patch,
});

test("matches a cover to the target shape and preserves rectangle corners", () => {
  const rounded = { type: 3, value: 18 };
  assert.deepEqual(
    canvasCoverShapeForTarget(element({ id: "rectangle", roundness: rounded, type: "rectangle" })),
    { roundness: rounded, type: "rectangle" },
  );
  assert.deepEqual(
    canvasCoverShapeForTarget(element({ id: "ellipse", type: "ellipse" })),
    { roundness: null, type: "ellipse" },
  );
  assert.deepEqual(
    canvasCoverShapeForTarget(element({ id: "diamond", type: "diamond" })),
    { roundness: null, type: "diamond" },
  );
  assert.deepEqual(
    canvasCoverShapeForTarget(element({ id: "text", type: "text" })),
    { roundness: null, type: "rectangle" },
  );
});

test("full shape covers hide the outer target stroke while partial and text covers keep a narrow edge", () => {
  const full = { x: 0, y: 0, width: 1, height: 1 };
  const partial = { x: 0, y: 0, width: 0.5, height: 1 };
  assert.equal(canvasCoverStrokeWidth(element({ id: "shape", type: "rectangle", strokeWidth: 4 }), full), 6);
  assert.equal(canvasCoverStrokeWidth(element({ id: "shape", type: "rectangle", strokeWidth: 4 }), partial), 1);
  assert.equal(canvasCoverStrokeWidth(element({ id: "text", type: "text", strokeWidth: 4 }), full), 1);
});

test("accepts free text and plain basic shapes but no technical cover rectangle", () => {
  assert.equal(isPlainCanvasCoverTarget(element({ id: "text", type: "text" })), true);
  assert.equal(isPlainCanvasCoverTarget(element({ id: "shape", type: "rectangle" })), true);
  assert.equal(isPlainCanvasCoverTarget(element({
    customData: { imageId: "image", role: "image-cover" },
    id: "cover",
    type: "rectangle",
  })), false);
  assert.equal(isPlainCanvasCoverTarget(element({
    customData: { role: "canvas-link" },
    id: "link-card",
    type: "rectangle",
  })), false);
});

test("treats a labeled shape and its bound text as one cover target", () => {
  const shape = element({ boundElements: [{ id: "label", type: "text" }], id: "shape", type: "rectangle" });
  const label = element({ containerId: "shape", id: "label", type: "text" });
  const elements = [shape, label];

  assert.deepEqual(canvasCoverTargetMembers(elements, shape.id).map(({ id }) => id), ["shape", "label"]);
  assert.equal(resolvePlainCanvasCoverTarget(elements, ["label"])?.id, "shape");
  assert.equal(resolvePlainCanvasCoverTarget(elements, ["shape", "label"])?.id, "shape");
});

test("recovers the target when its cover group is selected", () => {
  const shape = element({ groupIds: [canvasCoverGroupId("shape")], id: "shape", type: "ellipse" });
  const cover = element({
    customData: { imageId: "shape", role: "image-cover" },
    groupIds: [canvasCoverGroupId("shape")],
    id: "cover",
    type: "rectangle",
  });
  assert.equal(resolvePlainCanvasCoverTarget(
    [shape, cover],
    [shape.id, cover.id],
    [canvasCoverGroupId(shape.id)],
  )?.id, shape.id);
});

test("does not turn an unrelated multi-selection into one cover target", () => {
  const first = element({ id: "first", type: "text" });
  const second = element({ id: "second", type: "text" });
  assert.equal(resolvePlainCanvasCoverTarget([first, second], [first.id, second.id]), null);
});

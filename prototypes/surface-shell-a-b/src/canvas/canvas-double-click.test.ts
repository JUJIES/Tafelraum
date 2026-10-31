import assert from "node:assert/strict";
import test from "node:test";
import { allowsNativeTextDoubleClick, editableShapeAboveImageAtPoint, existingTextSelectionTarget } from "./canvas-double-click.ts";

test("allows text editing only for existing text and plain user shapes", () => {
  assert.equal(allowsNativeTextDoubleClick({ type: "text" }), true);
  assert.equal(allowsNativeTextDoubleClick(
    { type: "text", containerId: "shape-1" },
    { type: "rectangle" },
  ), true);
  assert.equal(allowsNativeTextDoubleClick({ type: "rectangle" }), true);
  assert.equal(allowsNativeTextDoubleClick({ type: "ellipse", customData: {} }), true);
  assert.equal(allowsNativeTextDoubleClick({ type: "diamond" }), true);
});

test("blocks text creation on media and technical canvas objects", () => {
  assert.equal(allowsNativeTextDoubleClick({
    type: "rectangle",
    customData: { materialKind: "audio" },
  }), false);
  assert.equal(allowsNativeTextDoubleClick({
    type: "embeddable",
    customData: { materialKind: "youtube" },
  }), false);
  assert.equal(allowsNativeTextDoubleClick({
    type: "rectangle",
    customData: { role: "image-cover" },
  }), false);
  assert.equal(allowsNativeTextDoubleClick({ type: "image" }), false);
  assert.equal(allowsNativeTextDoubleClick({ type: "freedraw" }), false);
  assert.equal(allowsNativeTextDoubleClick(
    { type: "text", containerId: "audio-1" },
    { type: "rectangle", customData: { materialKind: "audio" } },
  ), false);
});

test("preselects only existing editable text while the hand tool owns the first click", () => {
  const freeText = { id: "text-1", type: "text" };
  const boundText = { id: "text-2", type: "text", containerId: "shape-1" };
  const shape = {
    id: "shape-1",
    type: "rectangle",
    boundElements: [{ id: "text-2", type: "text" }],
  };
  const emptyShape = { id: "shape-2", type: "rectangle" };
  const elements = [freeText, boundText, shape, emptyShape];

  assert.equal(existingTextSelectionTarget(freeText, null, elements), freeText);
  assert.equal(existingTextSelectionTarget(boundText, shape, elements), shape);
  assert.equal(existingTextSelectionTarget(shape, null, elements), shape);
  assert.equal(existingTextSelectionTarget(emptyShape, null, elements), null);
});

test("keeps existing text editable when it belongs to an image annotation group", () => {
  const materialGroupId = "tafelraum-image-annotations:image-1";
  const groupedText = {
    groupIds: [materialGroupId],
    id: "text-on-image",
    type: "text",
  };

  assert.equal(existingTextSelectionTarget(groupedText, null, [groupedText]), groupedText);
});

test("uses the complete interior of an independent shape above an image for text editing", () => {
  const image = { height: 300, id: "image-1", type: "image", width: 400, x: 100, y: 100 };
  const rectangle = { angle: 0, height: 80, id: "shape-1", type: "rectangle", width: 140, x: 180, y: 160 };
  const ellipse = { angle: Math.PI / 4, height: 100, id: "shape-2", type: "ellipse", width: 100, x: 340, y: 160 };
  const elements = [image, rectangle, ellipse];

  assert.equal(editableShapeAboveImageAtPoint(elements, image.id, { x: 250, y: 200 }), rectangle);
  assert.equal(editableShapeAboveImageAtPoint(elements, image.id, { x: 390, y: 210 }), ellipse);
});

test("does not promote shapes below an image or technical rectangles", () => {
  const shapeBelow = { height: 80, id: "shape-below", type: "rectangle", width: 120, x: 150, y: 150 };
  const image = { height: 300, id: "image-1", type: "image", width: 400, x: 100, y: 100 };
  const cover = {
    customData: { role: "image-cover" },
    height: 80,
    id: "cover-1",
    type: "rectangle",
    width: 120,
    x: 150,
    y: 150,
  };

  assert.equal(editableShapeAboveImageAtPoint([shapeBelow, image, cover], image.id, { x: 200, y: 180 }), null);
});

import assert from "node:assert/strict";
import test from "node:test";
import type { ExcalidrawImageElement } from "@excalidraw/excalidraw/element/types";
import {
  applyImageCropRect,
  imageCropRectFromPoints,
  imageCropRectFromTrimHandle,
  shouldExitImageCropUi,
} from "./image-crop.ts";

function image(overrides: Partial<ExcalidrawImageElement> = {}) {
  return {
    angle: 0,
    crop: null,
    height: 200,
    scale: [1, 1],
    width: 400,
    x: 100,
    y: 50,
    ...overrides,
  } as ExcalidrawImageElement;
}

test("creates a constrained crop rectangle in either drag direction", () => {
  const rect = imageCropRectFromPoints({ x: 0.8, y: 1.2 }, { x: 0.2, y: 0.1 });
  assert.equal(rect.height, 0.9);
  assert.ok(Math.abs(rect.width - 0.6) < Number.EPSILON);
  assert.equal(rect.x, 0.2);
  assert.equal(rect.y, 0.1);
});

test("trims complete edges and corners while keeping a minimum visible area", () => {
  const full = { x: 0, y: 0, width: 1, height: 1 };
  assert.deepEqual(imageCropRectFromTrimHandle(full, "west", { x: 0.25, y: 0.8 }), {
    x: 0.25,
    y: 0,
    width: 0.75,
    height: 1,
  });
  assert.deepEqual(imageCropRectFromTrimHandle(full, "south-east", { x: 0.7, y: 0.6 }), {
    x: 0,
    y: 0,
    width: 0.7,
    height: 0.6,
  });
  assert.deepEqual(imageCropRectFromTrimHandle(full, "north-west", { x: 2, y: 2 }, 0.1), {
    x: 0.9,
    y: 0.9,
    width: 0.09999999999999998,
    height: 0.09999999999999998,
  });
});

test("exits crop UI when its image actions are no longer visible", () => {
  assert.equal(shouldExitImageCropUi("image-a", null), true);
  assert.equal(shouldExitImageCropUi("image-a", "image-b"), true);
  assert.equal(shouldExitImageCropUi("image-a", "image-a"), false);
  assert.equal(shouldExitImageCropUi(null, null), false);
});

test("applies a selected area without changing the source dimensions", () => {
  const result = applyImageCropRect(image(), { x: 0.25, y: 0.1, width: 0.5, height: 0.6 }, { width: 1600, height: 800 });
  assert.deepEqual(result, {
    crop: {
      height: 480,
      naturalHeight: 800,
      naturalWidth: 1600,
      width: 800,
      x: 400,
      y: 80,
    },
    height: 120,
    width: 200,
    x: 200,
    y: 70,
  });
});

test("composes a new selection with an existing crop and rotation", () => {
  const result = applyImageCropRect(image({
    angle: Math.PI / 2,
    crop: { x: 200, y: 100, width: 1000, height: 600, naturalWidth: 1600, naturalHeight: 900 },
  }), { x: 0, y: 0, width: 0.5, height: 1 }, { width: 1600, height: 900 });
  assert.equal(result.crop?.x, 200);
  assert.equal(result.crop?.width, 500);
  assert.equal(result.width, 200);
  assert.equal(result.height, 200);
  assert.equal(result.x, 200);
  assert.equal(result.y, -50);
});

test("maps a flipped visual selection back into source coordinates", () => {
  const result = applyImageCropRect(image({ scale: [-1, 1] }), { x: 0, y: 0, width: 0.25, height: 1 }, { width: 1600, height: 800 });
  assert.equal(result.crop?.x, 1200);
  assert.equal(result.crop?.width, 400);
});

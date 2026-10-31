import assert from "node:assert/strict";
import test from "node:test";
import {
  constrainImageCoverRect,
  constrainImageCoverGeometry,
  forgetImageCover,
  imageCoverRectToScene,
  imagePointToNormalized,
  initialImageCoverEdge,
  initialImageCoverRect,
  isImageCoverFull,
  nearestImageCoverEdge,
  recallImageCover,
  rememberImageCover,
  sceneCoverToImageRect,
  transformImageCoverRect,
  type ImageGeometry,
} from "./image-cover.ts";

const image: ImageGeometry = {
  angle: Math.PI / 2,
  height: 200,
  width: 400,
  x: 100,
  y: 50,
};

test("starts a first cover across the complete image from a stable edge", () => {
  assert.deepEqual(initialImageCoverRect, { x: 0, y: 0, width: 1, height: 1 });
  assert.equal(isImageCoverFull(initialImageCoverRect), true);
  assert.equal(nearestImageCoverEdge(initialImageCoverRect, initialImageCoverEdge), "right");
});

test("moves a cover only within the image", () => {
  assert.deepEqual(transformImageCoverRect(
    { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
    "move",
    0.8,
    -0.8,
    0.1,
    0.1,
  ), { x: 0.5, y: 0, width: 0.5, height: 0.5 });
});

test("repairs persisted cover geometry without changing its usable size", () => {
  assert.deepEqual(constrainImageCoverRect({ x: -0.3, y: 0.4, width: 0.7, height: 1.4 }), {
    x: 0,
    y: 0,
    width: 0.7,
    height: 1,
  });
});

test("repairs drifted scene geometry back into its image", () => {
  assert.deepEqual(constrainImageCoverGeometry(
    { x: 100, y: 100, width: 400, height: 600, angle: 0 },
    { x: -100, y: 150, width: 300, height: 800, angle: 0 },
  ), { x: 100, y: 100, width: 300, height: 600, angle: 0 });
});

test("routes only a complete cover to the whole material", () => {
  assert.equal(isImageCoverFull({ x: 0, y: 0, width: 1, height: 1 }), true);
  assert.equal(isImageCoverFull({ x: 0, y: 0, width: 0.9995, height: 1 }), true);
  assert.equal(isImageCoverFull({ x: 0, y: 0, width: 0.75, height: 1 }), false);
});

test("uses the nearest image edge and keeps a meaningful tie fallback", () => {
  assert.equal(nearestImageCoverEdge({ x: 0.6, y: 0.2, width: 0.3, height: 0.6 }), "right");
  assert.equal(nearestImageCoverEdge({ x: 0, y: 0.2, width: 0.3, height: 0.6 }), "left");
  assert.equal(nearestImageCoverEdge({ x: 0.2, y: 0, width: 0.6, height: 0.25 }), "top");
  assert.equal(nearestImageCoverEdge({ x: 0, y: 0, width: 1, height: 1 }, "left"), "left");
});

test("resizes all four sides without crossing the image or minimum size", () => {
  const start = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
  assert.deepEqual(transformImageCoverRect(start, "north-west", -0.8, -0.8, 0.1, 0.1), {
    x: 0,
    y: 0,
    width: 0.75,
    height: 0.75,
  });
  assert.deepEqual(transformImageCoverRect(start, "south-east", 0.8, 0.8, 0.1, 0.1), {
    x: 0.25,
    y: 0.25,
    width: 0.75,
    height: 0.75,
  });
  const narrowed = transformImageCoverRect(start, "west", 0.48, 0, 0.1, 0.1);
  assert.equal(narrowed.x, 0.65);
  assert.equal(narrowed.y, 0.25);
  assert.ok(Math.abs(narrowed.width - 0.1) < 1e-12);
  assert.equal(narrowed.height, 0.5);
});

test("converts a normalized cover through rotated scene geometry without drift", () => {
  const normalized = { x: 0.5, y: 0, width: 0.5, height: 1 };
  const scene = imageCoverRectToScene(image, normalized);
  assert.deepEqual(scene, {
    angle: Math.PI / 2,
    height: 200,
    width: 200,
    x: 200,
    y: 150,
  });
  assert.deepEqual(sceneCoverToImageRect(image, scene), normalized);
});

test("maps scene points into the rotated image coordinate system", () => {
  assert.deepEqual(imagePointToNormalized(image, { x: 200, y: 250 }), { x: 0.75, y: 1 });
});

test("remembers a hidden cover as image-local geometry and docking edge", () => {
  const customData = rememberImageCover(
    { archiveMaterialPath: "materials/page.png" },
    { x: 0.2, y: 0.1, width: 0.8, height: 0.75 },
    "left",
  );

  const recalled = recallImageCover({ customData });
  assert.ok(recalled);
  assert.equal(recalled.edge, "left");
  assert.ok(Math.abs(recalled.rect.x - 0.2) < 1e-12);
  assert.deepEqual(
    { height: recalled.rect.height, width: recalled.rect.width, y: recalled.rect.y },
    { height: 0.75, width: 0.8, y: 0.1 },
  );
  assert.deepEqual(forgetImageCover(customData), {
    archiveMaterialPath: "materials/page.png",
  });
});

test("restores remembered cover proportions after the image moved and resized", () => {
  const memory = recallImageCover({
    customData: rememberImageCover(undefined, { x: 0, y: 0, width: 0.8, height: 1 }, "left"),
  });
  assert.ok(memory);
  assert.deepEqual(imageCoverRectToScene(
    { x: 300, y: 200, width: 200, height: 500, angle: 0 },
    memory.rect,
  ), {
    x: 300,
    y: 200,
    width: 160,
    height: 500,
    angle: 0,
  });
});

test("ignores malformed remembered cover data", () => {
  assert.equal(recallImageCover({
    customData: {
      tafelraumImageCoverMemory: {
        edge: "diagonal",
        rect: { x: 0, y: 0, width: 0.8, height: 1 },
        version: 1,
      },
    },
  }), null);
});

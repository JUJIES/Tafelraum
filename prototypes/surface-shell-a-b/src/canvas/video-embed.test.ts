import assert from "node:assert/strict";
import test from "node:test";
import {
  getVideoPlayerViewportScale,
  isLocalVideoMaterialElement,
  videoPlayerHeight,
  videoPlayerWidth,
} from "./video-embed.ts";

test("keeps the persisted local video geometry at sixteen by nine", () => {
  assert.equal(videoPlayerWidth, 640);
  assert.equal(videoPlayerHeight, 360);
});

test("scales the complete local video surface uniformly", () => {
  assert.equal(getVideoPlayerViewportScale(640, 360), 1);
  assert.equal(getVideoPlayerViewportScale(320, 180), 0.5);
  assert.equal(getVideoPlayerViewportScale(960, 540), 1.5);
  assert.equal(getVideoPlayerViewportScale(640, 180), 0.5);
});

test("recognizes only live local video placeholders", () => {
  assert.equal(isLocalVideoMaterialElement({ customData: { materialKind: "video" } }), true);
  assert.equal(isLocalVideoMaterialElement({ isDeleted: true, customData: { materialKind: "video" } }), false);
  assert.equal(isLocalVideoMaterialElement({ customData: { materialKind: "youtube" } }), false);
});

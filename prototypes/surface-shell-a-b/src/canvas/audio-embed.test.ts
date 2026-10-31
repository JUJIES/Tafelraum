import assert from "node:assert/strict";
import test from "node:test";
import {
  audioPlayerHeight,
  audioPlayerWidth,
  getAudioPlayerViewportScale,
} from "./audio-embed.ts";

test("keeps the persisted audio placeholder geometry stable", () => {
  assert.equal(audioPlayerWidth, 460);
  assert.equal(audioPlayerHeight, 88);
});

test("scales the complete audio surface uniformly from its fixed geometry", () => {
  assert.equal(getAudioPlayerViewportScale(460, 88), 1);
  assert.equal(getAudioPlayerViewportScale(230, 44), 0.5);
  assert.equal(getAudioPlayerViewportScale(23, 4.4), 0.05);
  assert.ok(Math.abs(getAudioPlayerViewportScale(4.6, 0.88) - 0.01) < Number.EPSILON);
  assert.equal(getAudioPlayerViewportScale(920, 176), 2);
  assert.equal(getAudioPlayerViewportScale(920, 88), 1);
});

test("does not let the audio surface outgrow its frame below ten percent", () => {
  assert.ok(getAudioPlayerViewportScale(23, 4.4) < 0.1);
  assert.ok(getAudioPlayerViewportScale(0, 0) > 0);
});

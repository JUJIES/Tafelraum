import {getYouTubeVolumeFromMessage} from './youtube-embed.ts';
import assert from "node:assert/strict";
import test from "node:test";
import {
  getYouTubeEmbedUrl,
  getYouTubePlaybackCommand,
  getYouTubePlaceholderPatch,
  getYouTubePlayerProjectionSize,
  getYouTubeProviderControlsHeight,
  getYouTubeProviderTopControlsHeight,
  getYouTubePlayingStateFromMessage,
  shouldToggleYouTubePlaybackAfterGesture,
  youtubePlayerHeight,
  youtubePlayerWidth,
  youtubeProviderControlsHeight,
  youtubeProviderTopControlsHeight,
} from "./youtube-embed.ts";

test("scales YouTube controls down as one surface without ever scaling the iframe up", () => {
  assert.deepEqual(getYouTubePlayerProjectionSize(640, 360, 1), {
    surfaceHeight: 360,
    surfaceScale: 1,
    surfaceWidth: 640,
    viewportHeight: 360,
    viewportWidth: 640,
  });
  assert.deepEqual(getYouTubePlayerProjectionSize(640, 360, 1.6), {
    surfaceHeight: 576,
    surfaceScale: 1,
    surfaceWidth: 1024,
    viewportHeight: 576,
    viewportWidth: 1024,
  });
  assert.deepEqual(getYouTubePlayerProjectionSize(320, 180, 0.5), {
    surfaceHeight: 180,
    surfaceScale: 0.5,
    surfaceWidth: 320,
    viewportHeight: 90,
    viewportWidth: 160,
  });
  assert.equal(youtubePlayerWidth, 640);
  assert.equal(youtubePlayerHeight, 360);
});

test("keeps the provider control zones reachable without consuming a shallow player", () => {
  assert.equal(youtubeProviderControlsHeight, 128);
  assert.equal(youtubeProviderTopControlsHeight, 64);
  assert.equal(getYouTubeProviderControlsHeight(360), 128);
  assert.equal(getYouTubeProviderTopControlsHeight(360), 64);
  assert.equal(getYouTubeProviderControlsHeight(120), 60);
  assert.equal(getYouTubeProviderTopControlsHeight(120), 30);
  assert.equal(getYouTubeProviderControlsHeight(Number.NaN), 0);
  assert.equal(getYouTubeProviderTopControlsHeight(Number.NaN), 0);
  assert.ok(getYouTubeProviderControlsHeight(120) + getYouTubeProviderTopControlsHeight(120) < 120);
});

test("derives one stable privacy-enhanced iframe source independent of canvas zoom", () => {
  const source = getYouTubeEmbedUrl("M7lc1UVf-VE", "http://127.0.0.1:5175");
  assert.match(source, /^https:\/\/www\.youtube-nocookie\.com\/embed\/M7lc1UVf-VE\?/);
  assert.match(source, /enablejsapi=1/);
  assert.match(source, /origin=http%3A%2F%2F127\.0\.0\.1%3A5175/);
});

test("derives play and pause state from YouTube iframe API messages", () => {
  assert.equal(getYouTubePlayingStateFromMessage(JSON.stringify({
    event: "infoDelivery",
    info: { playerState: 1 },
  })), true);
  assert.equal(getYouTubePlayingStateFromMessage({
    event: "infoDelivery",
    info: { playerState: 3 },
  }), true);
  assert.equal(getYouTubePlayingStateFromMessage({
    event: "infoDelivery",
    info: { playerState: 2 },
  }), false);
  assert.equal(getYouTubePlayingStateFromMessage({ event: "onReady" }), null);
  assert.equal(getYouTubePlayingStateFromMessage("not-json"), null);
});

test("keeps click and drag intents mutually exclusive on the video surface", () => {
  assert.equal(shouldToggleYouTubePlaybackAfterGesture(false), true);
  assert.equal(shouldToggleYouTubePlaybackAfterGesture(true), false);
  assert.equal(getYouTubePlaybackCommand(false), "playVideo");
  assert.equal(getYouTubePlaybackCommand(true), "pauseVideo");
});

test("migrates the legacy native embed to transparent canvas geometry without changing identity or bounds", () => {
  const legacy = {
    id: "video-1",
    type: "embeddable",
    x: 30,
    y: 40,
    width: 720,
    height: 405,
    link: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    backgroundColor: "#101318",
    fillStyle: "solid",
    opacity: 100,
    roughness: 0,
    strokeColor: "transparent",
    strokeWidth: 1,
    customData: {
      archiveMaterialPath: "stunden/test/material/@links/M7lc1UVf-VE",
      hideLinkIcon: true,
      materialKind: "youtube",
      sourceTitle: "YouTube · M7lc1UVf-VE",
      sourceUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
      videoId: "M7lc1UVf-VE",
    },
  } as Parameters<typeof getYouTubePlaceholderPatch>[0];

  const patch = getYouTubePlaceholderPatch(legacy);
  assert.ok(patch);
  assert.equal(patch.type, "rectangle");
  assert.equal(patch.link, null);
  assert.equal(patch.backgroundColor, "transparent");
  assert.equal(patch.customData.hideLinkIcon, undefined);
  assert.equal(patch.customData.materialKind, "youtube");
});

test('YouTube volume handoff accepts only bounded provider percentages',()=>{
  assert.equal(getYouTubeVolumeFromMessage(JSON.stringify({info:{volume:35}})),.35);
  for(const value of [-1,101,Infinity,'35',null])assert.equal(getYouTubeVolumeFromMessage({info:{volume:value}}),null);
  assert.equal(getYouTubeVolumeFromMessage('{'),null);
});

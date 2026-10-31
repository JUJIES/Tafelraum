import assert from "node:assert/strict";
import test from "node:test";
import type { ExcalidrawElement, FileId } from "@excalidraw/excalidraw/element/types";
import { enhanceScanPixels, readScanEnhancement, referencedImageFileIds, scanEnhancementKind } from "./scan-enhancement.ts";

test("scan enhancement darkens pale neutral ink without changing paper white or transparency", () => {
  const input = new Uint8ClampedArray([
    255, 255, 255, 255,
    220, 220, 220, 255,
    120, 120, 120, 0,
  ]);
  const output = enhanceScanPixels(input);
  assert.deepEqual([...output.slice(0, 4)], [255, 255, 255, 255]);
  assert.ok(output[4] < 205 && output[5] === output[4] && output[6] === output[4]);
  assert.deepEqual([...output.slice(8, 12)], [120, 120, 120, 0]);
  assert.deepEqual([...input.slice(4, 8)], [220, 220, 220, 255]);
});

test("scan enhancement protects chromatic pixels more strongly than neutral pixels", () => {
  const output = enhanceScanPixels(new Uint8ClampedArray([
    220, 220, 220, 255,
    235, 205, 180, 255,
  ]));
  const neutralDarkening = 220 - output[0];
  const colorLuminanceBefore = 235 * 0.299 + 205 * 0.587 + 180 * 0.114;
  const colorLuminanceAfter = output[4] * 0.299 + output[5] * 0.587 + output[6] * 0.114;
  assert.ok(neutralDarkening > colorLuminanceBefore - colorLuminanceAfter);
});

test("optimized images keep both current and original files reachable", () => {
  const element = {
    type: "image",
    isDeleted: false,
    fileId: "enhanced" as FileId,
    customData: {
      scanEnhancement: {
        kind: scanEnhancementKind,
        originalAssetId: "original",
        originalFileId: "original" as FileId,
      },
    },
  } as unknown as ExcalidrawElement;
  assert.equal(readScanEnhancement(element)?.originalFileId, "original");
  assert.deepEqual(referencedImageFileIds(element), ["enhanced", "original"]);
});

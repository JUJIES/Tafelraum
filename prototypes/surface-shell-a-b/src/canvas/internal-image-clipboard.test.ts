import assert from "node:assert/strict";
import test from "node:test";
import {
  clearInternalImageCopyForTest,
  internalSceneForPastedImage,
  rememberInternalImageCopy,
} from "./internal-image-clipboard.ts";

test.afterEach(() => clearInternalImageCopyForTest());

test("restores editable scene data only for the exact exported PNG", async () => {
  const exported = new Blob(["png-binary-a"], { type: "image/png" });
  rememberInternalImageCopy("editable-scene", Promise.resolve(exported));

  assert.equal(
    await internalSceneForPastedImage(new Blob(["png-binary-a"], { type: "image/png" })),
    "editable-scene",
  );
  assert.equal(
    await internalSceneForPastedImage(new Blob(["png-binary-b"], { type: "image/png" })),
    null,
  );
});

test("a newer copy replaces the earlier editable representation", async () => {
  rememberInternalImageCopy("first-scene", Promise.resolve(new Blob(["first"], { type: "image/png" })));
  rememberInternalImageCopy("second-scene", Promise.resolve(new Blob(["second"], { type: "image/png" })));

  assert.equal(await internalSceneForPastedImage(new Blob(["first"], { type: "image/png" })), null);
  assert.equal(
    await internalSceneForPastedImage(new Blob(["second"], { type: "image/png" })),
    "second-scene",
  );
});

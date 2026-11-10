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
  const copy = { lessonId: "source-lesson", sceneText: "editable-scene" };
  rememberInternalImageCopy(copy, Promise.resolve(exported));

  assert.deepEqual(
    await internalSceneForPastedImage(new Blob(["png-binary-a"], { type: "image/png" })),
    copy,
  );
  assert.equal(
    await internalSceneForPastedImage(new Blob(["png-binary-b"], { type: "image/png" })),
    null,
  );
});

test("a newer copy replaces the earlier editable representation", async () => {
  rememberInternalImageCopy({ lessonId: "first-lesson", sceneText: "first-scene" }, Promise.resolve(new Blob(["first"], { type: "image/png" })));
  const newest = { lessonId: "second-lesson", sceneText: "second-scene" };
  rememberInternalImageCopy(newest, Promise.resolve(new Blob(["second"], { type: "image/png" })));

  assert.equal(await internalSceneForPastedImage(new Blob(["first"], { type: "image/png" })), null);
  assert.deepEqual(
    await internalSceneForPastedImage(new Blob(["second"], { type: "image/png" })),
    newest,
  );
});

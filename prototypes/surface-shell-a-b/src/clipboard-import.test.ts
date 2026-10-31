import assert from "node:assert/strict";
import test from "node:test";
import { isExternalTextPaste, hasCanvasClipboardData, imageFilesFromClipboard, webLinkFromClipboard, youtubeLinkFromClipboard } from "./clipboard-import.ts";

test("only external text receives the theme default on paste", () => {
  assert.equal(isExternalTextPaste({ text: "Überschrift\nText" }), true);
  assert.equal(isExternalTextPaste({ text: "fallback", elements: [{ type: "text" }] }), false);
  assert.equal(isExternalTextPaste({ text: "table", spreadsheet: {} }), false);
  assert.equal(isExternalTextPaste({ text: "" }), false);
});

test("recognizes editable canvas clipboard representations without swallowing ordinary text", () => {
  for (const type of ["excalidraw", "excalidraw/clipboard"]) {
    assert.equal(hasCanvasClipboardData(JSON.stringify({ type, elements: [{ id: "image" }] })), true);
  }
  for (const text of ["normaler Text", "null", '{"type":"image","elements":[1]}', '{"type":"excalidraw","elements":[]}']) {
    assert.equal(hasCanvasClipboardData(text), false);
  }
});

function clipboardItem(file: File | null, type = file?.type ?? "image/png") {
  return {
    getAsFile: () => file,
    kind: "file",
    type,
  };
}

test("extracts supported image files from the system clipboard", () => {
  const png = new File(["png"], "Zwischenablage.png", { type: "image/png" });
  const jpeg = new File(["jpeg"], "Foto.jpg", { type: "image/jpeg" });

  assert.deepEqual(imageFilesFromClipboard({
    items: [
      clipboardItem(png),
      { getAsFile: () => null, kind: "string", type: "text/plain" },
      clipboardItem(jpeg),
    ],
  }), [png, jpeg]);
});

test("leaves canvas clipboard data and unsupported files to their existing handlers", () => {
  const pdf = new File(["pdf"], "Arbeitsblatt.pdf", { type: "application/pdf" });

  assert.deepEqual(imageFilesFromClipboard({
    items: [
      { getAsFile: () => null, kind: "string", type: "text/plain" },
      clipboardItem(pdf),
      clipboardItem(null),
    ],
  }), []);
});

test("uses the clipboard file list as a browser fallback", () => {
  const webp = new File(["webp"], "Tafelbild.webp", { type: "image/webp" });

  assert.deepEqual(imageFilesFromClipboard({ items: [], files: [webp] }), [webp]);
});

test("recognizes a single YouTube URL without taking over ordinary pasted text", () => {
  const clipboard = (plain: string, uri = "") => ({
    getData: (type: string) => type === "text/uri-list" ? uri : plain,
  });

  assert.equal(
    youtubeLinkFromClipboard(clipboard("https://www.youtube.com/watch?v=M7lc1UVf-VE")),
    "https://www.youtube.com/watch?v=M7lc1UVf-VE",
  );
  assert.equal(
    youtubeLinkFromClipboard(clipboard("ignored", "https://youtu.be/M7lc1UVf-VE")),
    "https://youtu.be/M7lc1UVf-VE",
  );
  assert.equal(youtubeLinkFromClipboard(clipboard("https://example.com/video")), null);
  assert.equal(youtubeLinkFromClipboard(clipboard("Text mit https://youtu.be/M7lc1UVf-VE")), null);
  assert.equal(youtubeLinkFromClipboard(clipboard("https://youtu.be/one\nhttps://youtu.be/two")), null);
});

test("recognizes one safe web URL for the archived material-link path", () => {
  const clipboard = (plain: string, uri = "") => ({
    getData: (type: string) => type === "text/uri-list" ? uri : plain,
  });

  assert.equal(webLinkFromClipboard(clipboard("https://example.com/unterricht")), "https://example.com/unterricht");
  assert.equal(webLinkFromClipboard(clipboard("ignored", "http://example.com/material")), "http://example.com/material");
  assert.equal(webLinkFromClipboard(clipboard("javascript:alert(1)")), null);
  assert.equal(webLinkFromClipboard(clipboard("Text mit https://example.com")), null);
  assert.equal(webLinkFromClipboard(clipboard("https://one.example\nhttps://two.example")), null);
});

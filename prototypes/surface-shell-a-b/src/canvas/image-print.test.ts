import assert from "node:assert/strict";
import test from "node:test";
import { canPrintImageSourceDirectly, getImagePrintStrategy, getPrintPageOrientation, openImagePrintDialog } from "./image-print.ts";
import { printDocument } from "./print-dialog.ts";

test("image and HTML native printing share the existing command and propagate failures", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const calls: string[] = [];
  const nativeWindow = {
    focus: () => calls.push("focus"),
    print: () => { throw new Error("Native print must use the command"); },
    __TAURI_INTERNALS__: { invoke: async (command: string) => { calls.push(command); } },
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: nativeWindow });
  try {
    await printDocument();
    assert.deepEqual(calls, ["focus", "print_desktop_webview"]);
    nativeWindow.__TAURI_INTERNALS__.invoke = async () => { throw new Error("Druckdialog nicht verfügbar"); };
    await assert.rejects(printDocument(), /Druckdialog nicht verfügbar/);
    const browserFrame = { focus: () => calls.push("frame focus"), print: () => calls.push("frame print") } as unknown as Window;
    await printDocument(browserFrame);
    assert.deepEqual(calls.slice(-2), ["frame focus", "frame print"]);
  } finally {
    if (previous) Object.defineProperty(globalThis, "window", previous);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("uses portrait for upright and square material", () => {
  assert.equal(getPrintPageOrientation(1200, 1600), "portrait");
  assert.equal(getPrintPageOrientation(1200, 1200), "portrait");
});

test("uses landscape for wide material", () => {
  assert.equal(getPrintPageOrientation(1600, 1200), "landscape");
});

test("prints an unchanged raster source directly", () => {
  assert.equal(canPrintImageSourceDirectly({ angle: 0, cropped: false, scaleX: 1, scaleY: 1 }), true);
  assert.equal(canPrintImageSourceDirectly({ angle: Math.PI * 2, cropped: false, scaleX: 1, scaleY: 1 }), true);
});

test("renders transformed raster material before printing", () => {
  assert.equal(canPrintImageSourceDirectly({ angle: Math.PI / 2, cropped: false, scaleX: 1, scaleY: 1 }), false);
  assert.equal(canPrintImageSourceDirectly({ angle: 0, cropped: true, scaleX: 1, scaleY: 1 }), false);
  assert.equal(canPrintImageSourceDirectly({ angle: 0, cropped: false, scaleX: -1, scaleY: 1 }), false);
});

test("uses a visible top-level print surface in Safari", () => {
  assert.equal(getImagePrintStrategy("Mozilla/5.0 Version/18.6 Safari/605.1.15"), "top-level");
  assert.equal(getImagePrintStrategy("Mozilla/5.0 CriOS/138.0 Mobile Safari/604.1"), "frame");
});

test("native macOS image printing uses the main document even without a Safari user agent", () => {
  assert.equal(getImagePrintStrategy("Mozilla/5.0 AppleWebKit/605.1.15", true), "top-level");
  assert.equal(getImagePrintStrategy("Mozilla/5.0 AppleWebKit/605.1.15"), "frame");
});

test("keeps the isolated print frame in Chromium", () => {
  assert.equal(getImagePrintStrategy("Mozilla/5.0 Chrome/138.0.0.0 Safari/537.36"), "frame");
});


test("native image printing can repeat after cancellation without waiting for screen animation frames", async () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const surfaces = new Set<Element>();
  class PrintElement extends EventTarget {
    className = "";
    dataset = {};
    textContent = "";
    naturalWidth = 1200;
    naturalHeight = 1600;
    setAttribute() {}
    append(...children: Element[]) { if (this === fakeDocument.head || this === fakeDocument.body) children.forEach(child => surfaces.add(child)); }
    remove() { surfaces.delete(this as unknown as Element); }
    set src(_value: string) { queueMicrotask(() => this.dispatchEvent(new Event("load"))); }
  }
  let printCalls = 0;
  const nativeWindow = Object.assign(new EventTarget(), {
    focus() {},
    setTimeout,
    clearTimeout,
    requestAnimationFrame() { throw new Error("Native print must not await a screen frame"); },
    __TAURI_INTERNALS__: {
      async invoke(command: string) {
        assert.equal(command, "print_desktop_webview");
        printCalls++;
        nativeWindow.dispatchEvent(new Event("afterprint"));
      },
    },
  });
  Object.defineProperty(globalThis, "window", { configurable: true, value: nativeWindow });
  const fakeDocument = { createElement: () => new PrintElement(), head: new PrintElement(), body: new PrintElement() };
  Object.defineProperty(globalThis, "document", { configurable: true, value: fakeDocument });
  try {
    await openImagePrintDialog("data:image/png;base64,fixture", "City Bikes", "WKWebView");
    assert.equal(surfaces.size, 0);
    await openImagePrintDialog("data:image/png;base64,fixture", "City Bikes", "WKWebView");
    assert.equal(printCalls, 2);
    assert.equal(surfaces.size, 0);
    nativeWindow.__TAURI_INTERNALS__.invoke = async () => { throw new Error("Native print failed"); };
    await assert.rejects(openImagePrintDialog("data:image/png;base64,fixture", "City Bikes", "WKWebView"), /Native print failed/);
    assert.equal(surfaces.size, 0);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (previousDocument) Object.defineProperty(globalThis, "document", previousDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
});

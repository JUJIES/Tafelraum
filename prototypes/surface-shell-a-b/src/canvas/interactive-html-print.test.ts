import assert from "node:assert/strict";
import test from "node:test";
import { getInteractiveHtmlPrintStrategy } from "./interactive-html-print.ts";

test("uses the current top-level webview for Safari and the native macOS app", () => {
  assert.equal(getInteractiveHtmlPrintStrategy("Mozilla/5.0 Version/18.6 Safari/605.1.15"), "top-level");
  assert.equal(getInteractiveHtmlPrintStrategy("Mozilla/5.0 AppleWebKit/605.1.15", true), "top-level");
});

test("keeps the isolated popup print view in Chromium", () => {
  assert.equal(getInteractiveHtmlPrintStrategy("Mozilla/5.0 Chrome/138.0.0.0 Safari/537.36"), "popup");
  assert.equal(getInteractiveHtmlPrintStrategy("Mozilla/5.0 CriOS/138.0 Mobile Safari/604.1"), "popup");
});

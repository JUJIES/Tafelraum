import assert from "node:assert/strict";
import test from "node:test";
import { normalizeExternalWebUrl } from "./external-link.ts";

test("allows normalized http and https links", () => {
  assert.equal(normalizeExternalWebUrl("https://example.org/material?q=1"), "https://example.org/material?q=1");
  assert.equal(normalizeExternalWebUrl("http://example.org"), "http://example.org/");
});

test("rejects malformed and non-web links", () => {
  assert.equal(normalizeExternalWebUrl("not a url"), null);
  assert.equal(normalizeExternalWebUrl("file:///Users/test/material.pdf"), null);
  assert.equal(normalizeExternalWebUrl("javascript:alert(1)"), null);
});

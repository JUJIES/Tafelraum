import distribution from "../distribution.json" with {type:"json"};
import assert from "node:assert/strict";
import test from "node:test";
import {
  embeddedAppById,
  embeddedApps,
  isEmbeddedAppElement,
  shouldPreserveBrowserPlusShortcut,
} from "./embedded-apps.ts";

test("only the developer registry resolves embedded apps", () => {
  assert.deepEqual(embeddedApps.map((app) => app.id), distribution.embeddedApps.map(app=>app.id));
  if(distribution.profile === "public") assert.deepEqual(embeddedApps,[]);
  for(const app of distribution.embeddedApps) assert.equal(embeddedAppById(app.id)?.sourceUrl,app.sourceUrl);
  assert.equal(embeddedAppById("https://example.com"), null);
});

test("canvas app elements require a registered id", () => {
  assert.equal(isEmbeddedAppElement({ customData: { surfaceKind: "embedded-app", embeddedAppId: distribution.embeddedApps[0]?.id ?? "unavailable" } }), distribution.profile !== "public");
  assert.equal(isEmbeddedAppElement({ customData: { surfaceKind: "embedded-app", embeddedAppId: "unknown" } }), false);
  assert.equal(isEmbeddedAppElement({ isDeleted: true, customData: { surfaceKind: "embedded-app", embeddedAppId: distribution.embeddedApps[0]?.id ?? "unavailable" } }), false);
});

test("leaves the German physical plus key to the browser", () => {
  const event = {
    altKey: false,
    code: "BracketRight",
    ctrlKey: false,
    isComposing: false,
    key: "]",
    metaKey: true,
    shiftKey: false,
  };
  assert.equal(shouldPreserveBrowserPlusShortcut(event), true);
  assert.equal(shouldPreserveBrowserPlusShortcut({ ...event, shiftKey: true }), false);
  assert.equal(shouldPreserveBrowserPlusShortcut({ ...event, altKey: true }), false);
  assert.equal(shouldPreserveBrowserPlusShortcut({ ...event, code: "BracketLeft" }), false);
  assert.equal(shouldPreserveBrowserPlusShortcut({ ...event, metaKey: false }), false);
});

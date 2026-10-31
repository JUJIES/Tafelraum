import assert from "node:assert/strict";
import test from "node:test";
import { shouldOpenAutomaticUpdatePrompt } from "./desktop-update-prompt.ts";

test("offers each available update once after a quiet automatic check", () => {
  const prompted = new Set<string>();
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.45", prompted, "idle", false), true);
  prompted.add("0.1.45");
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.45", prompted, "idle", false), false);
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.46", prompted, "idle", false), true);
  prompted.add("0.1.46");
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.45", prompted, "idle", false), false);
  assert.equal(shouldOpenAutomaticUpdatePrompt(null, prompted, "idle", false), false);
});

test("waits for presentations and never interrupts an active update flow", () => {
  const prompted = new Set<string>();
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.45", prompted, "idle", true), false);
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.45", prompted, "checking", false), false);
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.45", prompted, "awaitingConfirmation", false), false);
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.45", prompted, "installing", false), false);
  assert.equal(shouldOpenAutomaticUpdatePrompt("0.1.45", prompted, "idle", false), true);
});

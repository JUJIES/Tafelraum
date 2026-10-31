import assert from "node:assert/strict";
import test from "node:test";

import {
  countUnsavedInteractiveHtmlChanges,
  readStoredInteractiveHtmlStates,
  withInteractiveHtmlState,
  withoutInteractiveHtmlState,
} from "./interactive-html-persistence.ts";

test("reads only valid instance states", () => {
  assert.deepEqual(readStoredInteractiveHtmlStates({
    first: { state: { answer: "Berlin" } },
    missing: {},
    nullState: { state: null },
    broken: "value",
  }), {
    first: { state: { answer: "Berlin" } },
  });
});

test("adds and removes one independent instance state", () => {
  const first = withInteractiveHtmlState({}, "element-1", { answer: "Berlin" });
  const second = withInteractiveHtmlState(first, "element-2", { answer: "Kapstadt" });
  assert.deepEqual(withoutInteractiveHtmlState(second, "element-1"), {
    "element-2": { state: { answer: "Kapstadt" } },
  });
});

test("rejects state larger than the interactive material limit", () => {
  const oversized = { answer: "x".repeat(70_000) };
  assert.deepEqual(withInteractiveHtmlState({}, "element-1", oversized), {});
});

test("warns only for changed instances whose automatic persistence was disabled", () => {
  const initial = new Map([
    ["disabled-dirty", { answer: "" }],
    ["disabled-clean", { answer: "" }],
    ["enabled-dirty", { answer: "" }],
  ]);
  const current = new Map([
    ["disabled-dirty", { answer: "Berlin" }],
    ["disabled-clean", { answer: "" }],
    ["enabled-dirty", { answer: "Kapstadt" }],
  ]);
  assert.equal(countUnsavedInteractiveHtmlChanges(
    new Set(["disabled-dirty", "disabled-clean"]),
    initial,
    current,
  ), 1);
});

test("compares semantic object state independent of property order", () => {
  assert.equal(countUnsavedInteractiveHtmlChanges(
    new Set(["element-1"]),
    new Map([["element-1", { first: 1, second: 2 }]]),
    new Map([["element-1", { second: 2, first: 1 }]]),
  ), 0);
});

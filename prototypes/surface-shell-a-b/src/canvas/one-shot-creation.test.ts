import assert from "node:assert/strict";
import test from "node:test";
import { updateOneShotCreation, type PendingOneShotCreation } from "./one-shot-creation.ts";

const update = ({
  activeCreationElements = [],
  activeTool = "shape",
  elements = [],
  knownElementIds = new Set<string>(),
  pending = null,
}: Partial<Parameters<typeof updateOneShotCreation>[0]> = {}) => updateOneShotCreation({
  activeCreationElements,
  activeTool,
  elements,
  knownElementIds,
  pending,
});

test("tracks a new form until it has been completed", () => {
  const started = update({
    activeCreationElements: [{ id: "shape-1", type: "rectangle" }],
    elements: [{ id: "shape-1", type: "rectangle" }],
  });
  assert.deepEqual(started, {
    completed: null,
    pending: { elementId: "shape-1", tool: "shape" },
  });

  const finished = update({
    elements: [{ id: "shape-1", type: "rectangle" }],
    knownElementIds: new Set(["shape-1"]),
    pending: started.pending,
  });
  assert.deepEqual(finished, {
    completed: { elementId: "shape-1", tool: "shape" },
    pending: null,
  });
});

test("waits for text editing to finish and accepts non-empty text", () => {
  const pending: PendingOneShotCreation = { elementId: "text-1", tool: "text" };
  assert.deepEqual(update({
    activeCreationElements: [{ id: "text-1", text: "Aufgabe", type: "text" }],
    activeTool: "text",
    elements: [{ id: "text-1", text: "Aufgabe", type: "text" }],
    pending,
  }), { completed: null, pending });

  assert.deepEqual(update({
    activeTool: "text",
    elements: [{ id: "text-1", text: "Aufgabe", type: "text" }],
    pending,
  }), { completed: pending, pending: null });
});

test("does not complete cancelled or empty creations", () => {
  const shapePending: PendingOneShotCreation = { elementId: "shape-1", tool: "shape" };
  const textPending: PendingOneShotCreation = { elementId: "text-1", tool: "text" };

  assert.deepEqual(update({ pending: shapePending }), { completed: null, pending: null });
  assert.deepEqual(update({
    activeTool: "text",
    elements: [{ id: "text-1", text: "   ", type: "text" }],
    pending: textPending,
  }), { completed: null, pending: null });
});

test("clears pending creation when the user chooses another tool", () => {
  const pending: PendingOneShotCreation = { elementId: "shape-1", tool: "shape" };
  assert.deepEqual(update({
    activeTool: "pen",
    elements: [{ id: "shape-1", type: "rectangle" }],
    pending,
  }), { completed: null, pending: null });
});

test("ignores existing elements that merely enter an edit state", () => {
  assert.deepEqual(update({
    activeCreationElements: [{ id: "text-existing", text: "Vorhanden", type: "text" }],
    activeTool: "text",
    elements: [{ id: "text-existing", text: "Vorhanden", type: "text" }],
    knownElementIds: new Set(["text-existing"]),
  }), { completed: null, pending: null });
});

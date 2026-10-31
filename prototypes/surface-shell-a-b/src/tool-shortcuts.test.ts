import assert from "node:assert/strict";
import test from "node:test";
import {
  desktopClipShortcutDecision,
  desktopFullscreenShortcutDecision,
  desktopSelectionRotationShortcutDecision,
  desktopToolbarShortcutDecision,
  desktopToolShortcuts,
  desktopToolShortcutDecision,
  isSuppressedEngineToolShortcut,
  selectableToolForShortcut,
  shouldPrepareTemporaryPan,
} from "./tool-shortcuts.ts";

test("toggles the toolbar with circumflex on German and US layouts, once per press", () => {
  assert.deepEqual(desktopToolbarShortcutDecision({ code: "Backquote", key: "Dead", repeat: false }), {
    suppress: true, toggle: true,
  });
  assert.deepEqual(desktopToolbarShortcutDecision({ code: "Digit6", key: "^", repeat: true }), {
    suppress: true, toggle: false,
  });
  assert.deepEqual(desktopToolbarShortcutDecision({ code: "IntlBackslash", key: "Dead", repeat: false }), {
    suppress: true, toggle: true,
  });
  assert.deepEqual(desktopToolbarShortcutDecision({ code: "IntlBackslash", key: "<", repeat: false }), {
    suppress: false, toggle: false,
  });
  assert.deepEqual(desktopToolbarShortcutDecision({ code: "Backquote", key: "`", repeat: false }), {
    suppress: false, toggle: false,
  });
});

test("rotates a selection left with Q and right with E, including held repeats", () => {
  assert.deepEqual(desktopSelectionRotationShortcutDecision({ code: "KeyQ", shiftKey: false }), {
    direction: "left",
    suppress: true,
  });
  assert.deepEqual(desktopSelectionRotationShortcutDecision({ code: "KeyE", shiftKey: false }), {
    direction: "right",
    suppress: true,
  });
  assert.deepEqual(desktopSelectionRotationShortcutDecision({ code: "KeyQ", shiftKey: true }), {
    direction: null,
    suppress: false,
  });
  assert.deepEqual(desktopSelectionRotationShortcutDecision({ code: "KeyW", shiftKey: false }), {
    direction: null,
    suppress: false,
  });
});

test("uses V once per key press for the shell fullscreen action", () => {
  assert.deepEqual(desktopFullscreenShortcutDecision({ code: "KeyV", repeat: false, shiftKey: false }), {
    suppress: true,
    toggle: true,
  });
  assert.deepEqual(desktopFullscreenShortcutDecision({ code: "KeyV", repeat: true, shiftKey: false }), {
    suppress: true,
    toggle: false,
  });
  assert.deepEqual(desktopFullscreenShortcutDecision({ code: "KeyV", repeat: false, shiftKey: true }), {
    suppress: false,
    toggle: false,
  });
  assert.deepEqual(desktopFullscreenShortcutDecision({ code: "KeyF", repeat: false, shiftKey: false }), {
    suppress: false,
    toggle: false,
  });
});

test("selects clip recording with C once per press", () => {
  assert.deepEqual(desktopClipShortcutDecision({ code: "KeyC", repeat: false, shiftKey: false }), { suppress: true, select: true });
  assert.deepEqual(desktopClipShortcutDecision({ code: "KeyC", repeat: true, shiftKey: false }), { suppress: true, select: false });
  assert.deepEqual(desktopClipShortcutDecision({ code: "KeyC", repeat: false, shiftKey: true }), { suppress: false, select: false });
});

test("maps the requested desktop shortcuts to Tafelraum tools", () => {
  assert.equal(selectableToolForShortcut("KeyS"), "pen");
  assert.equal(selectableToolForShortcut("KeyM"), "marker");
  assert.equal(selectableToolForShortcut("KeyR"), "eraser");
  assert.equal(selectableToolForShortcut("KeyT"), "text");
  assert.equal(selectableToolForShortcut("KeyA"), "selection");
  assert.equal(selectableToolForShortcut("KeyF"), null);
  assert.equal(selectableToolForShortcut("KeyV"), null);
});

test("keeps space as temporary pan instead of changing the selected tool", () => {
  assert.deepEqual(desktopToolShortcuts.hand, {
    aria: "Space",
    code: "Space",
    display: "Leertaste",
    mode: "temporary",
  });
  assert.equal(selectableToolForShortcut("Space"), null);
});

test("suppresses every native Excalidraw tool shortcut outside the Tafelraum contract", () => {
  for (const code of [
    "Digit0",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "KeyD",
    "KeyE",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyI",
    "KeyK",
    "KeyL",
    "KeyO",
    "KeyP",
    "KeyQ",
    "KeyV",
  ]) assert.equal(isSuppressedEngineToolShortcut(code), true, code);
  assert.equal(isSuppressedEngineToolShortcut("KeyB"), false);
});

test("keeps held Tafelraum shortcuts away from Excalidraw without switching repeatedly", () => {
  assert.deepEqual(desktopToolShortcutDecision({ code: "KeyA", repeat: false, shiftKey: false }), {
    suppress: true,
    tool: "selection",
  });
  assert.deepEqual(desktopToolShortcutDecision({ code: "KeyA", repeat: true, shiftKey: false }), {
    suppress: true,
    tool: null,
  });
  assert.deepEqual(desktopToolShortcutDecision({ code: "KeyL", repeat: true, shiftKey: false }), {
    suppress: true,
    tool: null,
  });
  assert.deepEqual(desktopToolShortcutDecision({ code: "KeyB", repeat: true, shiftKey: false }), {
    suppress: false,
    tool: null,
  });
});

test("keeps temporary pan on the canvas and leaves media controls in charge of space", () => {
  assert.equal(shouldPrepareTemporaryPan({
    code: "Space",
    embedOwnsFocus: false,
    interactiveControlOwnsFocus: false,
    key: " ",
  }), true);
  assert.equal(shouldPrepareTemporaryPan({
    code: "Space",
    embedOwnsFocus: true,
    interactiveControlOwnsFocus: false,
    key: " ",
  }), false);
  assert.equal(shouldPrepareTemporaryPan({
    code: "Space",
    embedOwnsFocus: false,
    interactiveControlOwnsFocus: true,
    key: " ",
  }), false);
});

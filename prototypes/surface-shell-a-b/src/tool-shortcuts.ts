import type { CanvasTool } from "./canvas/canvas-port";

export type DesktopToolShortcut = {
  aria: string;
  code: string;
  display: string;
  mode: "select" | "temporary";
};

export const desktopToolShortcuts: Partial<Record<CanvasTool, DesktopToolShortcut>> = {
  hand: { aria: "Space", code: "Space", display: "Leertaste", mode: "temporary" },
  selection: { aria: "A", code: "KeyA", display: "A", mode: "select" },
  pen: { aria: "S", code: "KeyS", display: "S", mode: "select" },
  marker: { aria: "M", code: "KeyM", display: "M", mode: "select" },
  eraser: { aria: "R", code: "KeyR", display: "R", mode: "select" },
  text: { aria: "T", code: "KeyT", display: "T", mode: "select" },
};

const selectableToolByCode = new Map(
  Object.entries(desktopToolShortcuts)
    .filter((entry): entry is [string, DesktopToolShortcut] => entry[1]?.mode === "select")
    .map(([tool, shortcut]) => [shortcut.code, tool as CanvasTool]),
);

// Excalidraw keeps its own tool shortcuts active even when its toolbar is
// hidden. Capture these before the engine sees them so Tafelraum has exactly
// one visible and behavioral shortcut contract.
const suppressedEngineToolShortcutCodes = new Set([
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
  "KeyA",
  "KeyC",
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
  "KeyR",
  "KeyS",
  "KeyT",
  "KeyV",
]);

export function selectableToolForShortcut(code: string): CanvasTool | null {
  return selectableToolByCode.get(code) ?? null;
}

export function isSuppressedEngineToolShortcut(code: string): boolean {
  return suppressedEngineToolShortcutCodes.has(code);
}

export function desktopToolShortcutDecision({
  code,
  repeat,
  shiftKey,
}: {
  code: string;
  repeat: boolean;
  shiftKey: boolean;
}): { suppress: boolean; tool: CanvasTool | null } {
  const mappedTool = shiftKey ? null : selectableToolForShortcut(code);
  return {
    suppress: mappedTool !== null || isSuppressedEngineToolShortcut(code),
    tool: repeat ? null : mappedTool,
  };
}

export function desktopClipShortcutDecision({
  code,
  repeat,
  shiftKey,
}: {
  code: string;
  repeat: boolean;
  shiftKey: boolean;
}): { suppress: boolean; select: boolean } {
  const matches = code === "KeyC" && !shiftKey;
  return { suppress: matches, select: matches && !repeat };
}

export function desktopFullscreenShortcutDecision({
  code,
  repeat,
  shiftKey,
}: {
  code: string;
  repeat: boolean;
  shiftKey: boolean;
}): { suppress: boolean; toggle: boolean } {
  const matches = code === "KeyV" && !shiftKey;
  return {
    suppress: matches,
    toggle: matches && !repeat,
  };
}

/** German circumflex is a dead key; WebKit may swap the two ISO key codes. */
export function desktopToolbarShortcutDecision({
  code,
  key,
  repeat,
}: {
  code: string;
  key: string;
  repeat: boolean;
}): { suppress: boolean; toggle: boolean } {
  const matches = key === "^" || (key === "Dead" && (code === "Backquote" || code === "IntlBackslash"));
  return { suppress: matches, toggle: matches && !repeat };
}

export function desktopSelectionRotationShortcutDecision({
  code,
  shiftKey,
}: {
  code: string;
  shiftKey: boolean;
}): { direction: "left" | "right" | null; suppress: boolean } {
  const direction = shiftKey
    ? null
    : code === "KeyQ"
      ? "left"
      : code === "KeyE"
        ? "right"
        : null;
  return {
    direction,
    suppress: direction !== null,
  };
}

export function shouldPrepareTemporaryPan({
  code,
  embedOwnsFocus,
  interactiveControlOwnsFocus,
  key,
}: {
  code: string;
  embedOwnsFocus: boolean;
  interactiveControlOwnsFocus: boolean;
  key: string;
}): boolean {
  return (code === "Space" || key === " ")
    && !embedOwnsFocus
    && !interactiveControlOwnsFocus;
}

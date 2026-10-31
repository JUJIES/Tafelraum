/** Ephemeral field-local text geometry. Never part of material state or the remote wire. */
export type InteractiveHtmlTextPresence = {
  text: string;
  caret: boolean;
  selection?: { start: number; end: number };
  rects: { x: number; y: number; width: number; height: number }[];
  scroll: { x: number; y: number };
};

export function readInteractiveHtmlTextPresence(value: unknown): InteractiveHtmlTextPresence | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<InteractiveHtmlTextPresence>;
  if (typeof candidate.text !== 'string' || candidate.text.length > 65_536
    || typeof candidate.caret !== 'boolean' || !Array.isArray(candidate.rects) || candidate.rects.length > 128
    || !candidate.scroll || !Number.isFinite(candidate.scroll.x) || !Number.isFinite(candidate.scroll.y)
    || Math.abs(candidate.scroll.x) > 1_000_000 || candidate.scroll.y < 0 || candidate.scroll.y > 1_000_000) return null;
  const selection = candidate.selection;
  if (selection !== undefined && (!selection || !Number.isSafeInteger(selection.start) || !Number.isSafeInteger(selection.end)
    || selection.start < 0 || selection.end < selection.start || selection.end > candidate.text.length
    || candidate.caret !== (selection.start === selection.end))) return null;
  const rects: InteractiveHtmlTextPresence['rects'] = [];
  for (const rect of candidate.rects) {
    if (!rect || typeof rect !== 'object' || ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)
      || rect.x < 0 || rect.y < 0 || rect.width <= 0 || rect.height <= 0
      || rect.x + rect.width > 1.000001 || rect.y + rect.height > 1.000001) return null;
    rects.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
  }
  return { text: candidate.text, caret: candidate.caret, rects,
    ...(selection ? {selection: {start: selection.start, end: selection.end}} : {}),
    scroll: { x: candidate.scroll.x, y: candidate.scroll.y } };
}

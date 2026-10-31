import type { RichTextLayout, RichTextLayoutLine } from "./rich-text";

export type TextSelectionRect = { x: number; y: number; width: number; height: number };

export function richTextLineAtY(layout: RichTextLayout, y: number): RichTextLayoutLine {
  return layout.lines.find(line => y < line.y + line.height) ?? layout.lines.at(-1)!;
}

export function richTextOffsetAtPoint(layout: RichTextLayout, x: number, y: number): number {
  const line = richTextLineAtY(layout, y);
  let left = line.x;
  for (const char of line.chars) {
    if (x < left + char.width / 2) return char.start;
    left += char.width;
  }
  return line.end;
}

export function richTextSelectionRects(layout: RichTextLayout, start: number, end: number): TextSelectionRect[] {
  const from = Math.min(start, end), to = Math.max(start, end);
  if (from === to) return [];
  return layout.lines.flatMap(line => {
    let x = line.x;
    let firstX: number | null = null;
    let lastX = x;
    for (const char of line.chars) {
      if (char.end > from && char.start < to) {
        firstX ??= x;
        lastX = x + char.width;
      }
      x += char.width;
    }
    return firstX === null ? [] : [{ x: firstX, y: line.y, width: Math.max(1, lastX - firstX), height: line.height }];
  });
}

export function richTextCaretRect(layout: RichTextLayout, offset: number): TextSelectionRect {
  const line = [...layout.lines].reverse().find(candidate => offset >= candidate.start && offset <= candidate.end)
    ?? layout.lines[0];
  let x = line.x;
  for (const char of line.chars) {
    if (offset <= char.start) break;
    x += char.width;
  }
  return { x, y: line.y, width: 1.5, height: line.height };
}

export function richTextWordRange(text: string, offset: number): { start: number; end: number } {
  const isWord = (char: string | undefined) => Boolean(char && /[\p{L}\p{N}_]/u.test(char));
  let start = Math.max(0, Math.min(offset, text.length));
  if (!isWord(text[start]) && isWord(text[start - 1])) start -= 1;
  let end = start;
  if (isWord(text[start])) {
    while (start > 0 && isWord(text[start - 1])) start -= 1;
    while (end < text.length && isWord(text[end])) end += 1;
  } else end = Math.min(text.length, start + 1);
  return { start, end };
}

/** A written paragraph (including its bullet marker) stays one selection even
 * when the renderer wraps it across several visual lines. */
export function richTextParagraphRange(text: string, offset: number): { start: number; end: number } {
  const position = Math.max(0, Math.min(offset, text.length));
  const start = position === 0 ? 0 : text.lastIndexOf("\n", position - 1) + 1;
  const nextBreak = text.indexOf("\n", position);
  return { start, end: nextBreak === -1 ? text.length : nextBreak };
}

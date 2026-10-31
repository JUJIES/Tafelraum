import type { ExcalidrawTextElement } from "@excalidraw/excalidraw/element/types";
import type { DataURL } from "@excalidraw/excalidraw/types";

export type RichTextStyle = {
  color: string;
  fontFamily: number;
  fontSize: number;
  italic?: boolean;
  underline: boolean;
  strike: boolean;
};
export type RichTextRun = { start: number; end: number; style: RichTextStyle };
export type RichTextParagraph = { start: number; align: "left" | "center" | "right" };
export type RichText = {
  version: 1;
  text: string;
  runs: RichTextRun[];
  paragraphs: RichTextParagraph[];
};

const fontNames: Record<number, string> = {
  5: "Excalifont",
  6: "Nunito",
  8: "Comic Shanns",
};

export const adaptiveTextColors = new Set(["#000000", "#111111", "#1e1e1e", "#ffffff", "#1b1b1f", "#1b222b", "#26323f", "#f4f3ef"]);

/** Neutral text follows the surface; deliberate accent colors retain their styling. */
export function themeRichText(document: RichText, color: string): RichText {
  let changed = false;
  const runs = document.runs.map(run => {
    if (!adaptiveTextColors.has(run.style.color.toLowerCase()) || run.style.color === color) return run;
    changed = true;
    return { ...run, style: { ...run.style, color } };
  });
  return changed ? { ...document, runs } : document;
}

function bulletedParagraphPrefix(paragraph: string): string {
  return paragraph.match(/^[^\S\n]*•[ \t]/u)?.[0] ?? "";
}

export function hasBulletedParagraph(text: string): boolean {
  return text.split("\n").some(paragraph => bulletedParagraphPrefix(paragraph).length > 0);
}

export function richTextFromNative(element: ExcalidrawTextElement): RichText {
  const style: RichTextStyle = {
    color: element.strokeColor,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    italic: false,
    underline: false,
    strike: false,
  };
  const align: RichTextParagraph["align"] = element.textAlign === "center" || element.textAlign === "right" ? element.textAlign : "left";
  const paragraphs: RichTextParagraph[] = [{ start: 0, align }];
  const text = element.originalText ?? element.text;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "\n") paragraphs.push({ start: i + 1, align });
  }
  return { version: 1, text, runs: text.length ? [{ start: 0, end: text.length, style }] : [], paragraphs };
}

export function readRichText(value: unknown): RichText | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RichText>;
  if (candidate.version !== 1 || typeof candidate.text !== "string" || !Array.isArray(candidate.runs) || !Array.isArray(candidate.paragraphs)) return null;
  if (!candidate.paragraphs.length || candidate.paragraphs[0]?.start !== 0) return null;
  const validStyle = (style: RichTextStyle) => style && /^#[0-9a-f]{6}$/i.test(style.color)
    && Number.isFinite(style.fontSize) && style.fontSize >= 8 && style.fontSize <= 256
    && Number.isInteger(style.fontFamily) && style.fontFamily > 0 && style.fontFamily <= 100
    && (style.italic === undefined || typeof style.italic === "boolean")
    && typeof style.underline === "boolean" && typeof style.strike === "boolean";
  if (candidate.runs.some(run => !Number.isInteger(run.start) || !Number.isInteger(run.end)
    || run.start < 0 || run.end > candidate.text!.length || run.end <= run.start || !validStyle(run.style))) return null;
  if (candidate.text.length > 0 && (candidate.runs[0]?.start !== 0 || candidate.runs.at(-1)?.end !== candidate.text.length)) return null;
  if (candidate.runs.some((run, index) => index > 0 && candidate.runs![index - 1].end !== run.start)) return null;
  if (candidate.paragraphs.some(paragraph => !Number.isInteger(paragraph.start) || paragraph.start < 0
    || paragraph.start > candidate.text!.length || !["left", "center", "right"].includes(paragraph.align))) return null;
  const starts = [0];
  for (let i = 0; i < candidate.text.length; i += 1) if (candidate.text[i] === "\n") starts.push(i + 1);
  if (candidate.paragraphs.length !== starts.length || candidate.paragraphs.some((paragraph, index) => paragraph.start !== starts[index])) return null;
  return candidate as RichText;
}

/** Resize every span by the same factor, preserving mixed sizes and styles.
 * The existing rich-text size bounds constrain the whole document together. */
export function scaleRichText(document: RichText, factor: number): RichText {
  if (!document.runs.length || !Number.isFinite(factor) || factor <= 0) return document;
  const sizes = document.runs.map(run => run.style.fontSize);
  const scale = Math.max(8 / Math.min(...sizes), Math.min(256 / Math.max(...sizes), factor));
  if (Math.abs(scale - 1) < 1e-10) return document;
  return { ...document, runs: document.runs.map(run => ({ ...run, style: { ...run.style, fontSize: run.style.fontSize * scale } })) };
}

function styleAt(document: RichText, offset: number): RichTextStyle {
  return document.runs.find(run => run.start <= offset && offset < run.end)?.style
    ?? document.runs.find(run => run.end === offset)?.style
    ?? document.runs[0]?.style
    ?? { color: "#111111", fontFamily: 5, fontSize: 28, italic: false, underline: false, strike: false };
}

function normalizeRuns(runs: RichTextRun[]): RichTextRun[] {
  const result: RichTextRun[] = [];
  for (const run of runs.filter(run => run.end > run.start).sort((a, b) => a.start - b.start)) {
    const previous = result.at(-1);
    if (previous && previous.end === run.start && JSON.stringify(previous.style) === JSON.stringify(run.style)) previous.end = run.end;
    else result.push({ ...run, style: { ...run.style } });
  }
  return result;
}

export function styleRichText(document: RichText, start: number, end: number, patch: Partial<RichTextStyle>): RichText {
  const from = Math.max(0, Math.min(document.text.length, start));
  const to = Math.max(from, Math.min(document.text.length, end));
  if (from === to) return document;
  const runs = document.runs.flatMap(run => {
    if (run.end <= from || run.start >= to) return [run];
    return [
      ...(run.start < from ? [{ ...run, end: from }] : []),
      { start: Math.max(run.start, from), end: Math.min(run.end, to), style: { ...run.style, ...patch } },
      ...(run.end > to ? [{ ...run, start: to }] : []),
    ];
  });
  return { ...document, runs: normalizeRuns(runs) };
}

function alignmentParagraphs(document: RichText, start: number, end: number) {
  const from = Math.max(0, Math.min(document.text.length, start));
  const to = Math.max(from, Math.min(document.text.length, end));
  return document.paragraphs.map((paragraph, index) => {
    const nextStart = document.paragraphs[index + 1]?.start ?? document.text.length + 1;
    return from === to || (from < nextStart && to > paragraph.start);
  });
}

/** A caret alone means the whole textbox; a range means touched paragraphs. */
export function richTextAlignment(document: RichText, start = 0, end = 0): RichTextParagraph["align"] | null {
  const touched = alignmentParagraphs(document, start, end);
  const values = document.paragraphs.filter((_, index) => touched[index]).map(paragraph => paragraph.align);
  return values.every(value => value === values[0]) ? values[0] ?? "left" : null;
}

export function alignRichText(document: RichText, start: number, end: number, align: RichTextParagraph["align"]): RichText {
  const touched = alignmentParagraphs(document, start, end);
  return { ...document, paragraphs: document.paragraphs.map((paragraph, index) => {
    return touched[index] ? { ...paragraph, align } : paragraph;
  }) };
}

/** Keep spans anchored to the edited plain text; inserted characters inherit the adjacent mark. */
export function rebaseRichText(document: RichText, nextText: string): RichText {
  if (document.text === nextText) return document;
  // Excalidraw inserts visual wrap newlines into `text` while `originalText`
  // keeps only authored breaks. Preserve every run when canonicalizing that
  // older representation instead of treating the whole middle as one edit.
  if (document.text.replaceAll("\n", "") === nextText.replaceAll("\n", "")) {
    const oldOffsets: number[] = [];
    let oldOffset = 0;
    for (let nextOffset = 0; nextOffset < nextText.length; nextOffset += 1) {
      while (document.text[oldOffset] === "\n" && nextText[nextOffset] !== "\n") oldOffset += 1;
      if (document.text[oldOffset] !== nextText[nextOffset]) break;
      oldOffsets.push(oldOffset);
      oldOffset += 1;
    }
    if (oldOffsets.length === nextText.length) {
      const runs = normalizeRuns(oldOffsets.map((source, start) => ({ start, end: start + 1, style: styleAt(document, source) })));
      const paragraphs: RichTextParagraph[] = [];
      for (let start = 0; start <= nextText.length; start += 1) {
        if (start !== 0 && nextText[start - 1] !== "\n") continue;
        const source = oldOffsets[start] ?? document.text.length;
        const align = [...document.paragraphs].reverse().find(paragraph => paragraph.start <= source)?.align ?? "left";
        paragraphs.push({ start, align });
      }
      return { version: 1, text: nextText, runs, paragraphs };
    }
  }
  let start = 0;
  while (start < document.text.length && start < nextText.length && document.text[start] === nextText[start]) start += 1;
  let oldEnd = document.text.length, newEnd = nextText.length;
  while (oldEnd > start && newEnd > start && document.text[oldEnd - 1] === nextText[newEnd - 1]) { oldEnd -= 1; newEnd -= 1; }
  const delta = newEnd - oldEnd;
  // A replacement inherits the replaced character; continued typing at a run
  // boundary inherits the character immediately before the caret.
  const insertedStyle = styleAt(document, oldEnd > start ? start : Math.max(0, start - 1));
  const runs = normalizeRuns([
    ...document.runs.flatMap(run => run.start < start ? [{ start: run.start, end: Math.min(run.end, start), style: run.style }] : []),
    ...(newEnd > start ? [{ start, end: newEnd, style: insertedStyle }] : []),
    ...document.runs.flatMap(run => run.end > oldEnd ? [{ start: Math.max(run.start, oldEnd) + delta, end: run.end + delta, style: run.style }] : []),
  ]);
  const priorAlign = [...document.paragraphs].reverse().find(paragraph => paragraph.start <= start)?.align ?? "left";
  const paragraphs: RichTextParagraph[] = [{ start: 0, align: document.paragraphs[0]?.align ?? "left" }];
  for (let i = 0; i < nextText.length; i += 1) {
    if (nextText[i] !== "\n") continue;
    const position = i + 1;
    const oldPosition = position <= start ? position : position >= newEnd ? position - delta : -1;
    const align = document.paragraphs.find(paragraph => paragraph.start === oldPosition)?.align ?? priorAlign;
    paragraphs.push({ start: position, align });
  }
  return { version: 1, text: nextText, runs, paragraphs };
}

export type RichTextRaster = { dataURL: DataURL; width: number; height: number };

export type RichTextLayoutChar = { value: string; style: RichTextStyle; width: number; start: number; end: number };
export type RichTextLayoutLine = { chars: RichTextLayoutChar[]; width: number; height: number; align: RichTextParagraph["align"]; start: number; end: number; y: number; x: number };
export type RichTextLayout = { lines: RichTextLayoutLine[]; width: number; height: number };

export function paintRichText(context: CanvasRenderingContext2D, layout: RichTextLayout, lineHeight: number): void {
  context.textBaseline = "top";
  for (const line of layout.lines) {
    let x = line.x;
    for (const char of line.chars) {
      const { style } = char;
      context.font = `${style.italic ? "italic " : ""}${style.fontSize}px ${JSON.stringify(fontNames[style.fontFamily] ?? "Nunito")}`;
      context.fillStyle = style.color;
      context.fillText(char.value, x, line.y + (line.height - style.fontSize * lineHeight) / 2);
      if (style.underline || style.strike) {
        const thickness = Math.max(1, style.fontSize / 16);
        if (style.underline) context.fillRect(x, line.y + style.fontSize * 1.03, char.width, thickness);
        if (style.strike) context.fillRect(x, line.y + style.fontSize * 0.55, char.width, thickness);
      }
      x += char.width;
    }
  }
}

/** One layout is shared by the canvas rendition and the editing hit targets. */
export function layoutRichText(richText: RichText, width: number, wrap: boolean, lineHeight: number): RichTextLayout {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Textdarstellung ist nicht verfügbar.");
  const nominalWidth = Math.max(1, Math.min(4096, width));
  const lines: RichTextLayoutLine[] = [];
  const bulletBlocks: { lines: RichTextLayoutLine[]; indent: number }[] = [];
  let offset = 0;
  let y = 0;
  const pushLine = (line: RichTextLayoutLine) => {
    line.y = y;
    y += line.height;
    lines.push(line);
  };
  for (const [paragraphIndex, rawParagraph] of richText.text.split("\n").entries()) {
    const align = richText.paragraphs[paragraphIndex]?.align ?? "left";
    const paragraphStart = offset;
    const firstLineIndex = lines.length;
    let line: RichTextLayoutLine = { chars: [], width: 0, height: 0, align, start: offset, end: offset, y: 0, x: 0 };
    const paragraphChars: RichTextLayoutChar[] = [];
    for (const value of rawParagraph) {
      const style = styleAt(richText, offset);
      measure.font = `${style.italic ? "italic " : ""}${style.fontSize}px ${JSON.stringify(fontNames[style.fontFamily] ?? "Nunito")}`;
      paragraphChars.push({ value, style, width: measure.measureText(value).width, start: offset, end: offset + value.length });
      offset += value.length;
    }
    const bulletPrefix = bulletedParagraphPrefix(rawParagraph);
    const hangingIndent = paragraphChars.slice(0, bulletPrefix.length).reduce((sum, char) => sum + char.width, 0);
    let currentIndent = 0;
    for (let index = 0; index < paragraphChars.length;) {
      const whitespace = /^\s$/u.test(paragraphChars[index].value);
      let end = index + 1;
      while (end < paragraphChars.length && /^\s$/u.test(paragraphChars[end].value) === whitespace) end += 1;
      const token = paragraphChars.slice(index, end);
      const tokenWidth = token.reduce((sum, char) => sum + char.width, 0);
      if (wrap && line.chars.length && currentIndent + line.width + tokenWidth > nominalWidth) {
        pushLine(line);
        currentIndent = hangingIndent;
        line = { chars: [], width: 0, height: 0, align, start: token[0].start, end: token[0].start, y: 0, x: 0 };
      }
      for (const char of token) {
        if (wrap && line.chars.length && currentIndent + line.width + char.width > nominalWidth) {
          pushLine(line);
          currentIndent = hangingIndent;
          line = { chars: [], width: 0, height: 0, align, start: char.start, end: char.start, y: 0, x: 0 };
        }
        if (wrap && whitespace && line.chars.length === 0) { line.start = char.end; line.end = char.end; continue; }
        line.chars.push(char);
        line.width += char.width;
        line.end = char.end;
        line.height = Math.max(line.height, char.style.fontSize * lineHeight);
      }
      index = end;
    }
    line.height = Math.max(line.height, styleAt(richText, Math.max(paragraphStart, offset - 1)).fontSize * lineHeight);
    pushLine(line);
    if (bulletPrefix && lines.length > firstLineIndex + 1) {
      const blockLines = lines.slice(firstLineIndex);
      bulletBlocks.push({ lines: blockLines, indent: hangingIndent });
    }
    offset += 1;
  }
  const contentWidth = wrap ? nominalWidth : Math.max(1, ...lines.map(line => line.width));
  for (const line of lines) line.x = line.align === "right" ? contentWidth - line.width : line.align === "center" ? (contentWidth - line.width) / 2 : 0;
  for (const { lines: blockLines, indent } of bulletBlocks) {
    const blockWidth = Math.max(...blockLines.map((line, index) => line.width + (index ? indent : 0)));
    const align = blockLines[0].align;
    const blockX = align === "right" ? contentWidth - blockWidth : align === "center" ? (contentWidth - blockWidth) / 2 : 0;
    blockLines.forEach((line, index) => { line.x = blockX + (index ? indent : 0); });
  }
  return { lines, width: contentWidth, height: Math.max(1, y) };
}

export function rasterizeRichText(richText: RichText, width: number, wrap: boolean, lineHeight: number): RichTextRaster {
  const layout = layoutRichText(richText, width, wrap, lineHeight);
  const { width: contentWidth, height: contentHeight } = layout;
  if (contentWidth > 4096 || contentHeight > 4096) throw new Error("Dieser Text ist für gemischte Formatierung zu groß.");
  const scale = Math.min(2, 4096 / Math.max(contentWidth, contentHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(contentWidth * scale);
  canvas.height = Math.ceil(contentHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Textdarstellung ist nicht verfügbar.");
  context.scale(scale, scale);
  paintRichText(context, layout, lineHeight);
  return { dataURL: canvas.toDataURL("image/png") as DataURL, width: contentWidth, height: contentHeight };
}

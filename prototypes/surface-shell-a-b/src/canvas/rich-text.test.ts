import assert from "node:assert/strict";
import test from "node:test";
import type { ExcalidrawTextElement } from "@excalidraw/excalidraw/element/types";
import { adaptiveTextColors, themeRichText, alignRichText, richTextAlignment, hasBulletedParagraph, layoutRichText, readRichText, rebaseRichText, richTextFromNative, scaleRichText, styleRichText } from "./rich-text.ts";
import { richTextOffsetAtPoint } from "./rich-text-selection.ts";

const source = { text: "Alpha\nBeta", strokeColor: "#111111", fontFamily: 6, fontSize: 28, textAlign: "left" } as ExcalidrawTextElement;

test("neutral formatted text follows light and dark while accent colors stay", () => {
  const document = richTextFromNative({ ...source, strokeColor: "#000000" });
  const accented = styleRichText(document, 6, 10, { color: "#a84f4b", underline: true });
  const dark = themeRichText(accented, "#f4f3ef");
  assert.equal(dark.runs[0].style.color, "#f4f3ef");
  assert.equal(dark.runs[1].style.color, "#a84f4b");
  assert.equal(dark.runs[1].style.underline, true);
  assert.equal(themeRichText(dark, "#1b222b").runs[0].style.color, "#1b222b");
  assert.equal(themeRichText(dark, "#f4f3ef"), dark);
  assert.deepEqual(dark.paragraphs, accented.paragraphs);
  assert.equal(dark.text, accented.text);
  for (const color of adaptiveTextColors) {
    const legacy = richTextFromNative({ ...source, strokeColor: color.toUpperCase() });
    assert.equal(themeRichText(legacy, "#f4f3ef").runs[0].style.color, "#f4f3ef");
  }
  assert.deepEqual(readRichText(JSON.parse(JSON.stringify(dark))), dark);
});

test("alignment uses marked paragraphs, excludes the next boundary and reports mixed state", () => {
  const original = richTextFromNative(source);
  const heading = alignRichText(original, 0, 6, "center");
  assert.deepEqual(heading.paragraphs, [{ start: 0, align: "center" }, { start: 6, align: "left" }]);
  assert.equal(richTextAlignment(heading), null);
  assert.equal(richTextAlignment(heading, 1, 3), "center");
  assert.equal(richTextAlignment(heading, 7, 9), "left");
  assert.equal(richTextAlignment(heading, 3, 8), null);
  assert.deepEqual(alignRichText(heading, 7, 9, "right").paragraphs,
    [{ start: 0, align: "center" }, { start: 6, align: "right" }]);
  assert.deepEqual(alignRichText(heading, 7, 7, "right").paragraphs,
    [{ start: 0, align: "right" }, { start: 6, align: "right" }]);
  assert.equal(heading.text, original.text);
  assert.deepEqual(heading.runs, original.runs);
  assert.deepEqual(readRichText(JSON.parse(JSON.stringify(heading))), heading);
  const trailing = richTextFromNative({ ...source, text: "Alpha\nBeta\n" });
  assert.deepEqual(alignRichText(trailing, 0, 0, "center").paragraphs.map(paragraph => paragraph.align),
    ["center", "center", "center"]);
});

test("a selected word changes without changing the other word", () => {
  const original = richTextFromNative(source);
  const colored = styleRichText(original, 6, 10, { color: "#a84f4b", underline: true });
  assert.deepEqual(colored.runs.map(run => [run.start, run.end, run.style.color, run.style.underline]), [
    [0, 6, "#111111", false], [6, 10, "#a84f4b", true],
  ]);
  assert.deepEqual(styleRichText(colored, 0, 10, { color: "#3f7461" }).runs.map(run => run.style.color), ["#3f7461", "#3f7461"]);
});

test("italic stays scoped to its span, survives edits, and accepts older documents", () => {
  const original = richTextFromNative(source);
  const legacy = { ...original, runs: original.runs.map(run => ({ ...run, style: {
    color: run.style.color, fontFamily: run.style.fontFamily, fontSize: run.style.fontSize,
    underline: run.style.underline, strike: run.style.strike,
  } })) };
  assert.deepEqual(readRichText(legacy), legacy);
  assert.equal(readRichText({ ...legacy, runs: [{ ...legacy.runs[0], style: { ...legacy.runs[0].style, italic: "yes" } }] }), null);
  const marked = styleRichText(legacy, 6, 10, { italic: true });
  assert.deepEqual(marked.runs.map(run => [run.start, run.end, run.style.italic]), [[0, 6, undefined], [6, 10, true]]);
  const inserted = rebaseRichText(marked, "Alpha\nBeta!");
  assert.equal(inserted.runs.at(-1)?.style.italic, true);
  assert.deepEqual(readRichText(JSON.parse(JSON.stringify(inserted))), inserted);
  assert.deepEqual(styleRichText(inserted, 0, inserted.text.length, { italic: false }).runs.map(run => run.style.italic), [false]);
});

test("alignment applies to selected paragraphs, and insertion keeps adjacent styling", () => {
  const original = richTextFromNative(source);
  const aligned = alignRichText(original, 6, 10, "right");
  assert.deepEqual(aligned.paragraphs, [{ start: 0, align: "left" }, { start: 6, align: "right" }]);
  const colored = styleRichText(aligned, 6, 10, { color: "#a84f4b" });
  const inserted = rebaseRichText(colored, "Alpha\nBeta!");
  assert.equal(inserted.text, "Alpha\nBeta!");
  assert.deepEqual(inserted.paragraphs, aligned.paragraphs);
  assert.equal(inserted.runs.at(-1)?.style.color, "#a84f4b");
  assert.deepEqual(readRichText(JSON.parse(JSON.stringify(inserted))), inserted);
});

test("malformed spans and paragraph positions are rejected", () => {
  const original = richTextFromNative(source);
  assert.equal(readRichText({ ...original, runs: [{ ...original.runs[0], end: 2 }] }), null);
  assert.equal(readRichText({ ...original, paragraphs: [{ start: 0, align: "left" }] }), null);
});

test("typing character by character keeps the selected word's style", () => {
  const styled = styleRichText(richTextFromNative(source), 6, 10, { fontSize: 48, underline: true });
  const first = rebaseRichText(styled, "Alpha\nZ");
  const second = rebaseRichText(first, "Alpha\nZe");
  const third = rebaseRichText(second, "Alpha\nZer");
  assert.equal(third.runs.at(-1)?.style.fontSize, 48);
  assert.equal(third.runs.at(-1)?.style.underline, true);
});

test("removing engine-added wrap breaks preserves styles and authored paragraph alignment", () => {
  const wrapped = { ...source, text: "Alpha\nBeta\nGamma", originalText: "AlphaBeta\nGamma" } as ExcalidrawTextElement;
  const marked = styleRichText(richTextFromNative({ ...wrapped, originalText: undefined } as ExcalidrawTextElement), 6, 10, { underline: true });
  const aligned = alignRichText(marked, 11, 16, "right");
  const canonical = rebaseRichText(aligned, wrapped.originalText);
  assert.equal(canonical.text, "AlphaBeta\nGamma");
  assert.deepEqual(canonical.runs.map(run => [run.start, run.end, run.style.underline]), [
    [0, 5, false], [5, 9, true], [9, 15, false],
  ]);
  assert.deepEqual(canonical.paragraphs, [{ start: 0, align: "left" }, { start: 10, align: "right" }]);
});

test("wrapped bullet paragraphs align continuation lines beneath the text", () => {
  const previousDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElement: () => ({ getContext: () => ({ measureText: () => ({ width: 10 }) }) }) },
  });
  try {
    const text = "• Alpha Beta Gamma\nPlain words here";
    assert.equal(hasBulletedParagraph(text), true);
    assert.equal(hasBulletedParagraph("Plain words here"), false);
    const layout = layoutRichText(richTextFromNative({ ...source, text, originalText: text } as ExcalidrawTextElement), 100, true, 1.2);
    const bulletLines = layout.lines.filter(line => line.start < text.indexOf("\n"));
    assert.ok(bulletLines.length > 1);
    assert.equal(bulletLines[0].x, 0);
    assert.ok(bulletLines.slice(1).every(line => line.x === 20));
    assert.equal(richTextOffsetAtPoint(layout, 21, bulletLines[1].y + 1), bulletLines[1].start);
    assert.equal(layout.lines.find(line => line.start > text.indexOf("\n"))?.x, 0);
    const centered = layoutRichText(alignRichText(richTextFromNative({ ...source, text, originalText: text } as ExcalidrawTextElement), 0, text.indexOf("\n"), "center"), 100, true, 1.2);
    assert.equal(centered.lines[1].x - centered.lines[0].x, 20);
  } finally {
    if (previousDocument === undefined) delete (globalThis as { document?: Document }).document;
    else Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
  }
});


test("corner scaling preserves mixed span proportions, marks and authored text", () => {
  const original = styleRichText(richTextFromNative(source), 6, 10, {fontSize:42,italic:true});
  const scaled = scaleRichText(original, 1.1);
  assert.equal(scaled.text, original.text);
  assert.deepEqual(scaled.paragraphs, original.paragraphs);
  assert.deepEqual(scaled.runs.map(run=>run.style.fontSize), [28*1.1,42*1.1]);
  assert.equal(scaled.runs[1].style.italic, true);
  scaleRichText(scaled,1/1.1).runs.forEach((run,index)=>assert.ok(Math.abs(run.style.fontSize-[28,42][index])<1e-10));
  const large = scaleRichText(original, 100);
  assert.equal(large.runs[1].style.fontSize,256);
  assert.ok(Math.abs(large.runs[0].style.fontSize/large.runs[1].style.fontSize-28/42)<1e-10);
  assert.ok(readRichText(large));
});

import assert from "node:assert/strict";
import test from "node:test";
import type { RichTextLayout } from "./rich-text.ts";
import { richTextCaretRect, richTextOffsetAtPoint, richTextParagraphRange, richTextSelectionRects, richTextWordRange } from "./rich-text-selection.ts";

const style = { color: "#ffffff", fontFamily: 6, fontSize: 28, underline: false, strike: false };
const layout: RichTextLayout = {
  width: 120, height: 60,
  lines: [
    { start: 0, end: 4, x: 40, y: 0, width: 40, height: 30, align: "center",
      chars: [..."Wort"].map((value, index) => ({ value, style, width: 10, start: index, end: index + 1 })) },
    { start: 5, end: 9, x: 0, y: 30, width: 40, height: 30, align: "left",
      chars: [..."Text"].map((value, index) => ({ value, style, width: 10, start: index + 5, end: index + 6 })) },
  ],
};

test("pointer hit testing follows the displayed alignment on each line", () => {
  assert.equal(richTextOffsetAtPoint(layout, 56, 12), 2);
  assert.equal(richTextOffsetAtPoint(layout, 16, 42), 7);
  assert.equal(richTextOffsetAtPoint(layout, 90, 42), 9);
});

test("a multi-line selection highlights only displayed glyphs", () => {
  assert.deepEqual(richTextSelectionRects(layout, 2, 7), [
    { x: 60, y: 0, width: 20, height: 30 },
    { x: 0, y: 30, width: 20, height: 30 },
  ]);
  assert.deepEqual(richTextCaretRect(layout, 6), { x: 10, y: 30, width: 1.5, height: 30 });
});

test("Alt-double click can still select a word around the visible hit", () => {
  assert.deepEqual(richTextWordRange("• Motoren\n• Antrieb", 5), { start: 2, end: 9 });
  assert.deepEqual(richTextWordRange("• Motoren\n• Antrieb", 15), { start: 12, end: 19 });
});

test("double click selects the authored paragraph including its bullet and wrapped content", () => {
  const text = "Titel\n• Ein längerer Aufzählungspunkt mit Umbruch\n• Zweiter Punkt";
  assert.deepEqual(richTextParagraphRange(text, text.indexOf("längerer") + 3), {
    start: 6, end: text.indexOf("\n", 6),
  });
  assert.equal(text.slice(...Object.values(richTextParagraphRange(text, text.indexOf("Umbruch")))).startsWith("• "), true);
  assert.deepEqual(richTextParagraphRange(text, text.indexOf("Zweiter")), {
    start: text.lastIndexOf("\n") + 1, end: text.length,
  });
  assert.deepEqual(richTextParagraphRange(text, text.indexOf("\n")), { start: 0, end: 5 });
  assert.deepEqual(richTextParagraphRange("\nText", 0), { start: 0, end: 0 });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readInteractiveHtmlTextPresence } from './interactive-html-focus.ts';

const presence = { text: 'Anfang', caret: true,
  rects: [{ x: 0.2, y: 0.1, width: 0.01, height: 0.7 }], scroll: { x: 0, y: 0 } };

test('Text presence retains bounded field geometry, multiline selection and RTL scroll', () => {
  assert.deepEqual(readInteractiveHtmlTextPresence(presence), presence);
  const selection = { ...presence, caret: false, scroll: { x: -20, y: 100 },
    rects: [...presence.rects, { x: 0, y: 0.8, width: 1, height: 0.2 }] };
  assert.deepEqual(readInteractiveHtmlTextPresence(selection), selection);
  assert.deepEqual(readInteractiveHtmlTextPresence({ ...presence, rects: [] }), { ...presence, rects: [] });
});

test('Malformed and oversized presence cannot create unbounded Room overlays', () => {
  for (const invalid of [null, {}, { ...presence, text: 'x'.repeat(65_537) },
    { ...presence, caret: 'true' }, { ...presence, rects: Array(129).fill(presence.rects[0]) },
    { ...presence, rects: [{ ...presence.rects[0], x: -1 }] },
    { ...presence, rects: [{ ...presence.rects[0], width: 2 }] },
    { ...presence, rects: [{ ...presence.rects[0], y: NaN }] },
    { ...presence, rects: [{ ...presence.rects[0], height: 0 }] },
    { ...presence, scroll: { x: 0, y: -1 } }, { ...presence, scroll: { x: Infinity, y: 0 } }]) {
    assert.equal(readInteractiveHtmlTextPresence(invalid), null);
  }
});

test('Room text offsets preserve the native text position independently of field geometry', () => {
  const end = {...presence, selection:{start:6,end:6}};
  assert.deepEqual(readInteractiveHtmlTextPresence(end), end);
  const middle = {...presence, selection:{start:2,end:2}};
  assert.deepEqual(readInteractiveHtmlTextPresence(middle), middle);
  const selected = {...presence, caret:false, selection:{start:1,end:4}};
  assert.deepEqual(readInteractiveHtmlTextPresence(selected), selected);
  for (const selection of [null, {start:-1,end:0}, {start:1,end:7}, {start:2,end:1}, {start:1.5,end:1.5}, {start:NaN,end:NaN}, {start:0,end:1}])
    assert.equal(readInteractiveHtmlTextPresence({...presence,selection}),null);
});

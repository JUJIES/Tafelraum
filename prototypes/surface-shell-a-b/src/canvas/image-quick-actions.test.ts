import assert from "node:assert/strict";
import test from "node:test";
import { getImageQuickActionLayout, getTextEntryMinimumWidth } from "./image-quick-actions.ts";

const base = {
  actionCount: 5,
  angle: 0,
  buttonSize: 32,
  centerX: 400,
  centerY: 300,
  gap: 7,
  viewportHeight: 600,
  viewportWidth: 800,
};

test("places landscape actions outside the top long edge", () => {
  const layout = getImageQuickActionLayout({ ...base, width: 420, height: 240 });
  assert.equal(layout.side, "top");
  assert.ok(layout.points.every((point) => point.y < 180));
  assert.deepEqual(layout.points.map((point) => point.x), [322, 361, 400, 439, 478]);
});

test("places portrait actions outside the right long edge", () => {
  const layout = getImageQuickActionLayout({ ...base, width: 240, height: 420 });
  assert.equal(layout.side, "right");
  assert.ok(layout.points.every((point) => point.x > 520));
  assert.deepEqual(layout.points.map((point) => point.y), [222, 261, 300, 339, 378]);
});

test("uses the opposite long edge when the preferred side would be clipped", () => {
  const layout = getImageQuickActionLayout({
    ...base,
    centerX: 690,
    width: 180,
    height: 400,
  });
  assert.equal(layout.side, "left");
  assert.ok(layout.points.every((point) => point.x < 600));
});

test("uses the free long edge instead of covering a neighboring sheet", () => {
  const layout = getImageQuickActionLayout({
    ...base,
    width: 240,
    height: 420,
    obstacles: [{ bottom: 520, left: 525, right: 760, top: 80 }],
  });
  assert.equal(layout.side, "left");
  assert.ok(layout.points.every((point) => point.x < 280));
});

test("uses a short edge when both long edges are occupied", () => {
  const layout = getImageQuickActionLayout({
    ...base,
    width: 240,
    height: 420,
    obstacles: [
      { bottom: 520, left: 525, right: 760, top: 80 },
      { bottom: 520, left: 40, right: 275, top: 80 },
    ],
  });
  assert.equal(layout.side, "top");
  assert.ok(layout.points.every((point) => point.y < 90));
});

test("keeps rotated action groups inside the visible canvas", () => {
  const layout = getImageQuickActionLayout({
    ...base,
    angle: Math.PI / 4,
    centerX: 70,
    centerY: 70,
    width: 320,
    height: 180,
  });
  assert.ok(layout.points.every((point) => point.x >= 22 && point.x <= 778));
  assert.ok(layout.points.every((point) => point.y >= 22 && point.y <= 578));
});

test("places the three video actions outside the player", () => {
  const layout = getImageQuickActionLayout({
    ...base,
    actionCount: 3,
    width: 420,
    height: 240,
  });
  assert.equal(layout.side, "top");
  assert.ok(layout.points.every((point) => point.y < 180));
  assert.deepEqual(layout.points.map((point) => point.x), [361, 400, 439]);
});

test("text actions stay in a row above or below even when the text box is narrow", () => {
  const text = { ...base, actionCount: 3, width: 36, height: 48, sidePreference: ["bottom", "top"] as const };
  const below = getImageQuickActionLayout(text);
  assert.equal(below.side, "bottom");
  assert.ok(below.points.every(point => point.y - text.buttonSize / 2 > text.centerY + text.height / 2));
  assert.equal(new Set(below.points.map(point => point.y)).size, 1);

  const above = getImageQuickActionLayout({ ...text, centerY: 552 });
  assert.equal(above.side, "top");
  assert.ok(above.points.every(point => point.y + text.buttonSize / 2 < 552 - text.height / 2));

  const aboveToolbar = getImageQuickActionLayout({ ...text, centerY: 430,
    obstacles: [{ left: 200, right: 600, top: 475, bottom: 600 }] });
  assert.equal(aboveToolbar.side, "top");
  assert.ok(aboveToolbar.points.every(point => point.y + text.buttonSize / 2 < 430 - text.height / 2));
});

test("a new text line fits three centered actions at desktop and touch zoom", () => {
  for (const { buttonSize, gap, zoom } of [
    { buttonSize: 32, gap: 7, zoom: 0.4 },
    { buttonSize: 32, gap: 7, zoom: 1.5 },
    { buttonSize: 48, gap: 8, zoom: 0.8 },
  ]) {
    const lineWidth = getTextEntryMinimumWidth(zoom, buttonSize, gap) * zoom;
    const groupWidth = 3 * buttonSize + 2 * gap;
    const layout = getImageQuickActionLayout({ ...base, actionCount: 3, buttonSize, gap,
      centerX: 400, centerY: 200, width: lineWidth, height: 40, sidePreference: ["bottom", "top"] });
    assert.ok(lineWidth - groupWidth >= 24 - 0.001);
    assert.equal(layout.points[1].x, 400);
    assert.ok(layout.points[0].x - buttonSize / 2 >= 400 - lineWidth / 2);
    assert.ok(layout.points[2].x + buttonSize / 2 <= 400 + lineWidth / 2);
  }
});

test("material actions sit beside the lower portion of a landscape object", () => {
  const layout = getImageQuickActionLayout({ ...base, actionCount: 3, width: 420, height: 240,
    sidePreference: ['right','left','bottom','top'], alignToVisibleEnd: true });
  assert.equal(layout.side, 'right');
  assert.ok(layout.points.every(point => point.x === 633));
  assert.ok(layout.points[2].y > 340 && layout.points[2].y < 420);
});

test("a partly offscreen material uses its visible side near the bottom of the viewport", () => {
  const layout = getImageQuickActionLayout({ ...base, actionCount: 5, centerX: 500, centerY: 200,
    width: 600, height: 1000, sidePreference: ['right','left','bottom','top'], alignToVisibleEnd: true });
  assert.equal(layout.side, 'left');
  assert.ok(layout.points.every(point => point.x === 177));
  assert.ok(layout.points.at(-1)!.y > 500 && layout.points.at(-1)!.y <= 580);
});

test("material actions retain their edge gap when rotated and avoid an occupied side", () => {
  const layout = getImageQuickActionLayout({ ...base, actionCount: 3, width: 260, height: 360,
    angle: Math.PI / 6, sidePreference: ['right','left','bottom','top'], alignToVisibleEnd: true,
    obstacles: [{left: 450, right: 730, top: 160, bottom: 520}] });
  assert.notEqual(layout.side, 'right');
  for (const point of layout.points) {
    assert.ok(point.x >= 20 && point.x <= 780 && point.y >= 20 && point.y <= 580);
  }
});

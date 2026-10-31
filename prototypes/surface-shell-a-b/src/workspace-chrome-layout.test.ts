import assert from "node:assert/strict";
import test from "node:test";
import { planWorkspaceChromeLayout } from "./workspace-chrome-layout.ts";

const base = {
  historyHeight: 48,
  historyWidth: 104,
  materialOpen: true,
  materialWidth: 324,
  toolbarRect: { x: 0, y: 18, width: 360, height: 64 },
  toolbarSide: "top" as const,
  workspaceHeight: 720,
  workspaceWidth: 900,
};

test("keeps history and material in the top row when the real toolbar leaves room", () => {
  assert.deepEqual(planWorkspaceChromeLayout(base), {
    historyLeft: 442,
    historyTop: 18,
    materialHeight: 584,
    materialRight: 18,
    materialTop: 59,
  });
});

test("keeps history top-right when the compact drawer leaves that corner free", () => {
  const layout = planWorkspaceChromeLayout({
    ...base,
    toolbarRect: { x: 0, y: 18, width: 480, height: 64 },
  });
  assert.equal(layout.historyLeft, 778);
  assert.equal(layout.historyTop, 18);
  assert.equal(layout.materialTop, 78);
  assert.equal(layout.materialHeight, 584);
});

test("moves only the drawer below a centered top toolbar", () => {
  const layout = planWorkspaceChromeLayout({
    ...base,
    toolbarRect: { x: 350, y: 18, width: 360, height: 64 },
  });
  assert.equal(layout.historyLeft, 778);
  assert.equal(layout.historyTop, 18);
  assert.equal(layout.materialTop, 100);
  assert.equal(layout.materialHeight, 584);
});

test("uses a second row only when a narrow workspace cannot fit history beside material", () => {
  const layout = planWorkspaceChromeLayout({
    ...base,
    toolbarRect: { x: 100, y: 18, width: 300, height: 64 },
    workspaceWidth: 450,
  });
  assert.equal(layout.historyLeft, 328);
  assert.equal(layout.historyTop, 100);
  assert.equal(layout.materialTop, 160);
  assert.equal(layout.materialHeight, 542);
});

test("reserves only the occupied dock edge for bottom and right toolbars", () => {
  const bottom = planWorkspaceChromeLayout({
    ...base,
    toolbarSide: "bottom",
    toolbarRect: { x: 260, y: 638, width: 380, height: 64 },
  });
  assert.equal(bottom.materialTop, 59);
  assert.equal(bottom.materialHeight, 571);

  const bottomWithoutCollision = planWorkspaceChromeLayout({
    ...base,
    toolbarSide: "bottom",
    toolbarRect: { x: 40, y: 638, width: 380, height: 64 },
  });
  assert.equal(bottomWithoutCollision.materialTop, 59);
  assert.equal(bottomWithoutCollision.materialHeight, 584);

  const right = planWorkspaceChromeLayout({
    ...base,
    toolbarSide: "right",
    toolbarRect: { x: 810, y: 18, width: 72, height: 684 },
  });
  assert.equal(right.materialRight, 102);
  assert.equal(right.historyLeft, 358);
  assert.equal(right.historyTop, 18);
  assert.equal(right.materialTop, 59);
  assert.equal(right.materialHeight, 584);
});

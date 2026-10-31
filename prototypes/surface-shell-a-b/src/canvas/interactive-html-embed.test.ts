import assert from "node:assert/strict";
import test from "node:test";
import {
  getInteractiveHtmlCanvasZoom,
  getInteractiveHtmlAnnotationScrollTranslation,
  getInteractiveHtmlCanvasPan,
  getInteractiveHtmlContentProjection,
  getInteractiveHtmlCoverProjection,
  getInteractiveHtmlPlacementSize,
  getInteractiveHtmlSurfaceProjection,
  getInteractiveHtmlTitlebarProjection,
  interactiveHtmlTitlebarHeight,
  interactiveHtmlDefersToCanvasTool,
  isInteractiveHtmlMaterialElement,
  normalizeInteractiveHtmlContentZoom,
  parseInteractiveHtmlZoomMessage,
  parseInteractiveHtmlMaterialMoveMessage,
  parseInteractiveHtmlPanMessage,
  parseInteractiveHtmlScrollMessage,
  parseInteractiveHtmlWheelPanMessage,
} from "./interactive-html-embed.ts";

test("recognizes only live interactive HTML canvas materials", () => {
  assert.equal(isInteractiveHtmlMaterialElement({ customData: { materialKind: "interactive-html" } }), true);
  assert.equal(isInteractiveHtmlMaterialElement({ customData: { materialKind: "interactive-html" }, isDeleted: true }), false);
  assert.equal(isInteractiveHtmlMaterialElement({ customData: { materialKind: "youtube" } }), false);
});

test("gives drawing tools the canvas surface while hand and selection retain the HTML bridge", () => {
  assert.equal(interactiveHtmlDefersToCanvasTool("hand"), false);
  assert.equal(interactiveHtmlDefersToCanvasTool("selection"), false);
  assert.equal(interactiveHtmlDefersToCanvasTool("pen"), true);
  assert.equal(interactiveHtmlDefersToCanvasTool("marker"), true);
  assert.equal(interactiveHtmlDefersToCanvasTool("eraser"), true);
  assert.equal(interactiveHtmlDefersToCanvasTool("text"), true);
  assert.equal(interactiveHtmlDefersToCanvasTool("shape"), false);
});

test("places a large HTML viewport without changing its aspect ratio", () => {
  assert.deepEqual(getInteractiveHtmlPlacementSize({ width: 1200, height: 760 }), {
    width: 1000,
    height: 633.3333333333334,
  });
  assert.deepEqual(getInteractiveHtmlPlacementSize({ width: 640, height: 480 }), {
    width: 640,
    height: 480,
  });
});

test("uses the declared A4 page as the visible canvas proportion", () => {
  const portrait = getInteractiveHtmlPlacementSize(
    { width: 1120, height: 820 },
    { page: "A4", orientation: "portrait" },
  );
  assert.equal(portrait.height, 720);
  assert.ok(Math.abs(portrait.width / portrait.height - 210 / 297) < 1e-12);

  const landscape = getInteractiveHtmlPlacementSize(
    { width: 1120, height: 1600 },
    { page: "A4", orientation: "landscape" },
  );
  assert.equal(landscape.width, 1000);
  assert.ok(landscape.height <= 720);
  assert.ok(Math.abs(landscape.width / landscape.height - 297 / 210) < 1e-12);
});

test("scales the titlebar uniformly with canvas zoom", () => {
  assert.deepEqual(getInteractiveHtmlTitlebarProjection(500, 0.5), { scale: 0.5, viewportHeight: 24 });
  assert.deepEqual(getInteractiveHtmlTitlebarProjection(800, 1.6), { scale: 1.6, viewportHeight: 76.80000000000001 });
});

test("keeps the interactive layout surface stable across canvas zoom levels", () => {
  assert.deepEqual(getInteractiveHtmlContentProjection(500, 250, 0.5, 1), {
    scale: 0.5,
    surfaceHeight: 452,
    surfaceWidth: 1000,
    viewportHeight: 226,
  });
  assert.deepEqual(getInteractiveHtmlContentProjection(1600, 800, 1.6, 1), {
    scale: 1.6,
    surfaceHeight: 452,
    surfaceWidth: 1000,
    viewportHeight: 723.2,
  });
});

test("normalizes and projects the independent content zoom", () => {
  assert.equal(normalizeInteractiveHtmlContentZoom(undefined), 1);
  assert.equal(normalizeInteractiveHtmlContentZoom(0.31), 0.5);
  assert.equal(normalizeInteractiveHtmlContentZoom(1.26), 1.3);
  assert.equal(normalizeInteractiveHtmlContentZoom(3), 2);
  assert.deepEqual(getInteractiveHtmlContentProjection(1000, 500, 1, 0.5), {
    scale: 0.5,
    surfaceHeight: 904,
    surfaceWidth: 2000,
    viewportHeight: 452,
  });
  assert.deepEqual(getInteractiveHtmlSurfaceProjection(600, 448, 0.5, 2), {
    scale: 1,
    surfaceHeight: 448,
    surfaceWidth: 600,
  });
  assert.deepEqual(getInteractiveHtmlSurfaceProjection(300, 224, 0.5, 1), {
    scale: 0.5,
    surfaceHeight: 448,
    surfaceWidth: 600,
  });
});

test("clips only a partial cover from the interactive frame", () => {
  assert.deepEqual(getInteractiveHtmlCoverProjection(1000, 600, null), {
    clipPath: undefined,
    fullyCovered: false,
  });
  assert.deepEqual(getInteractiveHtmlCoverProjection(1000, 600, {
    x: 0,
    y: 0.5,
    width: 1,
    height: 0.5,
  }), {
    clipPath: "inset(0px 0px 300px 0px)",
    fullyCovered: false,
  });
});

test("hides the complete frame only for a full cover", () => {
  assert.deepEqual(getInteractiveHtmlCoverProjection(1000, 600, {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  }), {
    clipPath: undefined,
    fullyCovered: true,
  });
});

test("accepts only bounded zoom bridge messages", () => {
  assert.deepEqual(parseInteractiveHtmlZoomMessage({
    type: "tafelraum:interactive-zoom",
    clientX: 120,
    clientY: 80,
    deltaMode: 0,
    deltaX: 0,
    deltaY: -42,
  }), {
    type: "tafelraum:interactive-zoom",
    clientX: 120,
    clientY: 80,
    deltaMode: 0,
    deltaX: 0,
    deltaY: -42,
  });
  assert.equal(parseInteractiveHtmlZoomMessage({ type: "tafelraum:interactive-zoom", deltaY: Infinity }), null);
  assert.equal(parseInteractiveHtmlZoomMessage({ type: "other", clientX: 0, clientY: 0, deltaMode: 0, deltaX: 0, deltaY: 1 }), null);
});

test("accepts only bounded HTML wheel-pan bridge messages", () => {
  assert.deepEqual(parseInteractiveHtmlWheelPanMessage({
    type: "tafelraum:interactive-wheel-pan",
    clientX: 120,
    clientY: 80,
    deltaMode: 0,
    deltaX: 0,
    deltaY: 42,
    shiftKey: false,
  }), {
    type: "tafelraum:interactive-wheel-pan",
    clientX: 120,
    clientY: 80,
    deltaMode: 0,
    deltaX: 0,
    deltaY: 42,
    shiftKey: false,
  });
  assert.equal(parseInteractiveHtmlWheelPanMessage({
    type: "tafelraum:interactive-wheel-pan",
    clientX: 0,
    clientY: 0,
    deltaMode: 0,
    deltaX: 0,
    deltaY: Infinity,
    shiftKey: false,
  }), null);
  assert.equal(parseInteractiveHtmlWheelPanMessage({
    type: "tafelraum:interactive-wheel-pan",
    clientX: 0,
    clientY: 0,
    deltaMode: 0,
    deltaX: 0,
    deltaY: 20,
  }), null);
});

test("accepts only bounded root-scroll bridge messages", () => {
  assert.deepEqual(parseInteractiveHtmlScrollMessage({
    type: "tafelraum:interactive-scroll",
    scrollX: 12,
    scrollY: 480,
  }), {
    type: "tafelraum:interactive-scroll",
    scrollX: 12,
    scrollY: 480,
  });
  assert.equal(parseInteractiveHtmlScrollMessage({
    type: "tafelraum:interactive-scroll",
    scrollX: -1,
    scrollY: 0,
  }), null);
  assert.equal(parseInteractiveHtmlScrollMessage({
    type: "tafelraum:interactive-scroll",
    scrollX: 0,
    scrollY: Infinity,
  }), null);
});

test("keeps annotations on their document position while HTML scrolls", () => {
  assert.deepEqual(getInteractiveHtmlAnnotationScrollTranslation(
    { x: 0, y: 120 },
    { x: 0, y: 280 },
    1,
  ), { x: 0, y: -160 });
  assert.deepEqual(getInteractiveHtmlAnnotationScrollTranslation(
    { x: 20, y: 100 },
    { x: 40, y: 180 },
    1.5,
  ), { x: -30, y: -120 });
  assert.deepEqual(getInteractiveHtmlAnnotationScrollTranslation(
    undefined,
    { x: 0, y: 75 },
    1,
  ), { x: 0, y: -75 });
});

test("zooms the canvas around the pointer from an interactive frame", () => {
  const next = getInteractiveHtmlCanvasZoom({
    type: "tafelraum:interactive-zoom",
    clientX: 400,
    clientY: 280,
    deltaMode: 0,
    deltaX: 0,
    deltaY: -420,
  }, { clientX: 500, clientY: 350 }, {
    offsetLeft: 0,
    offsetTop: 50,
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 1 },
  });
  assert.equal(next.zoom.value, 1.1);
  assert.equal(Math.round(next.scrollX * 1000) / 1000, -45.455);
  assert.equal(Math.round(next.scrollY * 1000) / 1000, -27.273);
});

test("accepts only bounded background-pan bridge messages", () => {
  assert.deepEqual(parseInteractiveHtmlPanMessage({
    type: "tafelraum:interactive-pan",
    phase: "move",
    clientX: 320,
    clientY: 180,
    pointerId: 7,
  }), {
    type: "tafelraum:interactive-pan",
    phase: "move",
    clientX: 320,
    clientY: 180,
    pointerId: 7,
  });
  assert.equal(parseInteractiveHtmlPanMessage({
    type: "tafelraum:interactive-pan",
    phase: "drag",
    clientX: 0,
    clientY: 0,
    pointerId: 1,
  }), null);
  assert.equal(parseInteractiveHtmlPanMessage({
    type: "tafelraum:interactive-pan",
    phase: "start",
    clientX: Infinity,
    clientY: 0,
    pointerId: 1,
  }), null);
});

test("pans the canvas by the viewport drag at the current zoom", () => {
  assert.deepEqual(getInteractiveHtmlCanvasPan({ x: 60, y: -30 }, {
    scrollX: 12,
    scrollY: 24,
    zoom: { value: 1.5 },
  }), {
    scrollX: 52,
    scrollY: 4,
  });
});

test("content-only HTML uses the entire native frame at every canvas zoom", () => {
  for (const zoom of [0.1,0.5,1,1.6,3]) {
    const titlebar = getInteractiveHtmlTitlebarProjection(700*zoom,zoom,0);
    const content = getInteractiveHtmlContentProjection(500*zoom,700*zoom,zoom,1,0);
    assert.equal(titlebar.viewportHeight,0);
    assert.ok(Math.abs(content.surfaceHeight-700)<1e-9);
    assert.ok(Math.abs(content.surfaceWidth-500)<1e-9);
  }
});

test("material background moves require a bounded pointer gesture and stable screen coordinates", () => {
  const start = {type:"tafelraum:interactive-material-move",phase:"start",clientX:20,clientY:40,pointerId:1,screenX:-1200,screenY:90};
  assert.deepEqual(parseInteractiveHtmlMaterialMoveMessage(start), start);
  for (const patch of [{screenX:NaN}, {screenY:100001}, {phase:"click"}, {pointerId:-1}, {type:"tafelraum:interactive-pan"}, {screenX:undefined}])
    assert.equal(parseInteractiveHtmlMaterialMoveMessage({...start,...patch}), null);
});


test("edge-attached covers use rectangular visible clips in all four uncover directions", () => {
  const cases = [
    [{ x: 0, y: 0, width: 1, height: 0.4 }, "inset(240px 0px 0px 0px)"],
    [{ x: 0, y: 0.4, width: 1, height: 0.6 }, "inset(0px 0px 360px 0px)"],
    [{ x: 0, y: 0, width: 0.4, height: 1 }, "inset(0px 0px 0px 400px)"],
    [{ x: 0.4, y: 0, width: 0.6, height: 1 }, "inset(0px 600px 0px 0px)"],
  ] as const;
  for (const [rect, clipPath] of cases) assert.deepEqual(getInteractiveHtmlCoverProjection(1000, 600, rect), { clipPath, fullyCovered: false });
  // Room passes screen-space dimensions; the same aperture scales with them.
  assert.equal(getInteractiveHtmlCoverProjection(500, 300, cases[0][0]).clipPath, "inset(120px 0px 0px 0px)");
});

test("interior covers retain all disjoint visible areas instead of hiding a complete strip", () => {
  assert.equal(getInteractiveHtmlCoverProjection(1000, 600, { x: 0.2, y: 0.3, width: 0.4, height: 0.2 }).clipPath,
    'path(evenodd, "M 0 0 H 1000 V 600 H 0 Z M 200 180 H 600 V 300 H 200 Z")');
  assert.equal(getInteractiveHtmlCoverProjection(1000, 600, { x: 0, y: 0.3, width: 1, height: 0.2 }).clipPath,
    'path(evenodd, "M 0 0 H 1000 V 600 H 0 Z M 0 180 H 1000 V 300 H 0 Z")');
});

import { shapedCoverGeometry } from "../canvas/canvas-cover-geometry.ts";
import assert from "node:assert/strict";
import test from "node:test";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { parseClientMessage } from "../../../../shared/live-canvas/protocol.ts";
import {
  createPublicIds, placeholderKind, planPublicProjection, publicCoverFrame, publicCoverTransition, publicCoverChanges, publicRasterDimensions, publicRasterMaxDimension,
  publicRasterMaxPixels, publicImageRasterScale, publicLinearPointBudget, publicLinearPointIndexes, sanitizePublicElements, viewportFromState,
} from "./public-projection-plan.ts";

test('built-in timers use the explicit public timer path while native metadata stays private', () => {
  const timer = element('private-timer', { customData: { surfaceKind: 'timer-widget', timerDurationSeconds: 300, timerSoundEnabled: true } });
  assert.equal(placeholderKind(timer), null);
  assert.deepEqual(planPublicProjection([timer]).unsupported, []);
  const publicTimer = sanitizePublicElements([timer], createPublicIds())[0];
  assert.equal(publicTimer.customData, undefined);
  assert.doesNotMatch(JSON.stringify(publicTimer), /private-timer|timerDurationSeconds|timerSoundEnabled/);
});

function element(id: string, patch: Record<string, unknown> = {}): ExcalidrawElement {
  return {
    id, type: "rectangle", x: 10, y: 20, width: 200, height: 100, angle: 0,
    strokeColor: "#000000", backgroundColor: "#ffffff", fillStyle: "solid", strokeWidth: 1,
    strokeStyle: "solid", roundness: null, roughness: 0, opacity: 100, seed: 1,
    version: 1, versionNonce: 1, index: null, isDeleted: false, groupIds: [], frameId: null,
    boundElements: null, updated: 123456, link: null, locked: false, ...patch,
  } as ExcalidrawElement;
}

test('Room can resolve opaque raster identities locally without exposing source IDs',()=>{
  const ids=createPublicIds();
  const raster=ids('raster','image:private-worksheet');
  const publicElement=ids('element',raster);
  assert.equal(ids.source(publicElement)?.sourceId,raster);
  assert.deepEqual(ids.source(raster),{kind:'raster',sourceId:'image:private-worksheet'});
  assert.doesNotMatch(publicElement,/private|worksheet/);
});

test("worksheet density follows decoded pixels, crop and placement within the 4x limit", () => {
  const image = { width: 400, height: 560, crop: null };
  assert.equal(publicImageRasterScale(image, { width: 1600, height: 2240 }), 4);
  assert.equal(publicImageRasterScale(image, { width: 800, height: 1120 }), 2);
  assert.equal(publicImageRasterScale(image, { width: 400, height: 560 }, 1.25), 1.25);
  assert.equal(publicImageRasterScale(image, { width: 8000, height: 11200 }), 4);
  const cropped = { ...image, crop: {x: 800, y: 1120, width: 800, height: 1120, naturalWidth: 1600, naturalHeight: 2240} };
  assert.equal(publicImageRasterScale(cropped, { width: 1600, height: 2240 }), 2);
  assert.equal(publicImageRasterScale({ ...cropped, width: 200, height: 280 }, { width: 1600, height: 2240 }), 4);
});

test("living covers remain ordered public attention elements", () => {
  const source = [element("text", { type: "text", text: "secret" }), element("cover1", {
    customData: { role: "image-cover", imageId: "elsewhere" }, angle: Math.PI / 3,
  }), element("shape"), element("cover2", { customData: { role: "image-cover" } }),
  element("marker", { type: "line", customData: { role: "marker-ribbon" } }),
  element("deletedCover", { isDeleted: true, customData: { role: "image-cover" } })];
  const plan = planPublicProjection(source);
  assert.deepEqual(plan.elements.map((e) => e.id), ["text", "cover1", "shape", "cover2", "marker"]);
  assert.deepEqual(planPublicProjection(source.map((e) => e.id === "cover2" ? { ...e, isDeleted: true } : e)).elements.map((e) => e.id),
    ["text", "cover1", "shape", "marker"]);
});

test("editing preview opacity does not hide rich text in the live projection", () => {
  const rendition = element("rich-image", { type: "image", opacity: 0,
    customData: { role: "rich-text-rendition-v1", richTextSourceId: "private-text" },
    scale: [1, 1], crop: null });
  const otherImage = element("other-image", { type: "image", opacity: 30, scale: [1, 1], crop: null });
  const plan = planPublicProjection([rendition, otherImage]);
  assert.equal(plan.elements[0].opacity, 100);
  assert.equal(plan.elements[1].opacity, 30);
  assert.equal(rendition.opacity, 0);
  assert.equal(sanitizePublicElements(plan.elements, createPublicIds())[0].customData, undefined);
});

test("cover transitions expose only bounded geometry and direction, never material identity", () => {
  const cover = element("private-cover", { x: 12, y: 18, width: 160, height: 80, angle: 0.2,
    customData: { role: "image-cover", imageId: "private-image", coverEdge: "left" } });
  const frame = publicCoverFrame(cover);
  assert.deepEqual(frame, { x: 12, y: 18, width: 160, height: 80, angle: 0.2, direction: "left" });
  assert.doesNotMatch(JSON.stringify(frame), /private|imageId|customData/);
  assert.deepEqual(publicCoverTransition(null, frame), { type: "cover", ...frame });
  assert.deepEqual(publicCoverTransition(frame, null), { type: "reveal", ...frame });
  assert.equal(publicCoverTransition(frame, frame), undefined);
  const rounded = publicCoverFrame(element("rounded-private", {
    roundness: { type: 3, value: 18, privatePath: "source.pdf" }, strokeWidth: 5,
  }));
  assert.deepEqual(rounded, { ...frame, x: 10, y: 20, width: 200, height: 100, angle: 0,
    direction: "right", roundness: { type: 3, value: 18 }, strokeWidth: 5 });
  assert.doesNotMatch(JSON.stringify(rounded), /private|source/);
  const ellipse = publicCoverFrame(element("ellipse", { type: "ellipse", roundness: null }));
  assert.equal(ellipse?.shape, "ellipse");
  assert.equal(publicCoverFrame(element("diamond", { type: "diamond", roundness: null }))?.shape, "diamond");
});

test("a shaped partial cover remains one validated public polygon and uses the same contour for its wipe", () => {
  const points: [number, number][] = [[0, 0], [0, 50], [50, 0], [100, 50], [50, 100], [0, 50], [0, 0]];
  const cover = element("private-cover", {
    type: "line", x: 100, y: 200, width: 100, height: 100, points,
    strokeColor: "transparent", strokeWidth: 0, roundness: null, backgroundColor: "#3e4854",
    customData: { role: "image-cover", imageId: "private-shape", coverRect: { x: 0.5, y: 0, width: 0.5, height: 1 } },
  });
  assert.equal(planPublicProjection([cover]).elements.length, 1);
  const frame = publicCoverFrame(cover)!;
  assert.equal(frame.shape, "polygon");
  assert.deepEqual(frame.points, points);
  assert.doesNotMatch(JSON.stringify(frame), /private|imageId|coverRect/);
  const publish = parseClientMessage({ type: "publish", generation: 1, revision: 1, replace: true,
    elements: [], assetIds: [], viewport: { x: 0, y: 0, width: 800, height: 600 }, background: "#1d242b",
    coverTransition: { ...frame, type: "reveal" } });
  assert.equal(publish.type, "publish");
  if (publish.type === "publish") assert.deepEqual(publish.coverTransition?.points, points);
  assert.throws(() => planPublicProjection([{ ...cover, strokeColor: "#3e4854" }]));
  assert.throws(() => parseClientMessage({ type: "publish", generation: 1, revision: 1, replace: true,
    elements: [], assetIds: [], viewport: { x: 0, y: 0, width: 800, height: 600 }, background: "#1d242b",
    coverTransition: { ...frame, points: [[0, 0]], type: "reveal" } }));
});

test("invalid covers fail closed, while transient empty marker previews are skipped", () => {
  for (const patch of [{ width: 0 }, { angle: NaN }, { opacity: 30 }, { fillStyle: "hachure" },
    { backgroundColor: "transparent" }, { type: "ellipse", roundness: { type: 3 } }]) {
    assert.throws(() => planPublicProjection([element("cover", { customData: { role: "image-cover" }, ...patch })]));
  }
  for (const patch of [{ type: "rectangle", roundness: { type: 3, value: 18 } },
    { type: "ellipse", roundness: null }, { type: "diamond", roundness: null }]) {
    assert.equal(planPublicProjection([element("cover", { customData: { role: "image-cover" }, ...patch })]).elements.length, 1);
  }
  const plan = planPublicProjection([
    element("preview", { width: 0, customData: { role: "marker-ribbon" } }),
    element("verticalStroke", { type: "line", width: 0 }),
  ]);
  assert.deepEqual(plan.elements.map((e) => e.id), ["verticalStroke"]);
});

test("registered apps stay private and block Live Canvas as unsupported", () => {
  const plan = planPublicProjection([element("private-app", {
    customData: { surfaceKind: "embedded-app", embeddedAppId: "lerndeck" },
  })]);
  assert.deepEqual(plan.unsupported, ["App"]);
  const [sanitized] = sanitizePublicElements(plan.elements, createPublicIds());
  assert.equal(sanitized.customData, undefined);
  assert.doesNotMatch(JSON.stringify(sanitized), /lerndeck|embedded-app/);
});

test("individual cover changes animate with other covers present, without exposing source identities", () => {
  const a = publicCoverFrame(element("private-a", { customData: { coverEdge: "left" } }))!;
  const b = { ...a, x: 600, direction: "right" as const };
  const both = new Map([["private-a", a], ["private-b", b]]);
  const justB = new Map([["private-b", b]]);
  assert.deepEqual(publicCoverChanges(both, justB), { ...a, type: "reveal" });
  assert.deepEqual(publicCoverChanges(justB, both), { ...a, type: "cover" });
  assert.equal(publicCoverChanges(both, new Map([["private-a", { ...a, x: 50 }], ["private-b", b]])), undefined, "moving is not a toggle");
  assert.equal(publicCoverChanges(both, new Map()), undefined, "multi-cover replacements have no misleading single wipe");
  assert.doesNotMatch(JSON.stringify(publicCoverChanges(both, justB)), /private/);
});

test("private fields are dropped, opaque bindings stay coherent, missing bindings are removed without moving text", () => {
  const ids = createPublicIds();
  const source = [element("lesson-private-box", {
    groupIds: ["archive/path/group"], boundElements: [{ id: "private-text", type: "text", secret: "path" }],
    link: "https://private.invalid", customData: { lessonId: "private-lesson" }, futurePrivateField: "secret",
    roundness: { type: 3, privatePath: "source.pdf" },
  }), element("private-text", {
    type: "text", text: "Visible label", originalText: "https://private.invalid/hidden-target",
    containerId: "lesson-private-box", fontFamily: 2, fontSize: 20, lineHeight: 1.25,
    textAlign: "center", verticalAlign: "middle", autoResize: false,
  }), element("arrow-private", { type: "arrow", points: [[0, 0], [100, 20]],
    startBinding: { elementId: "lesson-private-box", focus: 0, gap: 5, privatePath: "hidden" },
    endBinding: { elementId: "deleted", focus: 1, gap: 0 }, startArrowhead: null, endArrowhead: "arrow" })];
  const output = sanitizePublicElements(source, ids);
  assert.equal(output[0].boundElements?.[0].id, output[1].id);
  assert.equal((output[1] as any).containerId, output[0].id);
  assert.equal((output[2] as any).startBinding.elementId, output[0].id);
  assert.equal((output[2] as any).endBinding, null);
  assert.equal((output[1] as any).originalText, "Visible label");
  assert.doesNotMatch(JSON.stringify(output), /private|source\.pdf|archive\/|secret|customData|hidden/);
  assert.deepEqual(sanitizePublicElements(source, ids), output);
  const [unbound] = sanitizePublicElements([source[1]], ids);
  assert.equal((unbound as any).containerId, null);
  assert.equal(unbound.x, source[1].x);
  assert.equal(unbound.y, source[1].y);
  assert.equal(unbound.angle, source[1].angle);
  assert.notEqual(sanitizePublicElements(source, createPublicIds())[0].id, output[0].id);
});

test("native marker polygon points and fill survive removal of marker metadata", () => {
  const marker = element("marker", { type: "line", points: [[0, 0], [100, 10], [0, 20], [0, 0]],
    opacity: 32, backgroundColor: "#ffee00", startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: null, customData: { role: "marker-ribbon", markerGeometryVersion: 2 } });
  const [output] = sanitizePublicElements([marker], createPublicIds());
  assert.deepEqual((output as any).points, (marker as any).points);
  assert.equal(output.backgroundColor, "#ffee00");
  assert.equal(output.opacity, 32);
  assert.equal(output.customData, undefined);
});

test("extreme public ink is geometrically bounded without mutating the native source", () => {
  const points = Array.from({length:24_001},(_,index):[number,number]=>{
    const angle=index/24_000*Math.PI*2;
    return [500+Math.cos(angle)*(300+40*Math.sin(angle*37)),500+Math.sin(angle)*(300+40*Math.sin(angle*37))];
  });
  points.push(points[0]);
  const original = points.map(point=>[...point]);
  const indexes = publicLinearPointIndexes(points);
  assert.ok(indexes.length <= publicLinearPointBudget);
  assert.equal(indexes[0],0); assert.equal(indexes.at(-1),points.length-1);
  assert.deepEqual(points,original,"public bounding must not rewrite native lesson geometry");
  const marker = element("large-marker",{type:"line",points,opacity:32,backgroundColor:"#ffee00",
    startBinding:null,endBinding:null,startArrowhead:null,endArrowhead:null,customData:{role:"marker-ribbon"}});
  const [output]=sanitizePublicElements([marker],createPublicIds());
  assert.ok((output as any).points.length<=publicLinearPointBudget);
  assert.deepEqual((output as any).points[0],points[0]);
  assert.deepEqual((output as any).points.at(-1),points.at(-1));
});

test("material names stay in the host-only plan and invalid crop geometry is rejected", () => {
  const plan = planPublicProjection([element("audio", { customData: { materialKind: "audio", sourceTitle: "Private title" } }),
    element("html", { customData: { materialKind: "interactive-html" } }),
    element("local-video", { customData: { materialKind: "video", sourceTitle: "Local film" } }),
    element("video", { customData: { materialKind: "youtube" } })]);
  assert.deepEqual(plan.unsupported, ["Audio: Private title", "Video: Local film", "YouTube"]);
  const image = element("image", { type: "image", scale: [-1, 1], crop: {
    x: 20, y: 0, width: 80, height: 100, naturalWidth: 100, naturalHeight: 100,
  } });
  assert.equal(planPublicProjection([image]).elements.length, 1);
  assert.throws(() => planPublicProjection([{ ...image, crop: { ...(image as any).crop, width: 81 } } as ExcalidrawElement]));
});

test("camera uses scene coordinates and bounded raster sizes cover extreme aspect ratios", () => {
  assert.deepEqual(viewportFromState({ scrollX: -30, scrollY: 20, width: 1200, height: 800, zoom: { value: 2 } }),
    { x: 30, y: -20, width: 600, height: 400 });
  assert.throws(() => viewportFromState({ scrollX: 0, scrollY: 0, width: 10, height: 10, zoom: { value: 0 } }));
  for (const [width, height] of [[100, 100], [100000, 100000], [1000000, 1], [0.001, 1000000]]) {
    const result = publicRasterDimensions(width, height);
    assert.ok(result.width <= publicRasterMaxDimension && result.height <= publicRasterMaxDimension);
    assert.ok(result.width * result.height <= publicRasterMaxPixels);
    assert.ok(result.width >= 1 && result.height >= 1);
  }
  assert.throws(() => publicRasterDimensions(Infinity, 1));
  assert.equal(publicRasterDimensions(100, 100, 1.25).scale, 1.25);
  assert.throws(() => publicRasterDimensions(100, 100, 5));
});


test("rounded HTML cover transitions use contour bounds rather than the native first-vertex origin", () => {
  const worksheet = element("worksheet", { customData: { materialKind: "interactive-html" } });
  const geometry = shapedCoverGeometry(worksheet, { x: 0, y: 0, width: 1, height: 1 }, 0);
  const cover = element("cover", { ...geometry, type: "line", strokeWidth: 0, strokeColor: "transparent",
    backgroundColor: "#3e4854", customData: { role: "image-cover", imageId: worksheet.id } });
  const frame = publicCoverFrame(cover)!;
  assert.deepEqual([frame.x, frame.y, frame.width, frame.height], [10, 20, 200, 100]);
  assert.equal(frame.shape, "polygon");
  assert.ok(frame.points!.every(([x,y]) => x >= 0 && y >= 0 && x <= 200 && y <= 100));
  const corner = frame.points!.filter(([x,y]) => x < 14 && y < 14);
  assert.ok(corner.length > 3);
  for (const [x,y] of corner) assert.ok(Math.abs(Math.hypot(x-14,y-14)-14) < 0.000001);
  assert.equal(sanitizePublicElements([cover], createPublicIds())[0].type, "line");
});

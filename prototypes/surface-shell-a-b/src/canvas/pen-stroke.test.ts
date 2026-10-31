import assert from "node:assert/strict";
import test from "node:test";
import { penDiameter, penEngineWidth, penGeometry, penPressure, penRole } from "./pen-stroke.ts";
import { createStrokeSampler, sampleStrokePoint, type StrokePoint } from "./stroke-sampling.ts";
import { projectInteractiveHtmlAnnotations } from "./interactive-html-annotations.ts";

test("fineliner calibrates four physical diameters without changing toolbar values", () => {
  for (const [tool, expected] of [[1, 2], [2, 4], [4, 8], [7, 14]]) {
    assert.equal(penDiameter(tool), expected);
    assert.ok(Math.abs(penEngineWidth(expected) * 8.5 * Math.sin(Math.PI / 4) - expected) < 1e-12);
  }
});

test("pen keeps one pressure, native round geometry and the same live/final contract", () => {
  for (const path of [[[4, 8]], [[4, 8], [100, 10]], [[20, 30], [-5, 0], [50, -20]]] as StrokePoint[][]) {
    const geometry = penGeometry(path);
    assert.equal(geometry.simulatePressure, false);
    assert.equal(geometry.lastCommittedPoint, null);
    assert.equal(geometry.pressures.length, geometry.points.length);
    assert.ok(geometry.pressures.every(value => value === penPressure));
    assert.deepEqual(geometry, JSON.parse(JSON.stringify(geometry)));
    geometry.points.forEach(([x, y], index) => assert.deepEqual([x + geometry.x, y + geometry.y], path[Math.min(index, path.length - 1)]));
  }
});

test("subsampled pen tip stays present, duplicates and pauses do not thicken it", () => {
  const sampler = createStrokeSampler([0, 0], 1, 4, 1);
  sampleStrokePoint(sampler, [0.2, 0.1]);
  const before = penGeometry(sampler.points, sampler.tip);
  assert.deepEqual(before.points.at(-1), [0.2, 0.1]);
  for (let i = 0; i < 1000; i++) sampleStrokePoint(sampler, [0.2, 0.1]);
  assert.deepEqual(penGeometry(sampler.points, sampler.tip), before);
  sampleStrokePoint(sampler, [5, 2]);
  const after = penGeometry(sampler.points, sampler.tip);
  assert.deepEqual(after.points.at(-1), [5, 2]);
});

test("slow/fast event streams and frame groupings produce the same pen centerline", () => {
  const replay = (steps: number, zoom: number, batch: number) => {
    const sampler = createStrokeSampler([0, 0], zoom, 4, 1);
    for (let i = 1; i <= steps; i++) {
      sampleStrokePoint(sampler, [100 * i / steps / zoom, 30 * i / steps / zoom]);
      if (i % batch === 0) penGeometry(sampler.points, sampler.tip);
    }
    return penGeometry(sampler.points, sampler.tip).points.map(([x, y]) => [x * zoom, y * zoom]);
  };
  const reference = replay(1, 1, 1);
  for (const steps of [60, 240, 1000]) for (const zoom of [1, 2]) {
    const actual = replay(steps, zoom, 8);
    assert.equal(actual.length, reference.length);
    actual.forEach(([x, y], i) => assert.ok(Math.hypot(x - reference[i][0], y - reference[i][1]) < 1e-7));
  }
});

test("HTML uses the same native pen rendering inputs, including bounds and pressure", () => {
  const geometry = penGeometry([[20, 10], [0, 20], [100, 5]]);
  const { annotations } = projectInteractiveHtmlAnnotations(
    { id: "paper", x: 0, y: 0, width: 200, height: 200, angle: 0 },
    [{ ...geometry, id: "pen", type: "freedraw", angle: 0, version: 1, groupIds: ["g"],
      opacity: 100, strokeColor: "#111111", strokeWidth: penEngineWidth(4), customData: { role: penRole } }], "g", {});
  const annotation = annotations[0];
  assert.equal(annotation.kind, "stroke");
  if (annotation.kind !== "stroke") return;
  assert.deepEqual(annotation.nativeInk?.points, geometry.points);
  assert.deepEqual(annotation.nativeInk?.pressures, geometry.pressures);
  assert.equal(annotation.nativeInk?.lastCommittedPoint, null);
  assert.equal(annotation.x, geometry.x + geometry.width / 2);
  assert.equal(annotation.y, geometry.y + geometry.height / 2);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createViewerRenderScheduler } from './viewer-render-scheduler.ts';

test('a hidden viewer retains all preview state and paints only the latest on its next frame', () => {
  const frames: (() => void)[] = [], painted: number[][] = [];
  const points: number[] = [];
  const scheduler = createViewerRenderScheduler(() => painted.push([...points]),
    callback => frames.push(callback), () => {});
  for (let point = 0; point < 180; point++) { points.push(point); scheduler.request(true); }
  assert.equal(painted.length, 0);
  assert.equal(frames.length, 1);
  frames[0]();
  assert.deepEqual(painted, [points]);
  points.push(180); scheduler.request(true); frames[1]();
  assert.deepEqual(painted[1], points);
});

test('a canonical commit preempts a hidden preview, and disposal prevents late paints', () => {
  const frames: (() => void)[] = [], cancelled: number[] = [];
  let paints = 0;
  const scheduler = createViewerRenderScheduler(() => paints++,
    callback => frames.push(callback), id => cancelled.push(id));
  scheduler.request(true);
  scheduler.request(false);
  assert.equal(paints, 1, 'canonical commit runs without an animation frame');
  assert.deepEqual(cancelled, [1]);
  frames[0]();
  assert.equal(paints, 1, 'obsolete preview cannot overwrite the commit');
  scheduler.request(true); scheduler.dispose(); frames[1](); scheduler.request(false);
  assert.equal(paints, 1);
});

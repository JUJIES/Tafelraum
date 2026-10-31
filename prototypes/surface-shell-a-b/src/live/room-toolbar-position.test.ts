import assert from 'node:assert/strict';
import test from 'node:test';
import { clampRoomToolbarPosition } from './room-toolbar-position.ts';

test('Room toolbar stays reachable at every window edge and after resize', () => {
  const toolbar = { width: 486, height: 72 };
  assert.deepEqual(clampRoomToolbarPosition({ x: -50, y: -20 }, toolbar, { width: 1280, height: 720 }), { x: 8, y: 8 });
  assert.deepEqual(clampRoomToolbarPosition({ x: 1200, y: 680 }, toolbar, { width: 1280, height: 720 }), { x: 786, y: 640 });
  assert.deepEqual(clampRoomToolbarPosition({ x: 786, y: 640 }, toolbar, { width: 600, height: 300 }), { x: 106, y: 220 });
});

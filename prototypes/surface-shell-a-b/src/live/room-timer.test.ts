import assert from 'node:assert/strict';
import test from 'node:test';
import { timerIntersectsViewport, validRoomTimerCommand } from './room-timer.ts';

test('Room timer controls require bounded identity, generation, runtime revision and valid action', () => {
  const command = { type: 'timer-action', channel: 'local', generation: 2, id: 'opaque_timer', revision: 7, action: { type: 'start' } };
  assert.equal(validRoomTimerCommand(command), true);
  for (const patch of [{ generation: 0 }, { generation: NaN }, { revision: -1 }, { revision: 0 }, { id: '../private' },
    { id: 'x'.repeat(65) }, { action: { type: 'duration', seconds: 86401 } }, { action: { type: 'sound', enabled: 'yes' } }]) {
    assert.equal(validRoomTimerCommand({ ...command, ...patch }), false);
  }
  assert.equal(validRoomTimerCommand({ ...command, action: { type: 'duration', seconds: 1 } }), true);
});
test('timer controls stay within the selected clip, including rotated geometry', () => {
  const timer = { x: 0, y: 0, width: 300, height: 354, angle: 0 };
  assert.equal(timerIntersectsViewport(timer, { x: 100, y: 100, width: 20, height: 20 }), true);
  assert.equal(timerIntersectsViewport(timer, { x: 301, y: 0, width: 20, height: 20 }), false);
  assert.equal(timerIntersectsViewport({ ...timer, angle: Math.PI / 2 }, { x: 310, y: 100, width: 20, height: 20 }), true);
});


test('Remote timers consume service age and ignore arbitrary client wall clock offsets', async () => {
  const {remoteTimerWidgets} = await import('./remote-timer.ts');
  const scene={generation:1,revision:1,assetIds:[],viewport:{x:0,y:0,width:300,height:354},background:'#ffffff',serverTime:8000,
    elements:[{id:'opaque',type:'rectangle' as const,x:0,y:0,width:300,height:354,timer:{durationSeconds:60,remainingMs:60000,status:'running' as const,revision:3,observedAt:1000}}]};
  const a=remoteTimerWidgets(scene,500000)[0],b=remoteTimerWidgets(scene,999000000)[0];
  assert.equal(a.remainingMs,53000);assert.equal(b.remainingMs,53000);
  assert.equal(a.deadline,553000);assert.equal(b.deadline,999053000);assert.equal(a.soundEnabled,false);
  const late=remoteTimerWidgets({...scene,serverTime:62000},500000)[0];
  assert.equal(late.status,'finished');assert.equal(late.deadline,null);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { TimerRuntime, timerConfig, timerDisplayTime, timerRemainingMs, validTimerAction } from './timer.ts';
import { allowsNativeTextDoubleClick } from '../canvas/canvas-double-click.ts';
import { isPlainCanvasCoverTarget } from '../canvas/canvas-cover-target.ts';

function fixture(soundEnabled = false) {
  let now = 10000;
  const alarms: string[] = [], saved: unknown[] = [];
  let callback: (() => void) | undefined;
  const runtime = new TimerRuntime({ now: () => now, onAlarm: id => alarms.push(id), onConfig: config => saved.push(config),
    schedule: fn => { callback = fn; return 1 as unknown as ReturnType<typeof setTimeout>; }, cancel: () => { callback = undefined; } });
  runtime.reconcile([{ id: 'a', durationSeconds: 60, soundEnabled }]);
  return { runtime, alarms, saved, advance: (ms: number) => { now += ms; callback?.(); }, now: () => now };
}
test('pause and resume use one absolute deadline and never save elapsed seconds', () => {
  const f = fixture(); f.runtime.apply('a', { type: 'start' });
  f.advance(12500);
  assert.equal(timerDisplayTime(f.runtime.get('a')!, f.now()), '0:48');
  f.runtime.apply('a', { type: 'pause' }); f.advance(20000);
  assert.equal(timerRemainingMs(f.runtime.get('a')!, f.now()), 47500);
  f.runtime.apply('a', { type: 'start' });
  assert.equal(f.runtime.get('a')!.deadline, f.now() + 47500);
  assert.deepEqual(f.saved, []);
  f.runtime.dispose();
});
test('background/wake completion rings once and stays finished until an explicit restart', () => {
  const f = fixture(true); f.runtime.apply('a', { type: 'start' }); f.advance(120000);
  assert.deepEqual(f.alarms, ['a']); assert.equal(f.runtime.get('a')!.status, 'finished');
  f.runtime.checkDeadlines(); f.advance(5000); assert.deepEqual(f.alarms, ['a']);
  f.runtime.apply('a', { type: 'start' }); f.advance(60000); assert.deepEqual(f.alarms, ['a', 'a']);
  f.runtime.dispose();
});
test('silent completion still publishes finished state', () => {
  const f = fixture(); f.runtime.apply('a', { type: 'start' }); f.advance(60000);
  assert.equal(f.runtime.getSnapshot()[0].status, 'finished'); assert.deepEqual(f.alarms, []);
});
test('removed timers cannot ring; undo/reload starts a fresh ready timer', () => {
  const f = fixture(true); f.runtime.apply('a', { type: 'start' });
  const revision = f.runtime.get('a')!.revision;
  f.runtime.reconcile([]); f.advance(90000); assert.deepEqual(f.alarms, []);
  f.runtime.reconcile([{ id: 'a', durationSeconds: 60, soundEnabled: true }]);
  assert.equal(f.runtime.get('a')!.status, 'ready');
  assert.equal(f.runtime.apply('a', { type: 'start' }, revision), false);
});
test('stale Room actions are rejected and configuration changes are atomic', () => {
  const f = fixture(); const revision = f.runtime.get('a')!.revision;
  assert.equal(f.runtime.apply('a', { type: 'start' }, revision), true);
  assert.equal(f.runtime.apply('a', { type: 'reset' }, revision), false);
  f.runtime.apply('a', { type: 'duration', seconds: 90 });
  assert.equal(f.runtime.get('a')!.status, 'ready'); assert.equal(f.runtime.get('a')!.remainingMs, 90000);
  assert.deepEqual(f.saved, [{ id: 'a', durationSeconds: 90, soundEnabled: false }]);
  f.runtime.dispose();
});
test('geometry reconciliation preserves a running timer; config undo resets duration', () => {
  const f = fixture(true); f.runtime.apply('a', { type: 'start' });
  const state = f.runtime.get('a');
  f.runtime.reconcile([{ id: 'a', durationSeconds: 60, soundEnabled: true }]);
  assert.equal(f.runtime.get('a'), state);
  f.runtime.reconcile([{ id: 'a', durationSeconds: 30, soundEnabled: true }]);
  assert.equal(f.runtime.get('a')!.status, 'ready'); assert.equal(f.runtime.get('a')!.remainingMs, 30000);
});
test('invalid durations/actions never enter the runtime and disposal cancels alarms', () => {
  const f = fixture(true); const original = f.runtime.getSnapshot();
  for (const seconds of [0, -1, NaN, Infinity, 1.5, 86401, '60']) {
    const action = { type: 'duration', seconds };
    assert.equal(validTimerAction(action), false);
    assert.equal(f.runtime.apply('a', action as never), false);
  }
  assert.equal(f.runtime.getSnapshot(), original);
  f.runtime.apply('a', { type: 'start' }); f.runtime.dispose(); f.advance(90000);
  assert.deepEqual(f.alarms, []); assert.deepEqual(f.runtime.getSnapshot(), []);
});
test('native timer carrier has config only and never becomes a shape text/cover target', () => {
  const element = { type: 'rectangle', id: 'a', groupIds: [], customData: { surfaceKind: 'timer-widget', timerDurationSeconds: 123, timerSoundEnabled: true } };
  assert.deepEqual(timerConfig(element), { id: 'a', durationSeconds: 123, soundEnabled: true });
  assert.equal(allowsNativeTextDoubleClick(element), false);
  assert.equal(isPlainCanvasCoverTarget(element), false);
  assert.equal(timerConfig({ ...element, isDeleted: true }), null);
});

test('sound preparation belongs to accepted start/sound actions, never stale Room commands', () => {
  let prepared = 0;
  const runtime = new TimerRuntime({ onPrepareSound: () => prepared++ });
  runtime.reconcile([{ id: 'a', durationSeconds: 60, soundEnabled: false }]);
  const revision = runtime.get('a')!.revision;
  runtime.apply('a', { type: 'start' }, revision);
  assert.equal(prepared, 1);
  assert.equal(runtime.apply('a', { type: 'sound', enabled: true }, revision), false);
  assert.equal(prepared, 1);
  runtime.apply('a', { type: 'sound', enabled: true });
  assert.equal(prepared, 2);
  runtime.dispose();
});

test('native gesture guards block configuration writes while runtime-only start/pause remain immediate', () => {
  let busy = true;
  const saved: unknown[] = [];
  const runtime = new TimerRuntime({ isConfigurationBusy: () => busy, onConfig: config => saved.push(config) });
  runtime.reconcile([{ id: 'a', durationSeconds: 60, soundEnabled: false }]);
  assert.equal(runtime.apply('a', { type: 'duration', seconds: 90 }), false);
  assert.equal(runtime.apply('a', { type: 'sound', enabled: true }), false);
  assert.equal(runtime.apply('a', { type: 'start' }), true);
  assert.equal(runtime.apply('a', { type: 'pause' }), true);
  assert.deepEqual(saved, []);
  busy = false;
  assert.equal(runtime.apply('a', { type: 'duration', seconds: 90 }), true);
  assert.equal(saved.length, 1);
  runtime.dispose();
});

test('duration dial reaches every labeled stop exactly and stays monotonic between stops', async () => {
  const { timerDialStops, timerDialDuration, timerDialFraction } = await import('./timer-dial.ts');
  timerDialStops.forEach((seconds, index) => {
    assert.equal(timerDialDuration(index / 10), seconds);
    assert.equal(timerDialFraction(seconds), index / 10);
  });
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const seconds = timerDialDuration(i / 1000);
    assert.ok(seconds >= previous && seconds >= 10 && seconds <= 3600);
    previous = seconds;
  }
  assert.equal(timerDialFraction(1), 0);
  assert.equal(timerDialFraction(86400), 1);
  assert.equal(timerDialDuration(-1), 10);
  assert.equal(timerDialDuration(2), 3600);
});

test('dial pointer coordinates survive canvas zoom, translation and rotation', async () => {
  const { timerDialPoint, timerDialLocalPoint, timerDialFractionAtPoint } = await import('./timer-dial.ts');
  for (const angle of [0, Math.PI / 4, -Math.PI / 2, Math.PI]) for (const scale of [0.5, 1, 2]) {
    const c = Math.cos(angle), s = Math.sin(angle);
    const width = (300 * Math.abs(c) + 292 * Math.abs(s)) * scale;
    const height = (300 * Math.abs(s) + 292 * Math.abs(c)) * scale;
    const bounds = { left: 70, top: 140, width, height };
    for (const fraction of [0, 0.1, 0.3, 0.6, 0.9, 1]) {
      const p = timerDialPoint(fraction), dx = p.x - 150, dy = p.y - 146;
      const client = { x: bounds.left + width / 2 + (dx * c - dy * s) * scale,
        y: bounds.top + height / 2 + (dx * s + dy * c) * scale };
      const local = timerDialLocalPoint(client, bounds, angle);
      assert.ok(Math.abs(timerDialFractionAtPoint(local) - fraction) < 1e-9);
    }
  }
  assert.equal(timerDialFractionAtPoint({ x: 140, y: 270 }), 0);
  assert.equal(timerDialFractionAtPoint({ x: 160, y: 270 }), 1);
});

test('precise dial entry retains the existing one-second to 24-hour contract', async () => {
  const { parseTimerDuration } = await import('./timer-dial.ts');
  assert.equal(parseTimerDuration('0:01'), 1);
  assert.equal(parseTimerDuration('2:15'), 135);
  assert.equal(parseTimerDuration('90'), 5400);
  assert.equal(parseTimerDuration('1440:00'), 86400);
  for (const text of ['0:00', '1440:01', '2:60', '2.5', '-1', '', '1:2:3', 'abc']) assert.equal(parseTimerDuration(text), null);
});


test('crossing the open dial gap clamps continuously without wrapping the duration', async () => {
  const { timerDialAngleAtPoint, timerDialFractionAtPoint } = await import('./timer-dial.ts');
  const point = (degrees: number) => ({ x: 150 + Math.cos(degrees * Math.PI / 180) * 96, y: 146 + Math.sin(degrees * Math.PI / 180) * 96 });
  let angle = -225;
  for (const degrees of [130, 110, 90, 60, 40]) {
    assert.equal(timerDialFractionAtPoint(point(degrees), angle), 0);
    angle = timerDialAngleAtPoint(point(degrees), angle);
  }
  angle = 45;
  for (const degrees of [50, 80, 100, 130, 140]) {
    assert.equal(timerDialFractionAtPoint(point(degrees), angle), 1);
    angle = timerDialAngleAtPoint(point(degrees), angle);
  }
});

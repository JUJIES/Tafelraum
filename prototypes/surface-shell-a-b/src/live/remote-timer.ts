import type { Scene } from '../../../../shared/live-canvas/protocol.ts';
import type { TimerWidget } from '../widgets/timer.ts';

/** Anchor service-relative age to this client's receipt time, never its wall
 * clock relative to the teacher's. Late joins consume age from the snapshot. */
export function remoteTimerWidgets(scene: Scene, receivedAt = Date.now()): TimerWidget[] {
  return scene.elements.flatMap(element => {
    const timer = element.timer;
    if (!timer) return [];
    const age = timer.status === 'running' && scene.serverTime !== undefined && timer.observedAt !== undefined
      ? Math.max(0, scene.serverTime - timer.observedAt) : 0;
    const remainingMs = Math.max(0, timer.remainingMs - age);
    return [{ id: element.id, durationSeconds: timer.durationSeconds, soundEnabled: false,
      status: timer.status === 'running' && remainingMs === 0 ? 'finished' : timer.status,
      remainingMs, deadline: timer.status === 'running' && remainingMs > 0 ? receivedAt + remainingMs : null,
      revision: timer.revision, version: element.version ?? 1,
      x: element.x, y: element.y, width: element.width, height: element.height, angle: element.angle ?? 0 }];
  });
}

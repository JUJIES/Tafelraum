import { validTimerAction, type TimerAction, type TimerWidget } from '../widgets/timer.ts';

/** Local Room only. IDs are the existing opaque Room object IDs. */
export type RoomTimerCommand = {
  type: 'timer-action'; channel: string; generation: number; id: string; revision: number; action: TimerAction;
};
export type RoomTimerStateMessage = {
  type: 'timer-state'; channel: string; generation: number; revision: number; timers: TimerWidget[];
};
export function validRoomTimerCommand(value: unknown): value is RoomTimerCommand {
  if (!value || typeof value !== 'object') return false;
  const command = value as Partial<RoomTimerCommand>;
  return command.type === 'timer-action' && typeof command.channel === 'string'
    && Number.isSafeInteger(command.generation) && command.generation! > 0
    && typeof command.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(command.id)
    && Number.isSafeInteger(command.revision) && command.revision! > 0 && validTimerAction(command.action);
}
export function timerIntersectsViewport(timer: Pick<TimerWidget, 'x' | 'y' | 'width' | 'height' | 'angle'>,
  viewport: { x: number; y: number; width: number; height: number }): boolean {
  const halfWidth = (Math.abs(Math.cos(timer.angle)) * timer.width + Math.abs(Math.sin(timer.angle)) * timer.height) / 2;
  const halfHeight = (Math.abs(Math.sin(timer.angle)) * timer.width + Math.abs(Math.cos(timer.angle)) * timer.height) / 2;
  const x = timer.x + timer.width / 2, y = timer.y + timer.height / 2;
  return x + halfWidth > viewport.x && x - halfWidth < viewport.x + viewport.width
    && y + halfHeight > viewport.y && y - halfHeight < viewport.y + viewport.height;
}

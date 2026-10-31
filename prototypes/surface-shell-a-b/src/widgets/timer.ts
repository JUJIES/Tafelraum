/** Saved configuration only; running time never enters the lesson snapshot. */
export type TimerConfig = { id: string; durationSeconds: number; soundEnabled: boolean };
export type TimerState = TimerConfig & {
  status: 'ready' | 'running' | 'paused' | 'finished';
  remainingMs: number;
  deadline: number | null;
  revision: number;
};
export type TimerAction =
  | { type: 'start' | 'pause' | 'reset' }
  | { type: 'duration'; seconds: number }
  | { type: 'sound'; enabled: boolean };
export type TimerWidget = TimerState & {
  x: number; y: number; width: number; height: number; angle: number; version: number;
};
export const timerWidth = 300;
export const timerHeight = 354;
export const defaultTimerDuration = 300;
export const maximumTimerDuration = 86400;

export function validTimerDuration(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1 && value <= maximumTimerDuration;
}
export function validTimerAction(value: unknown): value is TimerAction {
  if (!value || typeof value !== 'object') return false;
  const action = value as Partial<TimerAction> & { seconds?: unknown; enabled?: unknown };
  return action.type === 'start' || action.type === 'pause' || action.type === 'reset'
    || action.type === 'duration' && validTimerDuration(action.seconds)
    || action.type === 'sound' && typeof action.enabled === 'boolean';
}
export function timerRemainingMs(state: TimerState, now = Date.now()): number {
  return state.status === 'running' && state.deadline !== null
    ? Math.max(0, state.deadline - now) : state.remainingMs;
}
export function timerDisplayTime(state: TimerState, now = Date.now()): string {
  const seconds = Math.ceil(timerRemainingMs(state, now) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

type TimerElement = {
  id: string; isDeleted?: boolean; type?: string; customData?: Record<string, unknown> | null;
};
export function isTimerWidget(element: TimerElement): boolean {
  return !element.isDeleted && element.type === 'rectangle' && element.customData?.surfaceKind === 'timer-widget';
}
export function timerConfig(element: TimerElement): TimerConfig | null {
  if (!isTimerWidget(element)) return null;
  return { id: element.id,
    durationSeconds: validTimerDuration(element.customData?.timerDurationSeconds)
      ? element.customData!.timerDurationSeconds as number : defaultTimerDuration,
    soundEnabled: element.customData?.timerSoundEnabled === true };
}

type RuntimeOptions = {
  now?: () => number;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: (handle: ReturnType<typeof setTimeout>) => void;
  onConfig?: (config: TimerConfig, origin: 'teacher' | 'room') => void;
  onAlarm?: (id: string) => void;
  onPrepareSound?: () => void;
  isConfigurationBusy?: () => boolean;
};

/** One host-owned clock, also while its widget or Room target is out of view. */
export class TimerRuntime {
  private states = new Map<string, TimerState>();
  private snapshot: readonly TimerState[] = [];
  private listeners = new Set<() => void>();
  private alarm: ReturnType<typeof setTimeout> | null = null;
  private nextRevision = 0;
  private readonly now: () => number;
  private readonly schedule: NonNullable<RuntimeOptions['schedule']>;
  private readonly cancel: NonNullable<RuntimeOptions['cancel']>;
  private readonly options: RuntimeOptions;
  constructor(options: RuntimeOptions = {}) {
    this.options = options;
    this.now = options.now ?? Date.now;
    this.schedule = options.schedule ?? ((callback, delay) => setTimeout(callback, delay));
    this.cancel = options.cancel ?? (handle => clearTimeout(handle));
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  get = (id: string) => this.states.get(id);
  prepareSound() { this.options.onPrepareSound?.(); }
  isConfigurationBusy() { return this.options.isConfigurationBusy?.() ?? false; }
  private publish() {
    this.snapshot = [...this.states.values()];
    this.arm();
    this.listeners.forEach(listener => listener());
  }
  private ready(config: TimerConfig, revision = ++this.nextRevision): TimerState {
    return { ...config, status: 'ready', remainingMs: config.durationSeconds * 1000,
      deadline: null, revision };
  }
  reconcile(configs: readonly TimerConfig[]) {
    const ids = new Set(configs.map(config => config.id));
    let changed = false;
    for (const id of this.states.keys()) if (!ids.has(id)) { this.states.delete(id); changed = true; }
    for (const config of configs) {
      const current = this.states.get(config.id);
      if (!current || current.durationSeconds !== config.durationSeconds) {
        this.states.set(config.id, this.ready(config)); changed = true;
      } else if (current.soundEnabled !== config.soundEnabled) {
        this.states.set(config.id, { ...current, soundEnabled: config.soundEnabled, revision: ++this.nextRevision }); changed = true;
      }
    }
    if (changed) this.publish();
  }
  apply(id: string, action: TimerAction, revision?: number, origin: 'teacher' | 'room' = 'teacher'): boolean {
    if (!validTimerAction(action)) return false;
    if ((action.type === 'duration' || action.type === 'sound') && this.isConfigurationBusy()) return false;
    this.checkDeadlines();
    const state = this.states.get(id);
    if (!state || revision !== undefined && revision !== state.revision) return false;
    if (action.type === 'start' || action.type === 'sound' && action.enabled) this.prepareSound();
    let next = state;
    if (action.type === 'start' && state.status !== 'running') {
      const remainingMs = state.status === 'finished' ? state.durationSeconds * 1000 : state.remainingMs;
      next = { ...state, status: 'running', remainingMs, deadline: this.now() + remainingMs };
    } else if (action.type === 'pause' && state.status === 'running') {
      next = { ...state, status: 'paused', remainingMs: timerRemainingMs(state, this.now()), deadline: null };
    } else if (action.type === 'reset') next = this.ready(state, state.revision);
    else if (action.type === 'duration') next = this.ready({ ...state, durationSeconds: action.seconds }, state.revision);
    else if (action.type === 'sound') next = { ...state, soundEnabled: action.enabled };
    else return true;
    next = { ...next, revision: ++this.nextRevision };
    this.states.set(id, next);
    this.publish();
    if ((action.type === 'duration' || action.type === 'sound')
      && (state.durationSeconds !== next.durationSeconds || state.soundEnabled !== next.soundEnabled)) this.options.onConfig?.({
      id, durationSeconds: next.durationSeconds, soundEnabled: next.soundEnabled,
    }, origin);
    return true;
  }
  checkDeadlines = () => {
    const now = this.now();
    const alarms: string[] = [];
    for (const [id, state] of this.states) if (state.status === 'running' && state.deadline !== null && state.deadline <= now) {
      this.states.set(id, { ...state, status: 'finished', deadline: null, remainingMs: 0, revision: ++this.nextRevision });
      if (state.soundEnabled) alarms.push(id);
    }
    if (alarms.length || this.snapshot.some(state => state.status === 'running' && state.deadline !== null && state.deadline <= now)) {
      this.publish();
      alarms.forEach(id => this.options.onAlarm?.(id));
    } else this.arm();
  };
  private arm() {
    if (this.alarm !== null) this.cancel(this.alarm);
    this.alarm = null;
    const deadlines = [...this.states.values()].flatMap(state => state.deadline === null ? [] : [state.deadline]);
    if (deadlines.length) this.alarm = this.schedule(this.checkDeadlines, Math.max(1, Math.min(...deadlines) - this.now()));
  }
  dispose() {
    if (this.alarm !== null) this.cancel(this.alarm);
    this.alarm = null; this.states.clear(); this.snapshot = [];
  }
}

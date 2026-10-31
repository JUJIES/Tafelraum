import type { PointerMessage } from "../../../../shared/live-canvas/protocol.ts";

/** Presence bypasses React scene state and the renderer's asset/update effects. */
export function createHostPointerChannel() {
  const listeners = new Set<() => void>();
  return {
    current: null as PointerMessage | null,
    receivedAt: 0,
    set(message: PointerMessage | null) {
      this.current = message; this.receivedAt = performance.now();
      listeners.forEach(listener => listener());
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
}
export type HostPointerChannel = ReturnType<typeof createHostPointerChannel>;

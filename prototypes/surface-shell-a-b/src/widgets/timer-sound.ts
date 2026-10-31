/** Host-only synthetic chime: no file asset and no Room audio instance. */
export class TimerSound {
  private context: AudioContext | null = null;
  async activate() {
    try {
      this.context ??= new AudioContext();
      if (this.context.state !== 'running') await this.context.resume();
      return this.context.state === 'running';
    } catch { return false; }
  }
  play(): boolean {
    const context = this.context;
    if (!context || context.state !== 'running') return false;
    for (const [offset, frequency] of [[0, 660], [0.18, 880]] as const) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + offset;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.7);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start); oscillator.stop(start + 0.72);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    }
    return true;
  }
  dispose() { void this.context?.close().catch(() => undefined); this.context = null; }
}

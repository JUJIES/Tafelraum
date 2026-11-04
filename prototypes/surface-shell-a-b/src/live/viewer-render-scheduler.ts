/** Keep validated preview state current, but paint it only when the viewer can
 * produce a frame. Canonical content must never wait behind a hidden preview. */
export function createViewerRenderScheduler(
  render: () => void,
  requestFrame: (callback: () => void) => number,
  cancelFrame: (id: number) => void,
) {
  let frame: number | null = null;
  let sequence = 0;
  let disposed = false;
  const cancel = () => {
    sequence++;
    if (frame !== null) cancelFrame(frame);
    frame = null;
  };
  return {
    request(preview: boolean) {
      if (disposed) return;
      if (!preview) { cancel(); render(); return; }
      if (frame !== null) return;
      const current = sequence;
      frame = requestFrame(() => {
        if (disposed || current !== sequence) return;
        frame = null;
        render();
      });
    },
    dispose() { disposed = true; cancel(); },
  };
}

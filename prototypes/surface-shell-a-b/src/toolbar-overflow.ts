export type ToolbarOverflowState = {
  backward: boolean;
  forward: boolean;
};

type ToolbarOverflowMetrics = {
  clientSize: number;
  scrollOffset: number;
  scrollSize: number;
};

const overflowTolerance = 1;

export function toolbarOverflowState({
  clientSize,
  scrollOffset,
  scrollSize,
}: ToolbarOverflowMetrics): ToolbarOverflowState {
  const maximumOffset = Math.max(0, scrollSize - clientSize);
  return {
    backward: maximumOffset > overflowTolerance && scrollOffset > overflowTolerance,
    forward: maximumOffset > overflowTolerance && scrollOffset < maximumOffset - overflowTolerance,
  };
}

export function toolbarScrollDistance(clientSize: number): number {
  return Math.max(54, Math.round(clientSize * 0.72));
}

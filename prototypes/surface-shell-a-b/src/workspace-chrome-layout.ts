import type { ToolbarPosition } from "./toolbar-docking";

export type WorkspaceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WorkspaceChromeLayout = {
  historyLeft: number;
  historyTop: number;
  materialHeight: number;
  materialRight: number;
  materialTop: number;
};

export type WorkspaceChromeLayoutInput = {
  historyHeight: number;
  historyWidth: number;
  materialOpen: boolean;
  materialWidth: number;
  toolbarRect: WorkspaceRect;
  toolbarSide: ToolbarPosition;
  workspaceHeight: number;
  workspaceWidth: number;
};

const edgeInset = 18;
const dockClearance = 102;
const controlGap = 12;
const toolbarGap = 8;
const materialPreferredTop = 42;
const materialMaxHeight = 584;

function rectsOverlap(first: WorkspaceRect, second: WorkspaceRect, gap = 0) {
  return first.x < second.x + second.width + gap
    && first.x + first.width + gap > second.x
    && first.y < second.y + second.height + gap
    && first.y + first.height + gap > second.y;
}

function rectAt(x: number, y: number, width: number, height: number): WorkspaceRect {
  return { x, y, width, height };
}

/**
 * Places transient workspace chrome from the actual occupied rectangles instead
 * of viewport breakpoints. The material drawer keeps its top-right anchor until
 * it really collides; history stays top-right and moves beside the drawer only
 * when both measured rectangles would otherwise overlap.
 */
export function planWorkspaceChromeLayout({
  historyHeight,
  historyWidth,
  materialOpen,
  materialWidth,
  toolbarRect,
  toolbarSide,
  workspaceHeight,
  workspaceWidth,
}: WorkspaceChromeLayoutInput): WorkspaceChromeLayout {
  const materialRight = toolbarSide === "right" ? dockClearance : edgeInset;
  const safeLeft = toolbarSide === "left" ? dockClearance : edgeInset;
  const historyRight = materialRight;
  let historyLeft = workspaceWidth - historyRight - historyWidth;
  let historyTop = edgeInset;
  const materialHeightAt = (top: number) => Math.min(
    materialMaxHeight,
    Math.max(0, workspaceHeight - top - edgeInset),
  );
  const centeredMaterialTop = (
    workspaceHeight - edgeInset - materialHeightAt(materialPreferredTop)
  ) / 2;
  let materialTop = Math.max(materialPreferredTop, centeredMaterialTop);

  const materialRectAt = (top: number) => {
    const rect = rectAt(
      workspaceWidth - materialRight - materialWidth,
      top,
      materialWidth,
      materialHeightAt(top),
    );
    if (toolbarSide !== "bottom" || !rectsOverlap(rect, toolbarRect, toolbarGap)) return rect;
    return {
      ...rect,
      height: Math.max(0, Math.min(rect.height, toolbarRect.y - toolbarGap - top)),
    };
  };

  let historyRect = rectAt(historyLeft, historyTop, historyWidth, historyHeight);
  let materialRect = materialRectAt(materialTop);

  if (toolbarSide === "top") {
    const belowToolbar = Math.max(edgeInset, toolbarRect.y + toolbarRect.height + edgeInset);
    if (rectsOverlap(historyRect, toolbarRect, toolbarGap)) {
      historyTop = belowToolbar;
      historyRect = { ...historyRect, y: historyTop };
    }
    if (materialOpen && rectsOverlap(materialRect, toolbarRect, toolbarGap)) {
      materialTop = belowToolbar;
      materialRect = materialRectAt(materialTop);
    }
  }

  // Only leave the top-right history position when the compact drawer actually
  // reaches it. Prefer the familiar position directly beside the drawer; if
  // that would hit the toolbar or the safe edge, continue the drawer below it.
  if (materialOpen && rectsOverlap(historyRect, materialRect)) {
    const besideLeft = workspaceWidth - materialRight - materialWidth - controlGap - historyWidth;
    const besideRect = rectAt(besideLeft, historyTop, historyWidth, historyHeight);
    const besideIsFree = besideLeft >= safeLeft
      && !(toolbarSide === "top" && rectsOverlap(besideRect, toolbarRect, toolbarGap));
    if (besideIsFree) {
      historyLeft = besideLeft;
      historyRect = besideRect;
    } else {
      materialTop = Math.max(materialTop, historyTop + historyHeight + controlGap);
      materialRect = materialRectAt(materialTop);
    }
  }

  return {
    historyLeft,
    historyTop,
    materialHeight: materialRect.height,
    materialRight,
    materialTop,
  };
}

import type { CSSProperties, SVGProps } from "react";
import laserUrl from "@fluentui/svg-icons/icons/wand_24_regular.svg";
import clipUrl from "@fluentui/svg-icons/icons/scan_dash_24_regular.svg";
import circleFilledUrl from "@fluentui/svg-icons/icons/circle_24_filled.svg";
import circleRegularUrl from "@fluentui/svg-icons/icons/circle_24_regular.svg";
import cursorUrl from "@fluentui/svg-icons/icons/cursor_24_regular.svg";
import diamondFilledUrl from "@fluentui/svg-icons/icons/diamond_24_filled.svg";
import diamondRegularUrl from "@fluentui/svg-icons/icons/diamond_24_regular.svg";
import documentAddUrl from "@fluentui/svg-icons/icons/document_add_24_regular.svg";
import toolboxUrl from "@fluentui/svg-icons/icons/toolbox_24_regular.svg";
import undoUrl from "@fluentui/svg-icons/icons/arrow_undo_24_regular.svg";
import redoUrl from "@fluentui/svg-icons/icons/arrow_redo_24_regular.svg";
import eraserUrl from "@fluentui/svg-icons/icons/eraser_24_regular.svg";
import handRightUrl from "@fluentui/svg-icons/icons/hand_right_24_regular.svg";
import rectangleLandscapeFilledUrl from "@fluentui/svg-icons/icons/rectangle_landscape_24_filled.svg";
import rectangleLandscapeRegularUrl from "@fluentui/svg-icons/icons/rectangle_landscape_24_regular.svg";
import scanObjectUrl from "@fluentui/svg-icons/icons/scan_object_24_regular.svg";
import textFontUrl from "@fluentui/svg-icons/icons/text_font_24_regular.svg";
import widgetsUrl from "@fluentui/svg-icons/icons/puzzle_piece_24_regular.svg";
import appsUrl from "@fluentui/svg-icons/icons/apps_24_regular.svg";
import chevronDownUrl from "@fluentui/svg-icons/icons/chevron_down_24_regular.svg";
import chevronLeftUrl from "@fluentui/svg-icons/icons/chevron_left_24_regular.svg";
import chevronRightUrl from "@fluentui/svg-icons/icons/chevron_right_24_regular.svg";
import chevronUpUrl from "@fluentui/svg-icons/icons/chevron_up_24_regular.svg";

export type FluentToolbarIconName =
  | "laser"
  | "clip"
  | "hand"
  | "selection"
  | "eraser"
  | "text"
  | "material"
  | "apps"
  | "widgets"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "chevronUp"
  | "fit"
  | "toolbarToggle"
  | "undo"
  | "redo";

type FluentShapeIconName = "rectangle" | "ellipse" | "diamond";

const toolbarIconUrls: Record<FluentToolbarIconName, string> = {
  laser: laserUrl,
  clip: clipUrl,
  hand: handRightUrl,
  selection: cursorUrl,
  eraser: eraserUrl,
  text: textFontUrl,
  material: documentAddUrl,
  apps: appsUrl,
  widgets: widgetsUrl,
  chevronDown: chevronDownUrl,
  chevronLeft: chevronLeftUrl,
  chevronRight: chevronRightUrl,
  chevronUp: chevronUpUrl,
  fit: scanObjectUrl,
  toolbarToggle: toolboxUrl,
  undo: undoUrl,
  redo: redoUrl,
};

const shapeIconUrls: Record<FluentShapeIconName, { regular: string; filled: string }> = {
  rectangle: { regular: rectangleLandscapeRegularUrl, filled: rectangleLandscapeFilledUrl },
  ellipse: { regular: circleRegularUrl, filled: circleFilledUrl },
  diamond: { regular: diamondRegularUrl, filled: diamondFilledUrl },
};

function maskStyle(url: string): CSSProperties {
  return {
    WebkitMaskImage: `url("${url}")`,
    maskImage: `url("${url}")`,
  };
}

export function FluentToolbarIcon({ name, className }: { name: FluentToolbarIconName; className?: string }) {
  return (
    <span
      className={`fluent-toolbar-icon${className ? ` ${className}` : ""}`}
      style={maskStyle(toolbarIconUrls[name])}
      aria-hidden="true"
    />
  );
}

export function FluentShapeIcon({ color, fillMode, shape }: {
  color: string;
  fillMode: "empty" | "translucent" | "solid";
  shape: FluentShapeIconName;
}) {
  const urls = shapeIconUrls[shape];
  return (
    <span
      className={`fluent-shape-icon is-${fillMode}`}
      style={{ "--shape-tool-color": color } as CSSProperties}
      aria-hidden="true"
    >
      {fillMode !== "empty" && <span className="fluent-shape-icon-fill" style={maskStyle(urls.filled)}/>}
      <span className="fluent-shape-icon-outline" style={maskStyle(urls.regular)}/>
    </span>
  );
}

// Original geometry: Microsoft Fluent UI System Icons, Highlight 24 Regular (MIT).
// The three existing subpaths remain unchanged. Only the authored nib subpath receives the tool color.
export function FluentHighlighterIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={`tool-highlighter-icon${className ? ` ${className}` : ""}`}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="tool-highlighter-icon-body"
        d="M20.26 2c.38 0 .7.29.74.65v4.6c0 1.16-.87 2.11-2 2.24v2.26c0 1.19-.92 2.16-2.1 2.24h-.4v2.8c0 .81-.44 1.56-1.14 1.96l-.15.08-6.64 3.1a.75.75 0 0 1-1.06-.58V14h-.26c-1.2 0-2.17-.93-2.24-2.1L5 11.75V9.49A2.25 2.25 0 0 1 3 7.4V2.75a.75.75 0 0 1 1.5-.1v4.6c0 .38.28.7.65.74l.1.01h13.5c.38 0 .7-.28.75-.65v-4.6c0-.41.34-.75.76-.75"
      />
      <path
        className="tool-highlighter-icon-tip"
        d="M15 14H9v6.07l5.57-2.6c.23-.11.39-.33.42-.57l.01-.11z"
      />
      <path
        className="tool-highlighter-icon-band"
        d="M17.5 9.5h-11v2.25c0 .38.28.69.65.74h9.6c.38 0 .7-.28.75-.64V9.5"
      />
    </svg>
  );
}

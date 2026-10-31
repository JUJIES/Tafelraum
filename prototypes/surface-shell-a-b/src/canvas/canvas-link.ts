import type { CanvasTheme } from "./canvas-port";

const canvasLinkFontSize = 22;
const canvasLinkMinWidth = 168;
const canvasLinkMaxWidth = 520;

const canvasLinkColors: Record<CanvasTheme, {
  backgroundColor: string;
  strokeColor: string;
  textColor: string;
}> = {
  light: {
    backgroundColor: "#dcebf3",
    strokeColor: "#3f82a6",
    textColor: "#244f66",
  },
  dark: {
    backgroundColor: "#263d4b",
    strokeColor: "#76b6d2",
    textColor: "#e0f1f8",
  },
};

export function canvasLinkPresentation(label: string, theme: CanvasTheme) {
  const text = `↗  ${label.trim()}`;
  const estimatedTextWidth = [...text].length * canvasLinkFontSize * 0.57;
  return {
    ...canvasLinkColors[theme],
    fontSize: canvasLinkFontSize,
    height: 50,
    text,
    width: Math.round(Math.min(canvasLinkMaxWidth, Math.max(canvasLinkMinWidth, estimatedTextWidth + 44))),
  };
}

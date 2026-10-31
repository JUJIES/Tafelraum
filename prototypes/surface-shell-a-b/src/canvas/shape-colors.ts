import type { ShapeFillMode } from "./canvas-port";

export type ShapeColorId = "blue" | "green" | "yellow" | "coral" | "neutral";

export type ShapeColorOption = {
  id: ShapeColorId;
  label: string;
  value: string;
};

export const shapeColorOptions: readonly ShapeColorOption[] = [
  { id: "blue", label: "Blau", value: "#5a9fc5" },
  { id: "green", label: "Grün", value: "#5b9878" },
  { id: "yellow", label: "Gelb", value: "#c79a35" },
  { id: "coral", label: "Koralle", value: "#c56f69" },
  { id: "neutral", label: "Neutral", value: "#7f8995" },
];

export function shapeBackgroundColor(fillMode: ShapeFillMode, color: string) {
  if (fillMode === "empty") return "transparent";
  if (fillMode === "solid") return color;

  const normalized = color.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;
  if (!/^[0-9a-f]{6}$/i.test(expanded)) return color;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, 0.24)`;
}

function relativeLuminance(color: string) {
  const normalized = color.replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((part) => `${part}${part}`).join("")
    : normalized;
  if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;

  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function shapeTextColor(fillMode: ShapeFillMode, shapeColor: string, canvasColor: string) {
  const backgroundLuminance = relativeLuminance(fillMode === "solid" ? shapeColor : canvasColor);
  if (backgroundLuminance === null) return "#111111";

  const darkLuminance = relativeLuminance("#111111") ?? 0;
  const lightLuminance = relativeLuminance("#fffdf8") ?? 1;
  const darkContrast = (backgroundLuminance + 0.05) / (darkLuminance + 0.05);
  const lightContrast = (lightLuminance + 0.05) / (backgroundLuminance + 0.05);
  return darkContrast >= lightContrast ? "#111111" : "#fffdf8";
}

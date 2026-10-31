import { t, useUiLocale } from "./i18n";
import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import { toolStrokeSizes, type InkTool, type ToolStrokeSizeId } from "./canvas/tool-stroke-widths";
import type { Theme } from "./theme-preferences";
import "./tool-ink-options.css";

export type ToolColorId = "black" | "neutral" | "blue" | "plum" | "green" | "yellow" | "sage" | "coral" | "sky";
export type ToolColor = { id: ToolColorId; label: string; value: string };
export type ToolColorAnchor = { x: number; y: number };
export const penColors: Record<Theme, ToolColor[]> = {
  light: [
    { id: "black", label: "Schwarz", value: "#111111" },
    { id: "neutral", label: "Graphit", value: "#26323f" },
    { id: "blue", label: "Tafelblau", value: "#2f6f92" },
    { id: "plum", label: "Pflaume", value: "#76577a" },
    { id: "green", label: "Tafelgrün", value: "#3f7461" },
  ],
  dark: [
    { id: "black", label: "Schwarz", value: "#111111" },
    { id: "neutral", label: "Kreide", value: "#f4f3ef" },
    { id: "blue", label: "Tafelblau", value: "#8fc7df" },
    { id: "plum", label: "Pflaume", value: "#d6a0cc" },
    { id: "green", label: "Tafelgrün", value: "#91cbb1" },
  ],
};

export const markerColors: ToolColor[] = [
  { id: "yellow", label: "Sonnengelb", value: "#e8c85b" },
  { id: "sage", label: "Salbei", value: "#82b79b" },
  { id: "coral", label: "Koralle", value: "#d88c82" },
  { id: "sky", label: "Himmelblau", value: "#80afc8" },
];

export function ToolInkOptions({ anchor, tool, colors, selectedColor, selectedStrokeSize, onColorSelect, onStrokeSizeSelect }: {
  anchor: ToolColorAnchor;
  tool: InkTool;
  colors: ToolColor[];
  selectedColor: ToolColorId;
  selectedStrokeSize: ToolStrokeSizeId;
  onColorSelect(color: ToolColor): void;
  onStrokeSizeSelect(sizeId: ToolStrokeSizeId): void;
}) {
  useUiLocale();
  const toolLabel = tool === "pen" ? "Stift" : "Marker";
  const style = {
    "--tool-color-anchor-x": `${anchor.x}px`,
    "--tool-color-anchor-y": `${anchor.y}px`,
  } as CSSProperties;
  return (
    <div className="tool-ink-options" role="dialog" aria-label={t("{0} einstellen", t(toolLabel))} style={style}>
      <div className="tool-ink-option-section" role="listbox" aria-label={t(tool === "pen" ? "Stiftfarbe" : "Markerfarbe")}>
        {colors.map((color) => {
          const isSelected = color.id === selectedColor;
          return (
            <button
              className="tool-color-option"
              type="button"
              key={color.id}
              role="option"
              aria-label={t("{0}: {1}", t(toolLabel), t(color.label))}
              aria-selected={isSelected}
              title={t(color.label)}
              style={{ "--swatch-color": color.value } as CSSProperties}
              onClick={() => onColorSelect(color)}
            >
              {isSelected && <Check aria-hidden="true" strokeWidth={2.6}/>} 
            </button>
          );
        })}
      </div>
      <span className="tool-ink-options-divider" aria-hidden="true"/>
      <div className="tool-ink-option-section" role="radiogroup" aria-label={t("{0}: Strichstärke", t(toolLabel))}>
        {toolStrokeSizes.map((size) => {
          const isSelected = size.id === selectedStrokeSize;
          return (
            <button
              className="tool-stroke-option"
              type="button"
              key={size.id}
              role="radio"
              aria-label={t("{0}: Strichstärke {1}", t(toolLabel), t(size.label))}
              aria-checked={isSelected}
              title={t("Strichstärke: {0}", t(size.label))}
              onClick={() => onStrokeSizeSelect(size.id)}
            >
              <span
                className="tool-stroke-option-sample"
                style={{ "--stroke-preview-width": `${size.previewWidth}px` } as CSSProperties}
              />
              {isSelected && <Check aria-hidden="true" strokeWidth={2.4}/>} 
            </button>
          );
        })}
      </div>
    </div>
  );
}


export type InkTool = "pen" | "marker";
export type ToolStrokeSizeId = "fine" | "regular" | "wide" | "extra-wide";

export type ToolStrokeSize = {
  iconStrokeWidth: number;
  id: ToolStrokeSizeId;
  label: "Fein" | "Normal" | "Breit" | "Sehr breit";
  previewWidth: number;
  widths: Record<InkTool, number>;
};

export const defaultToolStrokeSizeId: ToolStrokeSizeId = "regular";

export const toolStrokeSizes: readonly ToolStrokeSize[] = [
  { id: "fine", label: "Fein", previewWidth: 2, iconStrokeWidth: 1.45, widths: { pen: 1, marker: 2 } },
  { id: "regular", label: "Normal", previewWidth: 4, iconStrokeWidth: 1.8, widths: { pen: 2, marker: 4 } },
  { id: "wide", label: "Breit", previewWidth: 7, iconStrokeWidth: 2.2, widths: { pen: 4, marker: 7 } },
  { id: "extra-wide", label: "Sehr breit", previewWidth: 10, iconStrokeWidth: 2.6, widths: { pen: 7, marker: 11 } },
];

export function toolStrokeSize(sizeId: ToolStrokeSizeId) {
  return toolStrokeSizes.find((size) => size.id === sizeId) ?? toolStrokeSizes[1];
}

export function toolStrokeWidth(tool: InkTool, sizeId: ToolStrokeSizeId) {
  return toolStrokeSize(sizeId).widths[tool];
}

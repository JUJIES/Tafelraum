import { interactiveHtmlCornerRadius, isInteractiveHtmlMaterialElement } from "./interactive-html-embed.ts";
import { isImageCoverFull, type ImageCoverRect } from "./image-cover.ts";
import { isShapeAnnotationGroupId, shapeAnnotationGroupPrefix } from "./image-annotation-selection.ts";

export const canvasCoverGroupPrefix = "tafelraum-canvas-cover:";

export type CanvasCoverElement = {
  boundElements?: readonly { id: string; type: string }[] | null;
  containerId?: string | null;
  customData?: Record<string, unknown>;
  groupIds: readonly string[];
  id: string;
  isDeleted?: boolean;
  roundness?: { type: 1 | 2 | 3; value?: number } | null;
  strokeWidth?: number;
  type: string;
};

export type CanvasCoverShape = {
  roundness: CanvasCoverElement["roundness"];
  type: "diamond" | "ellipse" | "rectangle";
};

const basicShapeTypes = new Set(["diamond", "ellipse", "rectangle"]);

export function canvasCoverGroupId(targetId: string) {
  return `${canvasCoverGroupPrefix}${targetId}`;
}

export function canvasCoverShapeForTarget(element: CanvasCoverElement): CanvasCoverShape {
  if (isInteractiveHtmlMaterialElement(element)) {
    return { roundness: { type: 3, value: interactiveHtmlCornerRadius }, type: "rectangle" };
  }
  if (element.type === "diamond" || element.type === "ellipse") {
    return { roundness: null, type: element.type };
  }
  if (element.type === "rectangle" || element.type === "image") {
    return { roundness: element.roundness ?? null, type: "rectangle" };
  }
  return { roundness: null, type: "rectangle" };
}

/** A full cover must reach beyond the target's outer stroke, including the
 * antialiased corner pixels. Partial covers keep a narrow editable edge. */
export function canvasCoverStrokeWidth(target: CanvasCoverElement, rect: ImageCoverRect): number {
  if ((target.type === "image" && target.roundness) || isInteractiveHtmlMaterialElement(target)) return 0;
  return basicShapeTypes.has(target.type) && isImageCoverFull(rect)
    ? Math.max(3, (target.strokeWidth ?? 1) + 2)
    : 1;
}

export function isCanvasCoverGroupId(groupId: string) {
  return groupId.startsWith(canvasCoverGroupPrefix);
}

export function isPlainCanvasCoverTarget(element: CanvasCoverElement) {
  if (element.isDeleted) return false;
  if (element.type === "text") return !element.containerId && !element.customData?.role;
  return basicShapeTypes.has(element.type)
    && (!element.customData || Object.keys(element.customData).length === 0);
}

export function canvasCoverTargetMembers<T extends CanvasCoverElement>(
  elements: readonly T[],
  targetId: string,
) : T[] {
  const liveElements = new Map(elements.filter((element) => !element.isDeleted).map((element) => [element.id, element]));
  const target = liveElements.get(targetId);
  if (!target || !isPlainCanvasCoverTarget(target)) return [];

  const memberIds = new Set([target.id]);
  for (const binding of target.boundElements ?? []) {
    if (binding.type === "text" && liveElements.has(binding.id)) memberIds.add(binding.id);
  }
  return elements.filter((element) => memberIds.has(element.id) && !element.isDeleted);
}

export function resolvePlainCanvasCoverTarget<T extends CanvasCoverElement>(
  elements: readonly T[],
  selectedElementIds: readonly string[],
  selectedGroupIds: readonly string[] = [],
) : T | null {
  const liveElements = new Map(elements.filter((element) => !element.isDeleted).map((element) => [element.id, element]));
  const coverGroupTargetId = selectedGroupIds
    .find(isCanvasCoverGroupId)
    ?.slice(canvasCoverGroupPrefix.length);
  const shapeGroupTargetId = selectedGroupIds
    .find(isShapeAnnotationGroupId)
    ?.slice(shapeAnnotationGroupPrefix.length);
  if (coverGroupTargetId || shapeGroupTargetId) {
    const groupedTarget = liveElements.get(coverGroupTargetId ?? shapeGroupTargetId!);
    if (groupedTarget && isPlainCanvasCoverTarget(groupedTarget)) return groupedTarget;
  }

  const selected = selectedElementIds.flatMap((id) => {
    const element = liveElements.get(id);
    return element ? [element] : [];
  });
  const directTargets = selected.filter(isPlainCanvasCoverTarget);
  if (directTargets.length === 1) {
    const allowedIds = new Set(canvasCoverTargetMembers(elements, directTargets[0].id).map((element) => element.id));
    const remaining = selected.filter((element) => (
      !allowedIds.has(element.id)
      && element.customData?.role !== "image-cover"
    ));
    if (remaining.length === 0) return directTargets[0];
  }

  if (selected.length === 1 && selected[0].type === "text" && selected[0].containerId) {
    const container = liveElements.get(selected[0].containerId);
    if (container && isPlainCanvasCoverTarget(container)) return container;
  }
  return null;
}

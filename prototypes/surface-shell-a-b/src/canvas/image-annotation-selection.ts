const imageAnnotationGroupPrefix = "tafelraum-image-annotations:";
export const shapeAnnotationGroupPrefix = "tafelraum-shape-annotations:";

type GroupedCanvasElement = {
  containerId?: string | null;
  customData?: Record<string, unknown>;
  groupIds: readonly string[];
  id?: string;
  isDeleted?: boolean;
  type: string;
};

const independentShapeTypes = new Set(["diamond", "ellipse", "rectangle"]);

export function isIndependentMaterialAnnotation(element:Pick<GroupedCanvasElement,'type'|'customData'|'containerId'>) {
  return (element.type==='text'&&!element.containerId)||element.type==='freedraw'
    ||(element.type==='line'&&['ink-pen','marker-ribbon'].includes(String(element.customData?.role)));
}

export function imageAnnotationGroupId(imageId: string) {
  return `${imageAnnotationGroupPrefix}${imageId}`;
}

export function isImageAnnotationGroupId(groupId: string) {
  return groupId.startsWith(imageAnnotationGroupPrefix);
}

export function shapeAnnotationGroupId(shapeId: string) {
  return `${shapeAnnotationGroupPrefix}${shapeId}`;
}

export function isShapeAnnotationGroupId(groupId: string) {
  return groupId.startsWith(shapeAnnotationGroupPrefix);
}

export function isCanvasAnnotationGroupId(groupId: string) {
  return isImageAnnotationGroupId(groupId) || isShapeAnnotationGroupId(groupId);
}

export function isIndependentCanvasShape(element: Pick<GroupedCanvasElement, "customData" | "type">) {
  return independentShapeTypes.has(element.type)
    && element.customData?.role !== "image-cover"
    && typeof element.customData?.materialKind !== "string"
    && element.customData?.surfaceKind !== "embedded-app";
}

export function independentShapeIds(elements: readonly GroupedCanvasElement[]) {
  return new Set(elements.flatMap((element) => (
    !element.isDeleted && element.id && isIndependentCanvasShape(element) ? [element.id] : []
  )));
}

export function imageGroupIdsAfterIndependentShapeDetach(
  element: GroupedCanvasElement,
  shapeIds: ReadonlySet<string>,
) {
  const belongsToIndependentShape = Boolean(element.id && shapeIds.has(element.id))
    || (element.type === "text" && typeof element.containerId === "string" && shapeIds.has(element.containerId));
  return belongsToIndependentShape
    ? element.groupIds.filter((groupId) => !isImageAnnotationGroupId(groupId))
    : element.groupIds;
}

export function getCanvasAnnotationSelectionIntent(element: GroupedCanvasElement) {
  const groupId = element.groupIds.find(isCanvasAnnotationGroupId);
  if (!groupId) return null;

  if (isShapeAnnotationGroupId(groupId)) {
    const shapeId = groupId.slice(shapeAnnotationGroupPrefix.length);
    return {
      groupId,
      mode: element.id === shapeId || element.containerId === shapeId || element.customData?.role === "image-cover"
        ? "bundle" as const : "annotation" as const,
    };
  }

  const isProjectedMaterial = element.customData?.materialKind === "youtube"
    || element.customData?.materialKind === "video"
    || element.customData?.materialKind === "interactive-html"
    || element.customData?.surfaceKind === "embedded-app";

  return {
    groupId,
    mode: element.type === "image" || element.customData?.role === "image-cover" || isProjectedMaterial
      ? "bundle" as const
      : "annotation" as const,
  };
}

/** A standalone text is selected directly. Its material group still owns the
 * binding, but entering engine group-edit mode would outline the whole sheet. */
export function getCanvasAnnotationEditingGroupId(element: GroupedCanvasElement) {
  const intent = getCanvasAnnotationSelectionIntent(element);
  return intent?.mode === "annotation" && !(isIndependentMaterialAnnotation(element)&&!isShapeAnnotationGroupId(intent.groupId))
    ? intent.groupId : null;
}

export function preservesIndependentImageAnnotationMultiSelection(
  elementId: string,
  groupId: string,
  editingGroupId: string | null,
  selectedElementIds: Readonly<Record<string, boolean>>,
  selectedGroupIds: Readonly<Record<string, boolean>>,
) {
  // Pointer-down on one member of an independent multi-selection starts a
  // drag of that selection. Reapplying the material-specific intent here
  // would collapse it to only the clicked image bundle or annotation. Native
  // material-group and group-editing states still need their dedicated flow.
  const selectedCount = Object.values(selectedElementIds).filter(Boolean).length;
  return selectedCount > 1
    && Boolean(selectedElementIds[elementId])
    && !selectedGroupIds[groupId]
    && editingGroupId !== groupId;
}

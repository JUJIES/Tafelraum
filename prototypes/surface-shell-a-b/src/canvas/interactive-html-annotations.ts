import { isImageCoverElement } from "./image-cover.ts";
import { markerRole } from "./marker-stroke.ts";
import { penRole } from "./pen-stroke.ts";
import type { InteractiveHtmlScrollOffset } from "./interactive-html-embed.ts";
import type { ExcalidrawFreeDrawElement } from "@excalidraw/excalidraw/element/types";

export type InteractiveHtmlStrokeAnnotation = {
  nativeInk?: Pick<ExcalidrawFreeDrawElement, "points" | "pressures" | "simulatePressure" | "lastCommittedPoint" | "strokeWidth">;
  fillColor?: string;
  angle: number;
  height: number;
  id: string;
  kind: "stroke";
  opacity: number;
  points: readonly { x: number; y: number }[];
  selected: boolean;
  scrollAnchor?: Readonly<{ x: number; y: number }>;
  strokeColor: string;
  strokeWidth: number;
  width: number;
  x: number;
  y: number;
};

export type InteractiveHtmlTextAnnotation = {
  angle: number;
  color: string;
  fontSize: number;
  height: number;
  id: string;
  kind: "text";
  lineHeight: number;
  opacity: number;
  selected: boolean;
  scrollAnchor?: Readonly<{ x: number; y: number }>;
  text: string;
  textAlign: "center" | "left" | "right";
  width: number;
  x: number;
  y: number;
};

export type InteractiveHtmlAnnotation = InteractiveHtmlStrokeAnnotation | InteractiveHtmlTextAnnotation;

type MaterialGeometry = {
  angle: number;
  height: number;
  id: string;
  width: number;
  x: number;
  y: number;
};

type AnnotationGeometry = MaterialGeometry & {
  backgroundColor?: string;
  customData?: Record<string, unknown>;
  fontSize?: number;
  groupIds: readonly string[];
  id: string;
  isDeleted?: boolean;
  lineHeight?: number;
  opacity: number;
  points?: readonly (readonly [number, number])[];
  pressures?: readonly number[];
  simulatePressure?: boolean;
  strokeColor: string;
  strokeWidth: number;
  text?: string;
  textAlign?: string;
  type: string;
  version: number;
};

// One ephemeral index per scene inspection, shared by every HTML/app frame.
// It carries native references only and is never persisted or reused next frame.
export function createInteractiveHtmlAnnotationScene(elements: readonly AnnotationGeometry[]) {
  const liveElements = new Map(elements.filter(element => !element.isDeleted).map(element => [element.id, element]));
  const groups = new Map<string, AnnotationGeometry[]>();
  const order = new Map<string, number>();
  elements.forEach((element, index) => {
    order.set(element.id, index);
    if (element.isDeleted) return;
    const text = isImageCoverElement(element) ? liveElements.get(String(element.customData?.imageId)) : undefined;
    const ids = new Set([...element.groupIds, ...(text?.type === "text" ? text.groupIds : [])]);
    for (const id of ids) {
      const group = groups.get(id) ?? [];
      group.push(element); groups.set(id, group);
    }
  });
  return { liveElements, groups, order };
}
export type InteractiveHtmlAnnotationScene = ReturnType<typeof createInteractiveHtmlAnnotationScene>;

function rotatePoint(point: { x: number; y: number }, center: { x: number; y: number }, angle: number) {
  const deltaX = point.x - center.x;
  const deltaY = point.y - center.y;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    x: center.x + deltaX * cosine - deltaY * sine,
    y: center.y + deltaX * sine + deltaY * cosine,
  };
}

function scenePointToMaterialLocal(material: MaterialGeometry, point: { x: number; y: number }) {
  const center = { x: material.x + material.width / 2, y: material.y + material.height / 2 };
  const unrotated = rotatePoint(point, center, -material.angle);
  return { x: unrotated.x - material.x, y: unrotated.y - material.y };
}

function localAnnotationPoints(material: MaterialGeometry, element: MaterialGeometry, center: { x: number; y: number }, points: readonly (readonly number[])[]) {
  // Compose the two rotations once per annotation, not for every pen point.
  const angle = element.angle - material.angle;
  const cosine = Math.cos(angle), sine = Math.sin(angle);
  const halfWidth = element.width / 2, halfHeight = element.height / 2;
  return points.map(([x, y]) => ({
    x: center.x + (x - halfWidth) * cosine - (y - halfHeight) * sine,
    y: center.y + (x - halfWidth) * sine + (y - halfHeight) * cosine,
  }));
}

function annotationScrollAnchor(element: AnnotationGeometry, materialId: string) {
  const candidate = element.customData?.interactiveHtmlScrollAnchor;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return undefined;
  const anchor = candidate as { materialId?: unknown; x?: unknown; y?: unknown };
  return anchor.materialId === materialId
    && typeof anchor.x === "number" && Number.isFinite(anchor.x) && anchor.x >= 0
    && typeof anchor.y === "number" && Number.isFinite(anchor.y) && anchor.y >= 0
    ? { x: anchor.x, y: anchor.y }
    : undefined;
}

export function projectInteractiveHtmlAnnotations(
  material: MaterialGeometry,
  elements: readonly AnnotationGeometry[],
  groupId: string,
  selectedElementIds: Readonly<Record<string, boolean>>,
  transientAnnotationIds: ReadonlySet<string> = new Set(),
  transientScrollAnchor?: InteractiveHtmlScrollOffset,
  movingAnnotationId?: string,
  scene?: InteractiveHtmlAnnotationScene,
) {
  const annotations: InteractiveHtmlAnnotation[] = [];
  const versions: string[] = [];
  const liveElements = scene?.liveElements ?? new Map(elements.filter(element => !element.isDeleted).map(element => [element.id, element]));
  let candidates = scene?.groups.get(groupId) ?? (scene ? [] : elements);
  if (scene && (transientAnnotationIds.size || movingAnnotationId)) {
    const ids = new Set([...candidates.map(element => element.id), ...transientAnnotationIds, ...(movingAnnotationId ? [movingAnnotationId] : [])]);
    candidates = [...ids].flatMap(id => liveElements.has(id) ? [liveElements.get(id)!] : [])
      .sort((a, b) => scene.order.get(a.id)! - scene.order.get(b.id)!);
  }
  for (const element of candidates) {
    // A text cover belongs to the text, not directly to its material. Project
    // that same native rectangle above the iframe, in native paint order.
    const coveredText = isImageCoverElement(element)
      ? liveElements.get(String(element.customData?.imageId)) : undefined;
    const textCover = element.type === "rectangle" && coveredText?.type === "text"
      && coveredText.groupIds.includes(groupId) ? coveredText : undefined;
    // Each HTML surface fills only its own clipped area; the native canvas
    // supplies the rest. Do not wait for the dragged text's center to enter.
    const movingAnnotation = element.id === movingAnnotationId;
    if (
      element.isDeleted
      || element.id === material.id
      || (!element.groupIds.includes(groupId) && !transientAnnotationIds.has(element.id) && !movingAnnotation && !textCover)
    ) continue;
    const selected = Boolean(selectedElementIds[element.id]);
    // A live ink preview has not been attached to its material yet, so it does
    // not carry the persisted scroll anchor until pointerup. Give only that
    // transient preview the current material scroll position. Otherwise the
    // renderer subtracts the current scroll from an implicit zero anchor and
    // the stroke appears displaced before snapping into place on commit.
    const scrollAnchor = annotationScrollAnchor(textCover ?? element, material.id)
      ?? (transientAnnotationIds.has(element.id) || movingAnnotation ? transientScrollAnchor : undefined);
    if (textCover) {
      const center = { x: element.x + element.width / 2, y: element.y + element.height / 2 };
      const localCenter = scenePointToMaterialLocal(material, center);
      const corners = [[0, 0], [element.width, 0], [element.width, element.height], [0, element.height], [0, 0]];
      annotations.push({
        kind: "stroke", id: element.id, selected: false,
        angle: element.angle - material.angle,
        width: element.width, height: element.height, x: localCenter.x, y: localCenter.y,
        opacity: element.opacity / 100,
        points: localAnnotationPoints(material, element, localCenter, corners),
        fillColor: element.backgroundColor,
        strokeColor: element.strokeColor, strokeWidth: element.strokeWidth,
        ...(scrollAnchor ? { scrollAnchor } : {}),
      });
      versions.push(`${element.id}:${element.version}:${textCover.version}`);
      continue;
    }
    if ((element.type === "freedraw" || element.type === "line" || element.type === "arrow") && element.points?.length) {
      const annotationCenter = {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
      };
      const localCenter = scenePointToMaterialLocal(material, annotationCenter);
      const points = localAnnotationPoints(material, element, localCenter, element.points);
      annotations.push({
        angle: element.angle - material.angle,
        height: Math.abs(element.height),
        id: element.id,
        kind: "stroke",
        ...(element.type === "freedraw" && element.customData?.role === penRole ? {
          // Derived native rendering input only, never another persisted stroke.
          nativeInk: {
            points: element.points.map(([x, y]) => [x, y]) as ExcalidrawFreeDrawElement["points"],
            pressures: [...(element.pressures ?? [])],
            simulatePressure: element.simulatePressure ?? false,
            lastCommittedPoint: null,
            strokeWidth: element.strokeWidth,
          },
        } : {}),
        ...(element.customData?.role === markerRole ? { fillColor: element.backgroundColor } : {}),
        opacity: element.opacity / 100,
        points,
        selected,
        ...(scrollAnchor ? { scrollAnchor } : {}),
        strokeColor: element.strokeColor,
        strokeWidth: element.strokeWidth,
        width: Math.abs(element.width),
        x: localCenter.x,
        y: localCenter.y,
      });
      versions.push(`${element.id}:${element.version}:${selected ? 1 : 0}`);
      continue;
    }
    if (element.type === "text" && typeof element.text === "string") {
      const localCenter = scenePointToMaterialLocal(material, {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
      });
      annotations.push({
        angle: element.angle - material.angle,
        color: element.strokeColor,
        fontSize: element.fontSize ?? 20,
        height: Math.abs(element.height),
        id: element.id,
        kind: "text",
        lineHeight: element.lineHeight ?? 1.25,
        opacity: element.opacity / 100,
        selected,
        ...(scrollAnchor ? { scrollAnchor } : {}),
        text: element.text,
        textAlign: element.textAlign === "center" || element.textAlign === "right" ? element.textAlign : "left",
        width: Math.abs(element.width),
        x: localCenter.x,
        y: localCenter.y,
      });
      versions.push(`${element.id}:${element.version}:${selected ? 1 : 0}`);
    }
  }
  return { annotations, key: versions.join("|") };
}

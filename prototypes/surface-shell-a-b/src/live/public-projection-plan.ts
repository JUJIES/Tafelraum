import { t } from "../i18n/translate.ts";
import {canMirrorEmbeddedApp} from "../embedded-apps.ts";
import { coverPolygonBounds } from "../canvas/cover-sweep-geometry.ts";
import type {
  ExcalidrawElement,
  ExcalidrawImageElement,
  ExcalidrawElbowArrowElement,
  PointBinding,
} from "@excalidraw/excalidraw/element/types";
import type { CoverTransition } from "../../../../shared/live-canvas/protocol";

export const publicLinearPointBudget = 12_000;

function distanceToSegmentSquared(point: readonly [number,number], start: readonly [number,number], end: readonly [number,number]) {
  const dx = end[0]-start[0], dy = end[1]-start[1];
  if (dx === 0 && dy === 0) return (point[0]-start[0])**2 + (point[1]-start[1])**2;
  const t = Math.max(0,Math.min(1,((point[0]-start[0])*dx+(point[1]-start[1])*dy)/(dx*dx+dy*dy)));
  return (point[0]-(start[0]+t*dx))**2 + (point[1]-(start[1]+t*dy))**2;
}

function linearIndexes(points: readonly (readonly [number,number])[], tolerance: number) {
  const keep = new Set([0,points.length-1]), stack: [number,number][] = [[0,points.length-1]];
  const squared = tolerance*tolerance;
  while (stack.length) {
    const [start,end] = stack.pop()!;
    let farthest = -1, distance = squared;
    for (let index=start+1;index<end;index++) {
      const candidate=distanceToSegmentSquared(points[index],points[start],points[end]);
      if(candidate>distance){distance=candidate;farthest=index;}
    }
    if(farthest!==-1){keep.add(farthest);stack.push([start,farthest],[farthest,end]);}
  }
  return [...keep].sort((a,b)=>a-b);
}

/** Extreme native ink remains exact in the lesson. Only its public wire copy is
 * bounded, with a geometry-aware tolerance chosen to stay below the protocol
 * ceiling instead of invalidating the whole live publication. */
export function publicLinearPointIndexes(points: readonly (readonly [number,number])[], budget = publicLinearPointBudget) {
  if(points.length<=budget)return points.map((_,index)=>index);
  let low=0, high=1;
  while(linearIndexes(points,high).length>budget && high<1_000_000)high*=2;
  let best=linearIndexes(points,high);
  for(let step=0;step<8;step++){
    const middle=(low+high)/2, candidate=linearIndexes(points,middle);
    if(candidate.length>budget)low=middle;else{high=middle;best=candidate;}
  }
  return best;
}

export type PublicViewport = { x: number; y: number; width: number; height: number };
export type PublicCoverFrame = Omit<CoverTransition, "type">;

function coverDirection(value: unknown): PublicCoverFrame["direction"] {
  return value === "left" || value === "top" || value === "bottom" ? value : "right";
}

export function publicCoverFrame(element: ExcalidrawElement | null): PublicCoverFrame | null {
  if (!element) return null;
  const polygon = element.type === "line" ? coverPolygonBounds(element.points) : null;
  return {
    x: element.x + (polygon?.x ?? 0), y: element.y + (polygon?.y ?? 0), width: element.width, height: element.height, angle: element.angle,
    direction: coverDirection(element.customData?.coverEdge),
    ...(element.type === "ellipse" || element.type === "diamond" ? { shape: element.type } : {}),
    ...(element.type === "line" ? { shape: "polygon" as const, points: polygon!.points } : {}),
    ...(element.type === "rectangle" && element.roundness ? { roundness: {
      type: element.roundness.type,
      ...(element.roundness.value === undefined ? {} : { value: element.roundness.value }),
    } } : {}),
    ...(element.strokeWidth !== 1 ? { strokeWidth: element.strokeWidth } : {}),
  };
}

export function publicCoverTransition(
  previous: PublicCoverFrame | null,
  current: PublicCoverFrame | null,
): CoverTransition | undefined {
  if (!previous && current) return { type: "cover", ...current };
  if (previous && !current) return { type: "reveal", ...previous };
  return undefined;
}

/** Host-local identities distinguish individual cover toggles without exposing
 * source IDs. Moves/resizes and multi-cover replacements are not toggle wipes. */
export function publicCoverChanges(previous: ReadonlyMap<string, PublicCoverFrame>, current: ReadonlyMap<string, PublicCoverFrame>): CoverTransition | undefined {
  const added = [...current].filter(([id]) => !previous.has(id));
  const removed = [...previous].filter(([id]) => !current.has(id));
  if (added.length === 1 && removed.length === 0) return publicCoverTransition(null, added[0][1]);
  if (removed.length === 1 && added.length === 0) return publicCoverTransition(removed[0][1], null);
  return undefined;
}

export function viewportFromState(state: {
  scrollX: number; scrollY: number; width: number; height: number; zoom: { value: number };
}): PublicViewport {
  const { scrollX, scrollY, width, height, zoom } = state;
  if (![scrollX, scrollY, width, height, zoom.value].every(Number.isFinite)
    || width <= 0 || height <= 0 || zoom.value <= 0) {
    throw new Error("Live Canvas: ungültiger Bildausschnitt.");
  }
  return { x: -scrollX, y: -scrollY, width: width / zoom.value, height: height / zoom.value };
}

export function placeholderKind(element: ExcalidrawElement): string | null {
  if (element.customData?.surfaceKind === "embedded-app") return "App";
  switch (element.customData?.materialKind) {
    case "audio": return "Audio";
    case "video": return "Video";
    case "youtube": return "YouTube";
    case "interactive-html": return "HTML";
  }
  return element.type === "iframe" || element.type === "embeddable" ? "Einbettung" : null;
}

/** Host-only plan. Never send its source elements or material names over the wire. */
export function planPublicProjection(source: readonly ExcalidrawElement[], role:"remote"|"room"="remote") {
  const elements: ExcalidrawElement[] = [];
  const unsupported: string[] = [];
  for (const element of source) {
    if (element.isDeleted || element.type === "selection") continue;
    const cover = element.customData?.role === "image-cover";
    const finite = [element.x, element.y, element.width, element.height, element.angle].every(Number.isFinite);
    const empty = element.width === 0 && element.height === 0;
    if (!finite || element.width < 0 || element.height < 0) {
      throw new Error("Live Canvas: ungültige Elementgeometrie.");
    }
    if (cover) {
      // Covers are public attention shapes, never a confidentiality boundary.
      // Reject malformed geometry rather than publish a misleading overlay.
      if (!(element.type === "rectangle" || element.type === "ellipse" || element.type === "diamond" || element.type === "line")
        || element.width <= 0 || element.height <= 0
        || (element.opacity !== 100 && !(element.type === "line" && element.opacity === 0)) || element.fillStyle !== "solid"
        || !/^#[0-9a-f]{6}$/i.test(element.backgroundColor) || element.roughness !== 0
        || ((element.type === "ellipse" || element.type === "diamond") && element.roundness !== null)
        || (element.type === "line" && (element.points.length < 5 || element.points.length > 512
          || element.strokeWidth !== 0 || element.strokeColor !== "transparent" || element.roundness !== null))) {
        throw new Error("Live Canvas: Abdeckung kann nicht sicher gerendert werden.");
      }
    } else if (empty || (element.customData?.role === "marker-ribbon"
      && (element.width === 0 || element.height === 0))) {
      continue; // Excalidraw onChange includes uncommitted, empty stroke previews.
    }
    if (element.type === "frame" || element.type === "magicframe" || element.frameId) {
      // Frames introduce another clipping boundary, outside the Surface Lab slice.
      throw new Error("Live Canvas: native Frames werden noch nicht unterstützt.");
    }
    if (element.type === "image") {
      const crop = element.crop;
      if (element.width <= 0 || element.height <= 0
        || !element.scale.every((value) => value === 1 || value === -1)
        || (crop && (!Object.values(crop).every(Number.isFinite)
          || crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0
          || crop.naturalWidth <= 0 || crop.naturalHeight <= 0
          || crop.x + crop.width > crop.naturalWidth + 0.001
          || crop.y + crop.height > crop.naturalHeight + 0.001))) {
        throw new Error("Live Canvas: ungültiger Bildausschnitt im Material.");
      }
    }
    const kind = placeholderKind(element);
    if (kind && kind !== "HTML" && !(role==="room"&&canMirrorEmbeddedApp(element))) {
      const title = element.customData?.sourceTitle;
      unsupported.push(typeof title === "string" && title.trim() ? t("{0}: {1}", kind, title) : kind);
    }
    // The host temporarily hides the technical rich-text raster while its
    // direct editor preview is visible. That local presentation state must
    // never hide the current text in the independently rendered live scene.
    elements.push(element.type === "image" && element.customData?.role === "rich-text-rendition-v1"
      ? { ...element, opacity: 100 } : element);
  }
  return { elements, unsupported: [...new Set(unsupported)] };
}

/** Opaque identities live only as long as their projector (one public generation). */
export function createPublicIds() {
  const ids = new Map<string, string>();
  const sources = new Map<string, {kind:string;sourceId:string}>();
  const publicId = (kind: string, sourceId: string) => {
    const key = `${kind}:${sourceId}`;
    let id = ids.get(key);
    if (!id) {
      id = crypto.randomUUID();
      ids.set(key, id);
      sources.set(id,{kind,sourceId});
    }
    return id;
  };
  publicId.source = (id:string) => sources.get(id) ?? null;
  return publicId;
}

/** Allowlist native rendering fields; never spread a private element or binding. */
export function sanitizePublicElements(
  elements: readonly ExcalidrawElement[],
  publicId: (kind:string,sourceId:string)=>string,
): ExcalidrawElement[] {
  const present = new Set(elements.map((element) => element.id));
  const reference = (id: string | null) => id && present.has(id) ? publicId("element", id) : null;
  const binding = (value: PointBinding | null) => {
    if (!value) return null;
    const elementId = reference(value.elementId);
    if (!elementId) return null;
    const fixedPoint = "fixedPoint" in value ? value.fixedPoint as [number, number] : null;
    return {
      elementId, focus: value.focus, gap: value.gap,
      ...(fixedPoint ? { fixedPoint: [fixedPoint[0], fixedPoint[1]] as [number, number] } : {}),
    };
  };
  return elements.map((element): ExcalidrawElement => {
    const base = {
      id: publicId("element", element.id),
      x: element.x, y: element.y, width: element.width, height: element.height,
      angle: element.angle, strokeColor: element.strokeColor, backgroundColor: element.backgroundColor,
      fillStyle: element.fillStyle, strokeWidth: element.strokeWidth, strokeStyle: element.strokeStyle,
      roundness: element.roundness ? {
        type: element.roundness.type,
        ...(element.roundness.value === undefined ? {} : { value: element.roundness.value }),
      } : null,
      roughness: element.roughness, opacity: element.opacity, seed: element.seed,
      version: element.version, versionNonce: element.versionNonce,
      index: null, isDeleted: false, updated: 0, link: null, locked: true,
      groupIds: element.groupIds.map((id) => publicId("group", id)),
      frameId: reference(element.frameId),
      boundElements: element.boundElements?.flatMap(({ id, type }) => {
        const mapped = reference(id);
        return mapped ? [{ id: mapped, type }] : [];
      }) ?? null,
    };
    switch (element.type) {
      case "rectangle": case "ellipse": case "diamond":
        return { ...base, type: element.type };
      case "text":
        return {
          ...base, type: "text", fontSize: element.fontSize, fontFamily: element.fontFamily,
          text: element.text, originalText: element.text, textAlign: element.textAlign,
          verticalAlign: element.verticalAlign, containerId: reference(element.containerId),
          autoResize: element.autoResize, lineHeight: element.lineHeight,
        };
      case "freedraw": {
        const indexes = publicLinearPointIndexes(element.points);
        return {
          ...base, type: "freedraw", points: indexes.map(index => [element.points[index][0], element.points[index][1]] as typeof element.points[number]),
          pressures: indexes.map(index => element.pressures[index] ?? element.pressures.at(-1) ?? 0.5), simulatePressure: element.simulatePressure, lastCommittedPoint: null,
        };
      }
      case "line": case "arrow": {
        const indexes = publicLinearPointIndexes(element.points);
        const line = {
          ...base, points: indexes.map(index => [element.points[index][0], element.points[index][1]] as typeof element.points[number]),
          lastCommittedPoint: null, startBinding: binding(element.startBinding), endBinding: binding(element.endBinding),
          startArrowhead: element.startArrowhead, endArrowhead: element.endArrowhead,
        };
        if (element.type === "line") return { ...line, type: "line" };
        if (!("elbowed" in element) || !element.elbowed) return { ...line, type: "arrow", elbowed: false };
        const elbow = element as ExcalidrawElbowArrowElement;
        return {
          ...line, type: "arrow", elbowed: true,
          fixedSegments: elbow.fixedSegments?.map(({ start, end, index }) => ({
            start: [start[0], start[1]], end: [end[0], end[1]], index,
          })) ?? null,
          startIsSpecial: elbow.startIsSpecial, endIsSpecial: elbow.endIsSpecial,
        } as ExcalidrawElbowArrowElement;
      }
      case "image":
        // Only called on rendered replacement images at the public boundary.
        return {
          ...base, type: "image", fileId: element.fileId, status: "saved",
          scale: [element.scale[0], element.scale[1]], crop: null,
        };
      default: throw new Error("Live Canvas: Element benötigt eine sichere Ersatzdarstellung.");
    }
  });
}

export const publicRasterMaxDimension = 4096;
export const publicRasterMaxPixels = 8_000_000;

/** Preserve available source detail even when a worksheet was placed small.
 * Crop coordinates refer to the source's recorded natural dimensions; account
 * for the actually decoded file as well. This never requests unbounded zoom. */
export function publicImageRasterScale(
  element: Pick<ExcalidrawImageElement, "width" | "height" | "crop">,
  source: { width: number; height: number }, minimumScale = 2,
) {
  const crop = element.crop;
  const width = source.width * (crop ? crop.width / crop.naturalWidth : 1);
  const height = source.height * (crop ? crop.height / crop.naturalHeight : 1);
  return Math.min(4, Math.max(minimumScale, width / element.width, height / element.height));
}

export function publicRasterDimensions(width: number, height: number, maximumScale = 2) {
  if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) {
    throw new Error("Live Canvas: ungültige Rastergröße.");
  }
  if (!Number.isFinite(maximumScale) || maximumScale <= 0 || maximumScale > 4) {
    throw new Error("Live Canvas: ungültige Rasterdichte.");
  }
  // Keep one common scale; ceil provides only transparent subpixel padding.
  const scale = Math.min(maximumScale, (publicRasterMaxDimension - 1) / width,
    (publicRasterMaxDimension - 1) / height, Math.sqrt((publicRasterMaxPixels - 8192) / (width * height)));
  const pixels = { width: Math.ceil(width * scale), height: Math.ceil(height * scale), scale };
  if (!Number.isFinite(scale) || scale <= 0 || pixels.width < 1 || pixels.height < 1
    || pixels.width > publicRasterMaxDimension || pixels.height > publicRasterMaxDimension
    || pixels.width * pixels.height > publicRasterMaxPixels) {
    throw new Error("Live Canvas: Rasterbudget überschritten.");
  }
  return pixels;
}

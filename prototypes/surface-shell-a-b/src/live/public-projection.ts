import {textBoxContent} from '../canvas/text-box-transform.ts';
import {readHtmlPageOrientation} from "../canvas/interactive-html-pages";
import { isTimerWidget, timerConfig, timerRemainingMs, type TimerState, type TimerWidget } from "../widgets/timer.ts";
import type { ExcalidrawElement, ExcalidrawImageElement, FileId } from "@excalidraw/excalidraw/element/types";
import type { BinaryFiles, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { createInteractiveMaterialSource, type LiveMaterialBundle, type LiveMaterialStateChange } from "../canvas/interactive-html-live";
import { imageAnnotationGroupId } from "../canvas/image-annotation-selection";
import { isErasableInk, withoutTemporaryEraserState } from "../canvas/eraser-policy";
import { imageCoverBelongsTo } from "../canvas/image-cover";
import { LIMITS, parseClientMessage, parseViewport, sanitizeElement, type CoverTransition, type JsonValue, type LiveMaterialAccess, type PublicElement } from "../../../../shared/live-canvas/protocol";
import {
  createPublicIds, placeholderKind, planPublicProjection, publicCoverFrame, publicCoverChanges, publicRasterDimensions, publicImageRasterScale,
  publicLinearPointIndexes, sanitizePublicElements, viewportFromState,
} from "./public-projection-plan";
import type { PublicCoverFrame, PublicViewport } from "./public-projection-plan";
import type { RoomObject } from './room-object-edit';
import {isIndependentMaterialAnnotation} from '../canvas/annotation-move';

export type { PublicViewport } from "./public-projection-plan";
export type PublicProjection = {
  elements: ExcalidrawElement[];
  assets: { id: string; blob: Blob }[];
  assetIds: string[];
  viewport: PublicViewport;
  background: string;
  coverTransition?: CoverTransition;
  materials: import("../canvas/interactive-html-live").RoomInteractiveMaterial[];
  materialBundles: LiveMaterialBundle[];
  /** Local host disclosure only. Do not include this field in a public snapshot. */
  unsupported: string[];
  /** Host-private lookup for Room editing; never publish through Remote Canvas. */
  roomObjects?:RoomObject[];
  roomTimers?:Pick<TimerWidget, "id" | "x" | "y" | "width" | "height" | "angle" | "version">[];
};

/** Camera-only updates do not render or serialize content. Coordinates are scene units. */
export function getPublicViewport(api: ExcalidrawImperativeAPI): PublicViewport {
  return parseViewport(viewportFromState(api.getAppState()));
}

type Raster = { image: ExcalidrawImageElement; asset: { id: string; blob: Blob } };
type CachedRaster = { signature: string; files: BinaryFiles; raster: Promise<Raster> };

// Counters describe editor history, not pixels. Geometry, crop, paint, ordering
// and seeds remain in the exact cache key (no lossy hashes).
const pixelSignature = (elements: ExcalidrawElement[]) => JSON.stringify(elements.map(
  ({ version: _version, versionNonce: _nonce, ...element }) => element,
));

function sameFiles(left: BinaryFiles, right: BinaryFiles) {
  const ids = Object.keys(left);
  return ids.length === Object.keys(right).length && ids.every((id) => {
    const a = left[id];
    const b = right[id];
    return b && a.dataURL === b.dataURL && a.mimeType === b.mimeType && a.version === b.version;
  });
}

/**
 * One instance per public generation. Drop it on a confirmed lesson/session switch.
 * Rejections are intentional: retain the last safe publication, never send source data.
 * All returned assets are required by this snapshot (the host may deduplicate uploads).
 */
export function createPublicProjector(onMaterialChange: (change:LiveMaterialStateChange) => void = () => {}, accessFor: (elementId:string) => LiveMaterialAccess = () => ({mode:"locked",participantIds:[]}), projectionRole:'remote'|'room'='remote', timerState: (id:string)=>TimerState|undefined = ()=>undefined): {
  project(api: ExcalidrawImperativeAPI, materialId?: string): Promise<PublicProjection>;
  projectInk(element:ExcalidrawElement):PublicElement;
  sampleTimers?(elements:PublicElement[]):PublicElement[];
  applyMaterialState(instanceId:string,state:JsonValue):boolean;
  stop(): void;
} {
  const publicId = createPublicIds();
  const cache = new Map<string, CachedRaster>();
  const decodedSources = new Map<string, { dataURL: string; dimensions: Promise<{ width: number; height: number }> }>();
  let previousCovers: Map<string, PublicCoverFrame> | undefined;
  const html = createInteractiveMaterialSource(onMaterialChange,accessFor,projectionRole);

  return {
    stop: () => {
      html.stop();
      cache.clear(); decodedSources.clear(); previousCovers = undefined;
    },
    sampleTimers: elements => elements.map(element => {
      if(!element.timer)return element;
      const origin=publicId.source(element.id);
      const state=origin?.kind==='element'?timerState(origin.sourceId):undefined;
      return state?{...element,timer:{durationSeconds:state.durationSeconds,remainingMs:timerRemainingMs(state),status:state.status,revision:state.revision}}:element;
    }),
    projectInk: (element) => sanitizeElement(sanitizePublicElements([element],publicId)[0]),
    applyMaterialState: (instanceId,state) => html.apply(instanceId,state),
    async project(api, materialId) {
      // Capture one immutable native snapshot before the first await. Camera changes
      // during export are separate messages; they must not mix content generations.
      const source = withoutTemporaryEraserState(api.getSceneElements());
      const material = materialId ? source.find(element => element.id === materialId && !element.isDeleted) : null;
      if (materialId && !material) throw new Error("Das gezeigte Material ist nicht mehr auf der Fläche.");
      const groupId = material ? imageAnnotationGroupId(material.id) : null;
      const selected = material ? source.filter(element => element.id === material.id
        || element.groupIds.includes(groupId!) || imageCoverBelongsTo(element,material.id)) : source;
      const plan = planPublicProjection(selected,projectionRole);
      // Room's local media layer renders the selected player, cover and
      // annotations from the same source snapshot. Keep the public canvas
      // empty here so no placeholder or duplicate ink obscures the player.
      if (projectionRole === 'room' && material
        && ['audio', 'video', 'youtube'].includes(String(material.customData?.materialKind))) plan.elements = [];
      const currentCovers = new Map(plan.elements.filter(element => element.customData?.role === "image-cover")
        .map(element => [element.id, publicCoverFrame(element)!]));
      const coverTransition = previousCovers === undefined
        ? undefined
        : publicCoverChanges(previousCovers, currentCovers);
      plan.elements = structuredClone(plan.elements).map(element => {
        if (!("points" in element) || element.points.length <= LIMITS.points) return element;
        const indexes=publicLinearPointIndexes(element.points);
        if(element.type==="freedraw")return {...element,
          points:indexes.map(index=>element.points[index]),pressures:indexes.map(index=>element.pressures[index]??element.pressures.at(-1)??0.5)} as ExcalidrawElement;
        return {...element,points:indexes.map(index=>element.points[index])} as ExcalidrawElement;
      });
      if (plan.elements.length > LIMITS.elements || plan.elements.some((element) =>
        "points" in element && element.points.length > LIMITS.points)) {
        throw new Error("Live Canvas: zu viele Elemente oder Strichpunkte für die öffentliche Projektion.");
      }
      const state = api.getAppState();
      const viewport = parseViewport(viewportFromState(state));
      const background = state.viewBackgroundColor;
      const sourceFiles = api.getFiles();
      const files: BinaryFiles = {};
      for (const element of plan.elements) {
        if (element.type !== "image" || placeholderKind(element)) continue;
        const file = element.fileId && sourceFiles[element.fileId];
        if (!file || element.status === "error" || !file.dataURL.startsWith("data:image/")) {
          throw new Error("Live Canvas: Bildmaterial ist noch nicht verfügbar.");
        }
        files[element.fileId!] = { ...file };
      }
      const { convertToExcalidrawElements, exportToBlob, getCommonBounds } = await import("@excalidraw/excalidraw");
      const htmlProjection = await html.read(plan.elements,id=>publicId('element',id));
      const usedCacheKeys = new Set<string>();
      const usedSourceIds = new Set<string>();
      const assets: PublicProjection["assets"] = [];

      const decodeSource = (id: string) => {
        usedSourceIds.add(id);
        const file = files[id];
        const existing = decodedSources.get(id);
        if (existing?.dataURL === file.dataURL) return existing.dimensions;
        const image = new Image(); image.src = file.dataURL;
        const entry = { dataURL: file.dataURL, dimensions: image.decode().then(() => {
          if (!image.naturalWidth || !image.naturalHeight) throw new Error("Leeres Bildmaterial.");
          // Retain dimensions, not an additional decoded full-resolution bitmap.
          return { width: image.naturalWidth, height: image.naturalHeight };
        }).catch(() => {
          if (decodedSources.get(id) === entry) decodedSources.delete(id);
          throw new Error("Live Canvas: Bildmaterial konnte nicht dekodiert werden.");
        }) };
        decodedSources.set(id, entry);
        return entry.dimensions;
      };
      const sourceDensity = async (elements: ExcalidrawElement[], minimumScale = 2) => {
        let scale = minimumScale;
        for (const element of elements) {
          if (element.type !== "image" || !element.fileId) continue;
          const dimensions = await decodeSource(element.fileId);
          scale = Math.max(scale, publicImageRasterScale(element, dimensions, minimumScale));
        }
        return scale;
      };

      const sourceMap = new Map(plan.elements.map((element) => [element.id, element]));
      plan.elements = plan.elements.map((element) => {
        if (element.type !== "text" || !element.containerId
          || sourceMap.get(element.containerId)?.type !== "arrow") return element;
        // Arrow labels can have stale stored x/y: the engine derives their visible
        // center from the arrow. Resolve that center natively before a prefix split
        // can remove the container. Rotation and text dimensions stay unchanged.
        const [left, top, right, bottom] = getCommonBounds([element], sourceMap);
        return { ...element, x: (left + right - element.width) / 2, y: (top + bottom - element.height) / 2 };
      });

      const prepared = plan.elements.flatMap((element) => {
        if (element.customData?.materialKind === "interactive-html" || htmlProjection.projectedElementIds.has(element.id)
          || isTimerWidget(element)) return [];
        const kind = placeholderKind(element);
        if (!kind) return [element];
        const fontSize = Math.min(20, element.height / 4, element.width / (kind.length + 3));
        const replacements = convertToExcalidrawElements([{
          type: "rectangle", id: element.id, x: element.x, y: element.y,
          width: element.width, height: element.height, angle: element.angle,
          backgroundColor: "#eef0f3", strokeColor: "#697383", fillStyle: "solid",
          strokeWidth: 1, roughness: 0, roundness: null,
          label: { text: kind, fontSize, fontFamily: 2, strokeColor: "#303844" },
        }], { regenerateIds: false });
        // Native conversion supplies correctly positioned/rotated bound text.
        return replacements.map((replacement) => ({
          ...replacement, version: element.version, versionNonce: element.versionNonce,
          seed: element.seed, updated: 0,
          ...(replacement.type === "text" ? { id: publicId("placeholder-label", element.id) } : {}),
          boundElements: replacement.type === "rectangle"
            ? [{ id: publicId("placeholder-label", element.id), type: "text" as const }] : replacement.boundElements,
        }));
      });
      if (prepared.length > LIMITS.elements
        || prepared.filter((element) => element.type === "image").length > LIMITS.assets) {
        throw new Error("Live Canvas: zu viele öffentliche Elemente oder Bilddateien.");
      }

      const render = async (key: string, elements: ExcalidrawElement[], maximumScale = 2): Promise<Raster> => {
        usedCacheKeys.add(key);
        // Even the local renderer sees only display text, never originalText/link
        // targets or private customData. Crop remains local until it is baked.
        const clean = sanitizePublicElements(elements, (_kind, id) => id);
        elements = clean.map((element, index) => element.type === "image" ? {
          ...element, crop: (elements[index] as ExcalidrawImageElement).crop,
        } : element);
        const renderFiles: BinaryFiles = {};
        for (const element of elements) {
          if (element.type === "image" && element.fileId) renderFiles[element.fileId] = files[element.fileId];
        }
        // Include actual crop/geometry/ordering, not just versions: running marker
        // updates and restored scenes need not always bump all native counters.
        // An independent image keeps the same baked pixels when translated.
        const translation = elements.length === 1 && elements[0].type === "image"
          ? { x: elements[0].x, y: elements[0].y } : { x: 0, y: 0 };
        if (translation.x || translation.y) {
          elements = elements.map(element => ({ ...element, x: 0, y: 0 }));
        }
        const signature = pixelSignature(elements) + JSON.stringify(maximumScale);
        const placed = (raster: Raster): Raster => translation.x || translation.y
          ? { ...raster, image: { ...raster.image, x: raster.image.x + translation.x, y: raster.image.y + translation.y } } : raster;
        const existing = cache.get(key);
        if (existing?.signature === signature && sameFiles(existing.files, renderFiles)) return placed(await existing.raster);
        const entry: CachedRaster = {
          signature, files: renderFiles,
          raster: (async () => {
            // Excalidraw silently draws its missing-image glyph on decode failure.
            // Verify locally before export so a failed/missing asset is never cached.
            for (const id of Object.keys(renderFiles)) await decodeSource(id);
            const [minX, minY, maxX, maxY] = getCommonBounds(elements);
            const padding = 8 + Math.max(0, ...elements.map((element) => element.strokeWidth * 2));
            const expectedSize = publicRasterDimensions(maxX - minX + padding * 2, maxY - minY + padding * 2, maximumScale);
            let dimensions: ReturnType<typeof publicRasterDimensions> | undefined;
            const options = {
              elements, files: renderFiles, exportPadding: padding, mimeType: "image/png",
              appState: {
                exportBackground: false, exportEmbedScene: false, exportWithDarkMode: false,
                // The native renderer also uses exportScale for internal scratch
                // canvases (notably bound arrow text), so bound those allocations too.
                viewBackgroundColor: "#ffffff", exportScale: expectedSize.scale,
              },
              getDimensions(width: number, height: number) {
                dimensions = publicRasterDimensions(width, height, maximumScale);
                return dimensions;
              },
            };
            /* Covers are public attention overlays. Only the source image crop is
             * rasterized; moving a cover must never rebuild these image bytes. */
            const blob = await exportToBlob(options);
            if (!dimensions || blob.type !== "image/png" || !blob.size || blob.size > LIMITS.assetBytes
              || ![minX, minY, maxX, maxY].every(Number.isFinite)) {
              throw new Error("Live Canvas: sichere Bildprojektion fehlgeschlagen.");
            }
            // Identical cropped image pixels share an opaque, generation-local
            // ID. This avoids duplicate downloads and native textures, without
            // hashing any private source identity.
            const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", await blob.arrayBuffer()));
            const id = publicId("asset-bytes", Array.from(digest, byte => byte.toString(16).padStart(2, "0")).join(""));
            const [image] = convertToExcalidrawElements([{
              type: "image", id: publicId("raster", key), fileId: id as FileId,
              x: minX - padding, y: minY - padding,
              width: dimensions.width / dimensions.scale, height: dimensions.height / dimensions.scale,
              scale: [1, 1], crop: null, status: "saved",
            }], { regenerateIds: false });
            return { image: { ...image, seed: 1, version: 1, versionNonce: 0 } as ExcalidrawImageElement, asset: { id, blob } };
          })(),
        };
        cache.set(key, entry);
        try { return placed(await entry.raster); } catch {
          if (cache.get(key) === entry) cache.delete(key);
          // Do not expose decoder/exporter messages containing a local path or URL.
          throw new Error("Live Canvas: sichere Rasterprojektion fehlgeschlagen; Freigabe wurde nicht aktualisiert.");
        }
      };

      const output: ExcalidrawElement[] = [];
      for (const element of prepared) {
        if (element.type === "image") {
          const raster = await render(`image:${element.id}`, [element], await sourceDensity([element]));
          output.push(raster.image);
          assets.push(raster.asset);
        } else {
          output.push(element);
        }
      }
      for (const key of cache.keys()) if (!usedCacheKeys.has(key)) cache.delete(key);
      for (const id of decodedSources.keys()) if (!usedSourceIds.has(id)) decodedSources.delete(id);
      const elements = sanitizePublicElements(output, publicId);
      if (projectionRole === 'remote') for (const element of selected.filter(isTimerWidget)) {
        const config = timerConfig(element)!;
        const state = timerState(element.id);
        const timer = { durationSeconds: config.durationSeconds, remainingMs: state ? timerRemainingMs(state) : config.durationSeconds * 1000,
          status: state?.status ?? 'ready' as const, revision: state?.revision ?? 1 };
        elements.push({ id: publicId('element', element.id), type:'rectangle', x:element.x,y:element.y,width:element.width,height:element.height,
          angle:element.angle,backgroundColor:'transparent',strokeColor:'transparent',timer } as unknown as ExcalidrawElement);
      }

      const renderedIds=new Map<string,string[]>();
      const roomObjects:RoomObject[]=projectionRole==='room'
        ? elements.flatMap(element=>{
          const origin=publicId.source(element.id);
          const raster=origin?.kind==='element'?publicId.source(origin.sourceId):null;
          const sourceId=raster?.kind==='raster'&&raster.sourceId.startsWith('image:')
            ?raster.sourceId.slice(6):origin?.kind==='element'?origin.sourceId:null;
          const native=sourceId&&source.find(candidate=>candidate.id===sourceId&&!candidate.isDeleted);
          if(native)renderedIds.set(native.id,[...(renderedIds.get(native.id)??[]),element.id]);
          return native&&native.customData?.role!=='rich-text-rendition-v1'
            &&native.customData?.role!=='image-cover'?[{id:element.id,sourceId:native.id,version:native.version,type:native.type,
            x:native.x,y:native.y,width:native.width,height:native.height,angle:native.angle,
            erasable:isErasableInk(native),markerRibbon:native.customData?.role==='marker-ribbon'}]:[];
        }):[];
      if(projectionRole==='room')for(const material of htmlProjection.materials){
        const native=material.roomLocalId&&source.find(candidate=>candidate.id===material.roomLocalId&&!candidate.isDeleted);
        if(native&&!roomObjects.some(object=>object.sourceId===native.id))roomObjects.push({
          id:publicId('room-edit',native.id),sourceId:native.id,version:native.version,type:native.type,
          x:native.x,y:native.y,width:native.width,height:native.height,angle:native.angle,erasable:false,pageOrientation:readHtmlPageOrientation(native.customData?.interactiveHtmlPageOrientation),
        });
      }
      if(projectionRole==='room')for(const candidate of selected){
        if((!candidate.customData?.materialKind && !isTimerWidget(candidate))||roomObjects.some(object=>object.sourceId===candidate.id))continue;
        roomObjects.push({id:publicId('room-edit',candidate.id),sourceId:candidate.id,version:candidate.version,type:candidate.type,
          x:candidate.x,y:candidate.y,width:candidate.width,height:candidate.height,angle:candidate.angle,erasable:false});
      }
      if(projectionRole==='room'){
        // HTML annotations are omitted from the native public drawing because
        // its iframe projects them. They still need the same local edit target.
        for(const native of selected.filter(element=>!element.isDeleted&&isIndependentMaterialAnnotation(element))){
          let object=roomObjects.find(item=>item.sourceId===native.id);
          if(!object){
            object={id:publicId('element',native.id),sourceId:native.id,version:native.version,type:native.type,
              x:native.x,y:native.y,width:native.width,height:native.height,angle:native.angle,erasable:isErasableInk(native)};
            roomObjects.push(object);
          }
          const owner=selected.find(element=>element.customData?.materialKind==='interactive-html'
            &&native.groupIds.includes(imageAnnotationGroupId(element.id)));
          object.annotation={...(owner?{materialId:owner.id}:{}),
            ...(owner&&native.customData?.interactiveHtmlScrollAnchor?{scrollAnchor:native.customData.interactiveHtmlScrollAnchor as {x:number;y:number}}:{})};
          object.renderElement=sanitizeElement(sanitizePublicElements([native],publicId)[0]);
          object.markerRibbon=native.customData?.role==='marker-ribbon';
          if('points' in native)object.path=object.renderElement.points;
          object.strokeWidth=native.strokeWidth;
          if(native.type==='text'){
            object.textContent=textBoxContent(native);
            object.renderElementIds=[...(renderedIds.get(native.id)??[]),...selected
              .filter(item=>item.customData?.role==='rich-text-rendition-v1'&&item.customData.richTextSourceId===native.id)
              .flatMap(item=>renderedIds.get(item.id)??[])];
          }
        }
        for(const object of roomObjects)object.locked=Boolean(selected.find(element=>element.id===object.sourceId)?.locked);
        const order=new Map(selected.map((candidate,index)=>[candidate.id,index]));
        roomObjects.sort((left,right)=>(order.get(left.sourceId)??-1)-(order.get(right.sourceId)??-1));
      }
      const distinctAssets = [...new Map(assets.map(asset => [asset.id, asset])).values()];
      const assetIds = distinctAssets.map((asset) => asset.id);
      // Validate before the host uploads anything. Leave room for the transport
      // envelope plus diff order/removal lists, including a maximally sized prior scene.
      if (projectionRole === 'remote') {
        const message = parseClientMessage({
          type: "publish", replace: true, generation: 1, revision: 1,
          elements: elements.map(sanitizeElement), assetIds, viewport, background, materials:htmlProjection.materials,
        });
        const bytes = new TextEncoder().encode(JSON.stringify(message)).byteLength;
        const diffReserve = (elements.length + LIMITS.elements) * 40 + 1024;
        if (bytes + diffReserve > LIMITS.messageBytes
          || distinctAssets.reduce((sum, asset) => sum + asset.blob.size, 0) > LIMITS.roomAssetBytes) {
          throw new Error("Live Canvas: öffentliche Projektion überschreitet das Übertragungsbudget.");
        }
      }
      previousCovers = currentCovers;
      return {
        elements, assets: distinctAssets, assetIds, viewport, background, unsupported: plan.unsupported,
        materials:htmlProjection.materials, materialBundles:htmlProjection.bundles,
        ...(projectionRole==='room'?{roomObjects,roomTimers:roomObjects.filter(object=>source.some(element=>element.id===object.sourceId&&isTimerWidget(element)))
          .map(({id,x,y,width,height,angle,version})=>({id,x,y,width,height,angle,version}))}:{}),
        ...(coverTransition ? { coverTransition } : {}),
      };
    },
  };
}

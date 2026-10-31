/** Live Canvas v1. Portable ESM: Node 24 type stripping and Vite; no engine imports. */
export const PROTOCOL_VERSION = 1 as const;
export const LIMITS = {
  messageBytes: 4 * 1024 * 1024, assetBytes: 12 * 1024 * 1024,
  inlineRasterBytes: 128 * 1024,
  elements: 10000, points: 20000, assets: 256, coordinate: 1_000_000,
  roomAssetBytes: 128 * 1024 * 1024, totalAssetBytes: 512 * 1024 * 1024,
  rooms: 32, participants: 100, sockets: 512, nameLength: 80,
  roomLifetimeMs: 8 * 60 * 60 * 1000, hostGraceMs: 2 * 60 * 1000,
  authTimeoutMs: 5000,
  interactiveStateBytes: 64 * 1024, interactivePackageFiles: 256,
  interactivePackageBytes: 64 * 1024 * 1024,
} as const;
export type RoomState = 'idle' | 'waiting' | 'live' | 'ended';
export type Viewport = { x: number; y: number; width: number; height: number };
export type LiveClip = Viewport & { id: string };
export type Presentation = { revision: number; mode: 'free' | 'clip'; clip: LiveClip | null; reset: number };
export const defaultPresentation: Presentation = { revision: 0, mode: 'free', clip: null, reset: 0 };
export type PresentationMessage = { type: 'presentation'; generation: number; presentation: Presentation };
export type CoverTransition = {
  type: 'cover' | 'reveal'; direction: 'left' | 'right' | 'top' | 'bottom';
  x: number; y: number; width: number; height: number; angle: number;
  shape?: 'rectangle' | 'ellipse' | 'diamond' | 'polygon';
  points?: [number, number][];
  roundness?: { type: 1 | 2 | 3; value?: number } | null;
  strokeWidth?: number;
};
export type PublicElementType = 'rectangle' | 'ellipse' | 'diamond' | 'line' | 'arrow' | 'freedraw' | 'text' | 'image';
/** Explicit rendering allowlist. fileId is a room asset ID. No customData, link,
 * crop, originalText, source, history, frames or embedded content is transmitted.
 * Host must bake image crop into raster bytes before upload. Covers are opaque
 * public basic shapes for attention control, not a confidentiality boundary. */
export type PublicTimer = { durationSeconds: number; remainingMs: number; status: 'ready' | 'running' | 'paused' | 'finished'; revision: number; observedAt?: number };
export type PublicElement = {
  timer?: PublicTimer;
  id: string; type: PublicElementType; x: number; y: number; width: number; height: number;
  angle?: number; strokeColor?: string; backgroundColor?: string;
  fillStyle?: 'solid' | 'hachure' | 'cross-hatch'; strokeWidth?: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted'; roughness?: number; opacity?: number;
  seed?: number; version?: number; versionNonce?: number;
  roundness?: { type: 1 | 2 | 3; value?: number } | null;
  groupIds?: string[]; boundElements?: { id: string; type: 'text' | 'arrow' }[] | null;
  points?: [number, number][]; pressures?: number[]; simulatePressure?: boolean;
  lastCommittedPoint?: [number, number] | null;
  startArrowhead?: 'arrow' | 'bar' | 'dot' | 'triangle' | null;
  endArrowhead?: 'arrow' | 'bar' | 'dot' | 'triangle' | null;
  text?: string; fontSize?: number; fontFamily?: number; lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right'; verticalAlign?: 'top' | 'middle' | 'bottom';
  containerId?: string | null; autoResize?: boolean;
  fileId?: string; scale?: [number, number]; status?: 'saved';
};
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export type LiveMaterialAccess = {
  mode: 'locked' | 'all' | 'participants';
  participantIds: string[];
};
export type LiveMaterialCover = { x: number; y: number; width: number; height: number };
export type LiveMaterialStroke = {
  kind: 'stroke'; x: number; y: number; width: number; height: number; angle: number;
  opacity: number; strokeColor: string; strokeWidth: number; points: [number, number][];
  fillColor?: string;
};
export type LiveMaterialText = {
  kind: 'text'; x: number; y: number; width: number; height: number; angle: number;
  opacity: number; color: string; fontSize: number; lineHeight: number;
  text: string; textAlign: 'left' | 'center' | 'right';
};
export type LiveMaterialAnnotation = LiveMaterialStroke | LiveMaterialText;
export type LiveInteractiveMaterial = {
  instanceId: string; bundleId: string; entry: string; title: string;
  x: number; y: number; width: number; height: number; angle: number;
  stateRevision: number; state: JsonValue; access: LiveMaterialAccess;
  cover?: LiveMaterialCover; annotations?: LiveMaterialAnnotation[];
};
export type CreateRoomResponse = { roomId: string; hostToken: string; inviteId: string };
export type JoinRequest = { inviteId: string; name: string; resumeToken?: string; resumeRoomId?: string };
export type JoinResponse = { roomId: string; participantId: string; token: string; name: string; meeting?: boolean };
export type Scene = {
  /** Service clock, attached only to outbound snapshots/diffs. */
  serverTime?: number;
  generation: number; revision: number; elements: PublicElement[]; presentation?: Presentation;
  assetIds: string[]; viewport: Viewport; background: string; coverTransition?: CoverTransition;
  materials?: LiveInteractiveMaterial[];
  /** Optional transport attachment, not stored in the room's canonical scene. */
  rasters?: InlineRaster[];
};
export type InlineRaster = { id: string; data: string };
export type AuthMessage = { type: 'auth'; roomId: string; token: string; protocolVersion?: 1; supportsDiff?: boolean; supportsInlineRasters?: boolean; supportsPresentation?: boolean; supportsClipMotion?: boolean; supportsViewportClips?: boolean; supportsInteractiveMaterials?: boolean; supportsPatches?: boolean; supportsFreePresentation?: boolean; supportsTimerWidgets?: boolean };
/** replace=true: full scene; generation must increase for a source switch.
 * replace=false: elements are upserts; baseRevision must match; order lists ALL
 * resulting IDs once. assetIds is always the complete resulting asset set. */
export type PublishMessage = Scene & { type: 'publish'; replace: boolean; baseRevision?: number; removed?: string[]; order?: string[] };
export type CameraMessage = { type: 'camera'; generation: number; revision: number; viewport: Viewport };
export type LaserStyle = 'comet' | 'ribbon' | 'spark';
export type HostPointer = { x: number; y: number; tool: 'laser' | 'hand' | 'selection' | 'pen' | 'marker' | 'eraser' | 'text' | 'shape'; color: string; pressed: boolean; style?: LaserStyle };
/** Ephemeral scene coordinates, never part of a snapshot, asset or archive. */
export type PointerMessage = { type: 'pointer'; generation: number; pointer: HostPointer | null };
export type PatchEnvelope = { type: 'patch'; generation: number; id: string; baseRevision: number; revision: number };
export type MaterialStatePatch = PatchEnvelope & { channel: 'material'; state: JsonValue };
export type InkPreviewPatch = PatchEnvelope & ({
  channel: 'ink'; operation: 'upsert'; pointStart: number; pointDeleteCount: number; element: PublicElement;
} | {
  channel: 'ink'; operation: 'end' | 'cancel';
});
export type PatchMessage = MaterialStatePatch | InkPreviewPatch;
export type HostMessage = PresentationMessage | PublishMessage | CameraMessage | PointerMessage | PatchMessage | { type: 'availability'; available: boolean } | { type: 'start' } | { type: 'kick'; participantId: string } | { type: 'end' } | { type: 'ping' };
export type MaterialActionMessage = { type: 'materialAction'; generation: number; instanceId: string; baseStateRevision: number; state: JsonValue };
export type ViewerMessage = { type: 'ping' } | { type: 'resync' } | { type: 'leave' } | MaterialActionMessage;
export type ClientMessage = AuthMessage | HostMessage | ViewerMessage;
export type Participant = { id: string; name: string; connected: boolean };
export type RoomMessage = {
  type: 'room'; state: RoomState; participants: Participant[]; hostConnected: boolean; publicationReady: boolean;
  generation: number; revision: number; expiresAt: number; protocolVersion: 1;
  supportsPresentation?: boolean; presentation?: Presentation; presentationGeneration?: number;
  supportsClipMotion?: boolean;
  supportsViewportClips?: boolean;
  supportsInteractiveMaterials?: boolean;
  supportsPatches?: boolean;
  supportsTimerWidgets?: boolean;
  supportsFreePresentation?: boolean;
  supportsHostPointer?: boolean; supportsLaserPointer?: boolean;
  supportsInlineRasters?: boolean;
};
export type ErrorCode = 'invalid_message' | 'unauthorized' | 'forbidden' | 'not_found' | 'participation_expired' | 'conflict' | 'missing_assets' | 'not_ready' | 'rate_limited' | 'capacity' | 'too_large' | 'unsupported_media' | 'version_mismatch' | 'internal_error';
export type ServerMessage = PresentationMessage | RoomMessage | (Scene & { type: 'snapshot' })
  | { type: 'published'; generation: number; revision: number }
  | (Scene & { type: 'diff'; baseRevision: number; removed: string[]; order: string[] })
  | CameraMessage | PointerMessage | PatchMessage | { type: 'status'; state: RoomState; hostConnected: boolean; publicationReady: boolean }
  | (MaterialActionMessage & { participantId: string })
  | { type: 'removed' } | { type: 'ended' } | { type: 'left' } | { type: 'pong' }
  | { type: 'error'; code: ErrorCode };
export type ApiError = { error: ErrorCode };

export class ProtocolError extends Error {
  code: ErrorCode;
  constructor(code: ErrorCode = 'invalid_message') { super(code); this.code = code; }
}

/** Reconstruct one exact transient ink element from an ordered point-range
 * patch. This helper is shared by service and viewer so validation and display
 * cannot drift. Canonical scene commits remain normal publish messages. */
export function applyInkPreviewPatch(
  current: { revision: number; element: PublicElement } | undefined,
  patch: InkPreviewPatch,
): { revision: number; element: PublicElement } | null {
  if (patch.operation !== 'upsert') {
    if (!current || patch.baseRevision !== current.revision) throw new ProtocolError('conflict');
    return null;
  }
  if (current ? patch.baseRevision !== current.revision : patch.baseRevision !== 0) throw new ProtocolError('conflict');
  const previous = current?.element;
  if (previous && (previous.id !== patch.element.id || previous.type !== patch.element.type)) throw new ProtocolError('conflict');
  const beforePoints = previous?.points ?? [];
  if (patch.pointStart > beforePoints.length || patch.pointStart + patch.pointDeleteCount > beforePoints.length
    || (!previous && (patch.pointStart !== 0 || patch.pointDeleteCount !== 0))) throw new ProtocolError('conflict');
  const points = [...beforePoints.slice(0, patch.pointStart), ...(patch.element.points ?? []),
    ...beforePoints.slice(patch.pointStart + patch.pointDeleteCount)];
  if (points.length > LIMITS.points) throw new ProtocolError('too_large');
  let pressures: number[] | undefined;
  if (patch.element.pressures !== undefined) {
    const beforePressures = previous?.pressures ?? [];
    if (patch.pointStart + patch.pointDeleteCount > beforePressures.length) throw new ProtocolError('conflict');
    pressures = [...beforePressures.slice(0, patch.pointStart), ...patch.element.pressures,
      ...beforePressures.slice(patch.pointStart + patch.pointDeleteCount)];
    if (pressures.length !== points.length) throw new ProtocolError('conflict');
  } else if (previous?.pressures !== undefined) throw new ProtocolError('conflict');
  return { revision: patch.revision, element: { ...patch.element, points, ...(pressures ? { pressures } : {}) } };
}
function check(value: unknown): asserts value { if (!value) throw new ProtocolError(); }
function record(value: unknown): Record<string, unknown> {
  check(value !== null && typeof value === 'object' && !Array.isArray(value));
  return value as Record<string, unknown>;
}
export function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}
function id(value: unknown): string { check(validId(value)); return value; }
function number(value: unknown, min: number = -LIMITS.coordinate, max: number = LIMITS.coordinate): number {
  check(typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max); return value;
}
function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = number(value, min, max); check(Number.isSafeInteger(n)); return n;
}
function bool(value: unknown): boolean { check(typeof value === 'boolean'); return value; }
function enumeration<const T extends string>(value: unknown, values: readonly T[]): T {
  check(typeof value === 'string' && values.includes(value as T)); return value as T;
}
function ids(value: unknown, max: number): string[] {
  check(Array.isArray(value) && value.length <= max); const result = value.map(id);
  check(new Set(result).size === result.length); return result;
}
function color(value: unknown): string {
  check(typeof value === 'string' && /^(#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|transparent|black|white)$/.test(value)); return value;
}
function jsonValue(value: unknown, depth = 0): JsonValue {
  check(depth <= 20);
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
  if (typeof value === 'number') { check(Number.isFinite(value)); return value; }
  if (Array.isArray(value)) { check(value.length <= 4096); return value.map(item => jsonValue(item, depth + 1)); }
  const input = record(value); const output: Record<string, JsonValue> = {};
  const entries = Object.entries(input); check(entries.length <= 4096);
  for (const [key, item] of entries) { check(key.length <= 256); output[key] = jsonValue(item, depth + 1); }
  return output;
}
function parseMaterialAccess(value: unknown): LiveMaterialAccess {
  const v = record(value), mode = enumeration(v.mode, ['locked','all','participants']);
  const participantIds = ids(v.participantIds ?? [], LIMITS.participants);
  check(mode === 'participants' || participantIds.length === 0);
  return { mode, participantIds };
}
function parseInteractiveMaterial(value: unknown): LiveInteractiveMaterial {
  const v = record(value); const state = jsonValue(v.state);
  check(BufferByteLength(state) <= LIMITS.interactiveStateBytes);
  check(typeof v.entry === 'string' && v.entry.length <= 512 && !v.entry.startsWith('/')
    && !v.entry.split('/').some(segment => !segment || segment === '.' || segment === '..'));
  check(typeof v.title === 'string' && v.title.length > 0 && v.title.length <= 160);
  let cover: LiveMaterialCover | undefined;
  if (v.cover !== undefined) {
    const c = record(v.cover);
    cover = {x:number(c.x,0,1),y:number(c.y,0,1),width:number(c.width,0,1),height:number(c.height,0,1)};
    check(cover.width > 0 && cover.height > 0 && cover.x + cover.width <= 1.001 && cover.y + cover.height <= 1.001);
  }
  let annotations: LiveMaterialAnnotation[] | undefined;
  if (v.annotations !== undefined) {
    check(Array.isArray(v.annotations) && v.annotations.length <= LIMITS.elements);
    let pointCount = 0;
    annotations = v.annotations.map(value => {
      const a = record(value), kind = enumeration(a.kind,['stroke','text']);
      const common = {x:number(a.x),y:number(a.y),width:number(a.width,0),height:number(a.height,0),
        angle:number(a.angle,-1000,1000),opacity:number(a.opacity,0,1)};
      if (kind === 'stroke') {
        check(Array.isArray(a.points)); pointCount += a.points.length; check(pointCount <= LIMITS.points);
        const stroke: LiveMaterialStroke = {...common,kind,strokeColor:color(a.strokeColor),
          strokeWidth:number(a.strokeWidth,0,1000),points:a.points.map(point)};
        if (a.fillColor !== undefined) stroke.fillColor=color(a.fillColor);
        return stroke;
      }
      check(typeof a.text === 'string' && a.text.length <= 100000);
      return {...common,kind,color:color(a.color),fontSize:number(a.fontSize,1,10000),
        lineHeight:number(a.lineHeight,0.1,10),text:a.text,textAlign:enumeration(a.textAlign,['left','center','right'])};
    });
  }
  return { instanceId:id(v.instanceId), bundleId:id(v.bundleId), entry:v.entry, title:v.title,
    x:number(v.x), y:number(v.y), width:number(v.width,0.001), height:number(v.height,0.001),
    angle:number(v.angle,-1000,1000), stateRevision:integer(v.stateRevision,0), state,
    access:parseMaterialAccess(v.access),...(cover?{cover}:{}),...(annotations?.length?{annotations}:{}) };
}
function BufferByteLength(value: JsonValue): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
export function parseViewport(value: unknown): Viewport {
  const v = record(value); return { x: number(v.x), y: number(v.y), width: number(v.width, 0.001), height: number(v.height, 0.001) };
}
function parseCoverTransition(value: unknown): CoverTransition {
  const v = record(value);
  const shape = v.shape === undefined ? undefined : enumeration(v.shape, ['rectangle','ellipse','diamond','polygon']);
  const points = v.points === undefined ? undefined : (() => {
    check(shape === 'polygon' && Array.isArray(v.points) && v.points.length >= 5 && v.points.length <= 512);
    return v.points.map(point) as [number, number][];
  })();
  check(shape !== 'polygon' || points !== undefined);
  const roundness = v.roundness === undefined ? undefined : v.roundness === null
    ? null : (() => {
      const r = record(v.roundness);
      const type = integer(r.type, 1, 3) as 1 | 2 | 3;
      return { type, ...(r.value === undefined ? {} : { value: number(r.value,0,1000) }) };
    })();
  check(!roundness || shape === undefined || shape === 'rectangle');
  return {
    type: enumeration(v.type, ['cover','reveal']),
    direction: enumeration(v.direction, ['left','right','top','bottom']),
    x: number(v.x), y: number(v.y), width: number(v.width, 0.001), height: number(v.height, 0.001),
    angle: number(v.angle, -1000, 1000),
    ...(shape === undefined ? {} : { shape }),
    ...(points === undefined ? {} : { points }),
    ...(roundness === undefined ? {} : { roundness }),
    ...(v.strokeWidth === undefined ? {} : { strokeWidth: number(v.strokeWidth,0,1000) }),
  };
}
function point(value: unknown): [number, number] {
  check(Array.isArray(value) && value.length === 2); return [number(value[0]), number(value[1])];
}
export function sanitizeElement(value: unknown): PublicElement {
  const v = record(value);
  check(v.isDeleted !== true);
  const e: PublicElement = { id: id(v.id), type: enumeration(v.type, ['rectangle','ellipse','diamond','line','arrow','freedraw','text','image']), x: number(v.x), y: number(v.y), width: number(v.width, 0), height: number(v.height, 0) };
  for (const key of ['angle','strokeWidth','roughness','opacity','seed','version','versionNonce','fontSize','fontFamily','lineHeight'] as const) {
    if (v[key] === undefined) continue;
    const bounds: Record<string, [number, number]> = { angle: [-1000,1000], strokeWidth: [0,1000], roughness: [0,10], opacity: [0,100], seed: [0,2147483647], version: [0,Number.MAX_SAFE_INTEGER], versionNonce: [0,2147483647], fontSize: [1,10000], fontFamily: [1,100], lineHeight: [0.1,10] };
    e[key] = number(v[key], ...bounds[key]);
  }
  for (const key of ['strokeColor','backgroundColor'] as const) if (v[key] !== undefined) e[key] = color(v[key]);
  if (v.fillStyle !== undefined) e.fillStyle = enumeration(v.fillStyle, ['solid','hachure','cross-hatch']);
  if (v.strokeStyle !== undefined) e.strokeStyle = enumeration(v.strokeStyle, ['solid','dashed','dotted']);
  if (v.roundness !== undefined) {
    if (v.roundness === null) e.roundness = null;
    else { const r = record(v.roundness); e.roundness = { type: integer(r.type,1,3) as 1 | 2 | 3 }; if (r.value !== undefined) e.roundness.value = number(r.value,0,1000); }
  }
  if (v.groupIds !== undefined) e.groupIds = ids(v.groupIds, 100);
  if (v.boundElements !== undefined) {
    if (v.boundElements === null) e.boundElements = null;
    else { check(Array.isArray(v.boundElements) && v.boundElements.length <= 100); e.boundElements = v.boundElements.map(item => { const b = record(item); return { id: id(b.id), type: enumeration(b.type,['text','arrow']) }; }); }
  }
  if (['line','arrow','freedraw'].includes(e.type)) {
    check(Array.isArray(v.points) && v.points.length <= LIMITS.points); e.points = v.points.map(point);
    if (v.pressures !== undefined) { check(Array.isArray(v.pressures) && v.pressures.length <= LIMITS.points); e.pressures = v.pressures.map(p => number(p,0,1)); }
    if (v.simulatePressure !== undefined) e.simulatePressure = bool(v.simulatePressure);
    if (v.lastCommittedPoint !== undefined) e.lastCommittedPoint = v.lastCommittedPoint === null ? null : point(v.lastCommittedPoint);
    for (const key of ['startArrowhead','endArrowhead'] as const) if (v[key] !== undefined) e[key] = v[key] === null ? null : enumeration(v[key],['arrow','bar','dot','triangle']);
  }
  if (e.type === 'text') {
    check(typeof v.text === 'string' && v.text.length <= 100000); e.text = v.text;
    if (v.textAlign !== undefined) e.textAlign = enumeration(v.textAlign,['left','center','right']);
    if (v.verticalAlign !== undefined) e.verticalAlign = enumeration(v.verticalAlign,['top','middle','bottom']);
    if (v.containerId !== undefined) e.containerId = v.containerId === null ? null : id(v.containerId);
    if (v.autoResize !== undefined) e.autoResize = bool(v.autoResize);
  }
  if (e.type === 'image') { e.fileId = id(v.fileId); e.status = 'saved'; if (v.scale !== undefined) { const s = point(v.scale); check(s.every(n => n === -1 || n === 1)); e.scale = s; } }
  if (v.timer !== undefined) {
    check(e.type === 'rectangle'); const t = record(v.timer);
    const durationSeconds = integer(t.durationSeconds, 1, 86400);
    e.timer = { durationSeconds, remainingMs: number(t.remainingMs, 0, durationSeconds * 1000),
      status: enumeration(t.status, ['ready','running','paused','finished']), revision: integer(t.revision, 1) };
    check(e.timer.status !== 'finished' || e.timer.remainingMs === 0);
  }
  return e;
}
export function parseJoinRequest(value: unknown): JoinRequest {
  const v = record(value); check(typeof v.name === 'string');
  const name = v.name.trim().normalize('NFC'); check(name.length > 0 && name.length <= LIMITS.nameLength && !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(name));
  return { inviteId: id(v.inviteId), name, ...(v.resumeToken === undefined ? {} : { resumeToken: id(v.resumeToken) }), ...(v.resumeRoomId === undefined ? {} : { resumeRoomId: id(v.resumeRoomId) }) };
}
export function parsePresentation(value: unknown): Presentation {
  const v = record(value);
  // Accept the former name only at the wire/storage boundary. Internally and in
  // every new outbound message the unrestricted mode is unambiguously `free`.
  const wireMode = enumeration(v.mode, ['free', 'follow', 'clip']);
  const mode: Presentation['mode'] = wireMode === 'follow' ? 'free' : wireMode;
  const clip = v.clip === null ? null : { ...parseViewport(v.clip), id: id(record(v.clip).id) };
  check(mode === 'clip' || clip === null);
  return { revision: integer(v.revision, 0), mode, clip, reset: integer(v.reset, 0) };
}
export function parseClientMessage(value: unknown): ClientMessage {
  const v = record(value);
  switch (v.type) {
    case 'presentation': return { type: 'presentation', generation: integer(v.generation, 1), presentation: parsePresentation(v.presentation) };
    case 'auth':
      if (v.protocolVersion !== undefined && v.protocolVersion !== PROTOCOL_VERSION) throw new ProtocolError('version_mismatch');
      return { ...(v.supportsTimerWidgets === undefined ? {} : { supportsTimerWidgets: bool(v.supportsTimerWidgets) }), ...(v.supportsPatches === undefined ? {} : { supportsPatches: bool(v.supportsPatches) }), ...(v.supportsFreePresentation === undefined ? {} : { supportsFreePresentation: bool(v.supportsFreePresentation) }), ...(v.supportsInteractiveMaterials === undefined ? {} : { supportsInteractiveMaterials: bool(v.supportsInteractiveMaterials) }), ...(v.supportsViewportClips === undefined ? {} : { supportsViewportClips: bool(v.supportsViewportClips) }), ...(v.supportsClipMotion === undefined ? {} : { supportsClipMotion: bool(v.supportsClipMotion) }), ...(v.supportsPresentation === undefined ? {} : { supportsPresentation: bool(v.supportsPresentation) }), type: 'auth', roomId: id(v.roomId), token: id(v.token), ...(v.supportsDiff === undefined ? {} : { supportsDiff: bool(v.supportsDiff) }), ...(v.supportsInlineRasters === undefined ? {} : { supportsInlineRasters: bool(v.supportsInlineRasters) }) };
    case 'ping': case 'resync': case 'start': case 'end': case 'leave': return { type: v.type };
    case 'materialAction': {
      const state = jsonValue(v.state); check(BufferByteLength(state) <= LIMITS.interactiveStateBytes);
      return { type:'materialAction', generation:integer(v.generation,1), instanceId:id(v.instanceId),
        baseStateRevision:integer(v.baseStateRevision,0), state };
    }
    case 'patch': {
      const common = { type:'patch' as const, generation:integer(v.generation,1), id:id(v.id),
        baseRevision:integer(v.baseRevision,0), revision:integer(v.revision,1) };
      check(common.revision > common.baseRevision);
      const channel = enumeration(v.channel,['material','ink']);
      if (channel === 'material') {
        const state = jsonValue(v.state); check(BufferByteLength(state) <= LIMITS.interactiveStateBytes);
        return {...common,channel,state};
      }
      const operation = enumeration(v.operation,['upsert','end','cancel']);
      if (operation !== 'upsert') return {...common,channel,operation};
      const element = sanitizeElement(v.element);
      check((element.type === 'line' || element.type === 'freedraw') && element.id === common.id
        && !element.boundElements?.length && element.points !== undefined);
      const pointStart = integer(v.pointStart,0,LIMITS.points);
      const pointDeleteCount = integer(v.pointDeleteCount,0,LIMITS.points);
      if (element.pressures !== undefined) check(element.pressures.length === element.points.length);
      return {...common,channel,operation,pointStart,pointDeleteCount,element};
    }
    case 'availability': return { type: 'availability', available: bool(v.available) };
    case 'kick': return { type: 'kick', participantId: id(v.participantId) };
    case 'camera': return { type: 'camera', generation: integer(v.generation,1), revision: integer(v.revision,1), viewport: parseViewport(v.viewport) };
    case 'pointer': {
      const p = v.pointer === null ? null : record(v.pointer);
      return { type: 'pointer', generation: integer(v.generation,1), pointer: p === null ? null : {
        x: number(p.x), y: number(p.y), tool: enumeration(p.tool, ['laser','hand','selection','pen','marker','eraser','text','shape']),
        color: color(p.color), pressed: bool(p.pressed), ...(p.style === undefined ? {} : {style: enumeration(p.style,['comet','ribbon','spark'])}),
      } };
    }
    case 'publish': {
      check(Array.isArray(v.elements) && v.elements.length <= LIMITS.elements);
      const elements = v.elements.map(sanitizeElement); check(new Set(elements.map(e => e.id)).size === elements.length);
      const result: PublishMessage = { type: 'publish', generation: integer(v.generation,1), revision: integer(v.revision,1), elements, assetIds: ids(v.assetIds,LIMITS.assets), viewport: parseViewport(v.viewport), background: color(v.background), replace: bool(v.replace), ...(v.coverTransition === undefined ? {} : { coverTransition: parseCoverTransition(v.coverTransition) }) };
      if (v.materials !== undefined) {
        check(Array.isArray(v.materials) && v.materials.length <= LIMITS.interactivePackageFiles);
        result.materials = v.materials.map(parseInteractiveMaterial);
        check(new Set(result.materials.map(material => material.instanceId)).size === result.materials.length);
      }
      if (v.presentation !== undefined) result.presentation = parsePresentation(v.presentation);
      if (v.rasters !== undefined) {
        check(Array.isArray(v.rasters) && v.rasters.length <= LIMITS.assets);
        let bytes = 0;
        result.rasters = v.rasters.map(value => {
          const raster = record(value), assetId = id(raster.id), data = raster.data;
          check(result.assetIds.includes(assetId) && typeof data === 'string' && data.length > 0
            && data.length <= Math.ceil(LIMITS.inlineRasterBytes / 3) * 4 && data.length % 4 === 0
            && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data));
          bytes += data.length / 4 * 3 - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
          check(bytes <= LIMITS.inlineRasterBytes);
          return {id:assetId,data};
        });
        check(new Set(result.rasters.map(raster=>raster.id)).size === result.rasters.length);
      }
      if (!result.replace) { result.baseRevision = integer(v.baseRevision,1); result.removed = ids(v.removed ?? [],LIMITS.elements); result.order = ids(v.order,LIMITS.elements); }
      return result;
    }
    default: throw new ProtocolError();
  }
}

import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { readRoomHtmlFocusMessage } from './room-html-focus.ts';

const command = { type: 'room-html-focus', channel: 'room', generation: 1, revision: 2,
  instanceId: 'opaque-html', key: 'input:text:answer', active: true, presence: null };
test('Room presence accepts an empty focused field before its value changes and bounded text offsets', () => {
  assert.deepEqual(readRoomHtmlFocusMessage(command), command);
  const presence = { text: 'sdsdsd', caret: true, selection: { start: 6, end: 6 }, rects: [], scroll: { x: 0, y: 0 } };
  assert.deepEqual(readRoomHtmlFocusMessage({ ...command, presence })?.presence, presence);
  assert.deepEqual(readRoomHtmlFocusMessage({ ...command, instanceId: null, key: null }),
    { ...command, instanceId: null, key: null, active: false });
});
test('Room presence rejects malformed IDs, revisions and text geometry', () => {
  for (const value of [null, {}, { ...command, channel: '' }, { ...command, generation: 0 }, { ...command, revision: 0 },
    { ...command, revision: 1.5 }, { ...command, active: 'true' }, { ...command, instanceId: null },
    { ...command, key: '' }, { ...command, key: 'x'.repeat(201) }, { ...command, presence: {} }])
    assert.equal(readRoomHtmlFocusMessage(value), null);
});

const projected: any[] = [], viewport = { x: 0, y: 0, width: 800, height: 600 };
let materials: any[] = [{ instanceId: 'opaque-html', roomLocalId: 'native-html', cover: null }];
mock.module('@excalidraw/excalidraw', { namedExports: { CaptureUpdateAction: { NEVER: 'never', IMMEDIATELY: 'immediately' }, newElementWith: (e: any, patch: any) => ({ ...e, ...patch }) } });
mock.module('@tauri-apps/api/core', { namedExports: { isTauri: () => false, invoke: async () => undefined } });
mock.module('@tauri-apps/api/event', { namedExports: { listen: async () => () => undefined } });
mock.module(new URL('../canvas/image-annotation-groups.ts', import.meta.url).href, { namedExports: { attachNewAnnotationsToCanvasTargets: (elements: any[]) => ({ elements }) } });
mock.module(new URL('../canvas/interactive-html-live.ts', import.meta.url).href, { namedExports: {
  prepareHtmlPlaybackRoom:async()=>{},setHtmlPlaybackRoomActive:()=>{},
  showInteractiveHtmlRoomFocus: (focus: any) => projected.push(focus), getInteractiveHtmlFocus: () => null,
  getInteractiveHtmlScroll: () => ({ x: 0, y: 0 }), getInteractiveHtmlState: () => null,
  subscribeInteractiveHtmlFocus: () => () => undefined, subscribeInteractiveHtmlScroll: () => () => undefined,
  subscribeHtmlPlayback:()=>()=>undefined,reportHtmlPlayback:()=>undefined,
} });
mock.module(new URL('./public-projection.ts', import.meta.url).href, { namedExports: {
  getPublicViewport: () => viewport,
  createPublicProjector: () => ({ stop() {}, project: async () => ({ elements: [], assets: [], assetIds: [], materials,
    materialBundles: [], unsupported: [], viewport, background: '#fff' }) }),
} });
mock.module(new URL('./room-media.ts', import.meta.url).href, { namedExports: { isRoomMediaElement: () => false, roomMediaFromElement: () => null } });
mock.module(new URL('./room-ink.ts', import.meta.url).href, { namedExports: { roomInkElement: () => null, validRoomInkCommand: () => false } });
mock.module(new URL('./room-object-edit.ts', import.meta.url).href, { namedExports: { transformRoomAnnotation: () => [], validRoomObjectCommand: () => false } });
const { RoomCanvasHost } = await import('./room-canvas-host.ts');
class Channel {
  static current: Channel;
  sent: any[] = [];
  onmessage: ((event: { data: any }) => void) | null = null;
  readonly name: string;
  constructor(name: string) { this.name = name; Channel.current = this; }
  postMessage(data: any) { this.sent.push(data); }
  close() {}
  receive(data: any) { this.onmessage?.({ data: { ...data, channel: this.name.replace('tafelraum-room-', '') } }); }
}
async function until(predicate: () => boolean) {
  for (let i = 0; i < 60 && !predicate(); i++) await new Promise(resolve => setTimeout(resolve, 5));
  assert.ok(predicate(), 'Room projection did not settle');
}
test('Host displays only confirmed visible Room focus, clears it on removal/stop and rejects late blur', async () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window'), oldChannel = globalThis.BroadcastChannel;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { open: () => ({ closed: false, focus() {}, close() {} }) } });
  globalThis.BroadcastChannel = Channel as any;
  materials = [{ instanceId: 'opaque-html', roomLocalId: 'native-html', cover: null }]; projected.length = 0;
  const changes = new Set<() => void>();
  let nativeVersion = 1;
  const native = () => [{ id: 'native-html', type: 'rectangle', version: nativeVersion, x: 0, y: 0, width: 500, height: 700 }];
  const api = { getSceneElements: native, getSceneElementsIncludingDeleted: native, getFiles: () => ({}),
    getAppState: () => ({ ...viewport, scrollX: 0, scrollY: 0, zoom: { value: 1 }, viewBackgroundColor: '#fff' }),
    onChange: (fn: () => void) => { changes.add(fn); return () => changes.delete(fn); }, onScrollChange: () => () => undefined };
  const host = new RoomCanvasHost();
  try {
    host.attach(api as any, 'lesson'); await host.start(); const channel = Channel.current;
    channel.receive({ type: 'ready', width: 800, height: 600 });
    await until(() => channel.sent.some(message => message.type === 'frame'));
    const frame = channel.sent.find(message => message.type === 'frame');
    const send = (patch = {}) => channel.receive({ ...command, generation: frame.scene.generation, revision: frame.scene.revision, ...patch });
    send(); assert.equal(projected.length, 0, 'unconfirmed frame cannot mark the host');
    channel.receive({ type: 'shown', generation: frame.scene.generation, revision: frame.scene.revision });
    send(); assert.deepEqual(projected.at(-1), { elementId: 'native-html', key: command.key, active: true, presence: null });
    const count = projected.length;
    for (const patch of [{ generation: frame.scene.generation + 1 }, { revision: frame.scene.revision - 1 }, { revision: frame.scene.revision + 1 }, { instanceId: 'other' }, { key: '' }]) send(patch);
    assert.equal(projected.length, count);
    send({ key: 'textarea:textarea:other' });
    send({ active: false }); assert.equal(projected.at(-1).key, 'textarea:textarea:other', 'late blur must not restore the previous field');
    send({ instanceId: null, key: null }); assert.equal(projected.at(-1), null);
    const cleared = projected.length; send({ active: false }); assert.equal(projected.length, cleared);
    send(); materials = []; nativeVersion++; changes.forEach(fn => fn());
    await until(() => channel.sent.filter(message => message.type === 'frame').length > 1);
    const removed = channel.sent.filter(message => message.type === 'frame').at(-1);
    channel.receive({ type: 'shown', generation: removed.scene.generation, revision: removed.scene.revision });
    assert.equal(projected.at(-1), null, 'a removed material clears its marker');
    materials = [{ instanceId: 'opaque-html', roomLocalId: 'native-html', cover: null }]; nativeVersion++; changes.forEach(fn => fn());
    await until(() => channel.sent.filter(message => message.type === 'frame').length > 2);
    const restored = channel.sent.filter(message => message.type === 'frame').at(-1);
    channel.receive({ type: 'shown', generation: restored.scene.generation, revision: restored.scene.revision });
    send({ revision: restored.scene.revision }); assert.equal(projected.at(-1)?.elementId, 'native-html');
    materials = [{ ...materials[0], cover: { x: 0, y: 0, width: 1, height: 1 } }]; nativeVersion++; changes.forEach(fn => fn());
    await until(() => channel.sent.filter(message => message.type === 'frame').length > 3);
    const covered = channel.sent.filter(message => message.type === 'frame').at(-1);
    channel.receive({ type: 'shown', generation: covered.scene.generation, revision: covered.scene.revision });
    assert.equal(projected.at(-1), null, 'fully covered materials cannot retain presence');
    const hidden = projected.length; send({ revision: covered.scene.revision }); assert.equal(projected.length, hidden);
    materials = [{ instanceId: 'opaque-html', roomLocalId: 'native-html', cover: null }]; nativeVersion++; changes.forEach(fn => fn());
    await until(() => channel.sent.filter(message => message.type === 'frame').length > 4);
    const reopened = channel.sent.filter(message => message.type === 'frame').at(-1);
    channel.receive({ type: 'shown', generation: reopened.scene.generation, revision: reopened.scene.revision });
    send({ revision: reopened.scene.revision }); assert.equal(projected.at(-1)?.elementId, 'native-html');
    host.stop(); assert.equal(projected.at(-1), null);
  } finally {
    host.dispose(); globalThis.BroadcastChannel = oldChannel;
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete (globalThis as any).window;
  }
});

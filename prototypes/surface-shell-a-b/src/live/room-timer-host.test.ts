import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { TimerRuntime, timerConfig } from '../widgets/timer.ts';

mock.module('@excalidraw/excalidraw', { namedExports: {
  CaptureUpdateAction: { NEVER: 'never', IMMEDIATELY: 'immediately' },
  newElementWith: (element: any, patch: any) => ({ ...element, ...patch, version: element.version + 1 }),
} });
mock.module('@tauri-apps/api/core', { namedExports: { isTauri: () => false, invoke: async () => undefined } });
mock.module('@tauri-apps/api/event', { namedExports: { listen: async () => () => undefined } });
mock.module(new URL('../canvas/image-annotation-groups.ts', import.meta.url).href, { namedExports: {
  attachNewAnnotationsToCanvasTargets: (elements: any[]) => ({ elements }),
} });
mock.module(new URL('../canvas/interactive-html-live.ts', import.meta.url).href, { namedExports: {
  prepareHtmlPlaybackRoom:async()=>{},setHtmlPlaybackRoomActive:()=>{},
  showInteractiveHtmlRoomFocus:()=>{},getInteractiveHtmlFocus: () => null, getInteractiveHtmlScroll: () => ({ x: 0, y: 0 }), getInteractiveHtmlState: () => null,
  subscribeInteractiveHtmlFocus: () => () => undefined, subscribeInteractiveHtmlScroll: () => () => undefined,
  subscribeHtmlPlayback:()=>()=>undefined,reportHtmlPlayback:()=>undefined,
} });
mock.module(new URL('./room-media.ts', import.meta.url).href, { namedExports: { isRoomMediaElement: () => false, roomMediaFromElement: () => null } });
mock.module(new URL('./room-ink.ts', import.meta.url).href, { namedExports: { roomInkElement: () => null, validRoomInkCommand: () => false } });
mock.module(new URL('./room-object-edit.ts', import.meta.url).href, { namedExports: { transformRoomAnnotation: () => [], validRoomObjectCommand: () => false } });
const viewport = { x: 0, y: 0, width: 800, height: 600 };
mock.module(new URL('./public-projection.ts', import.meta.url).href, { namedExports: {
  getPublicViewport: () => viewport,
  createPublicProjector: () => ({ stop() {}, applyMaterialState: () => false, projectInk: () => null,
    project: async (api: any) => {
      const native = api.getSceneElements()[0];
      const object = { id: 'opaque_timer', sourceId: native.id, version: native.version, type: 'rectangle',
        x: native.x, y: native.y, width: native.width, height: native.height, angle: 0, erasable: false };
      return { elements: [], assets: [], assetIds: [], materials: [], materialBundles: [], unsupported: [], viewport,
        background: '#f4f3ef', roomObjects: [object], roomTimers: [{ ...object, sourceId: undefined, type: undefined, erasable: undefined }] };
    },
  }),
} });
const { RoomCanvasHost } = await import('./room-canvas-host.ts');

class Channel {
  static current: Channel;
  sent: any[] = [];
  name: string;
  onmessage: ((event: { data: any }) => void) | null = null;
  constructor(name: string) { this.name = name; Channel.current = this; }
  postMessage(data: any) { this.sent.push(data); }
  close() {}
  receive(data: any) { this.onmessage?.({ data: { ...data, channel: this.name.replace('tafelraum-room-', '') } }); }
}
async function until(predicate: () => boolean) {
  for (let index = 0; index < 50; index++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  assert.ok(predicate(), 'Room command did not settle');
}
async function fixture() {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldChannel = globalThis.BroadcastChannel;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    open: () => ({ closed: false, focus() {}, close() {} }),
  } });
  globalThis.BroadcastChannel = Channel as any;
  const changes = new Set<() => void>();
  const captures: string[] = [], origins: string[] = [];
  let elements = [{ id: 'private-native-timer', type: 'rectangle', version: 1, versionNonce: 1,
    x: 100, y: 100, width: 300, height: 354, angle: 0, isDeleted: false, groupIds: [], boundElements: null,
    customData: { surfaceKind: 'timer-widget', timerDurationSeconds: 60, timerSoundEnabled: false } }];
  const api = {
    getSceneElements: () => elements, getSceneElementsIncludingDeleted: () => elements, getFiles: () => ({}),
    getAppState: () => ({ ...viewport, scrollX: 0, scrollY: 0, zoom: { value: 1 }, viewBackgroundColor: '#f4f3ef' }),
    onChange: (callback: () => void) => { changes.add(callback); return () => changes.delete(callback); },
    onScrollChange: () => () => undefined,
    updateScene: (update: any) => { if (update.elements) elements = update.elements; captures.push(update.captureUpdate); changes.forEach(callback => callback()); },
  };
  const runtime = new TimerRuntime({ onConfig: (config, origin) => {
    origins.push(origin);
    api.updateScene({ elements: elements.map(element => ({ ...element, version: element.version + 1,
      customData: { ...element.customData, timerDurationSeconds: config.durationSeconds, timerSoundEnabled: config.soundEnabled } })), captureUpdate: 'never' });
  } });
  const sync = () => runtime.reconcile(elements.flatMap(element => { const config = timerConfig(element); return config ? [config] : []; }));
  sync(); changes.add(sync);
  const host = new RoomCanvasHost(); host.attach(api as any, 'qa'); host.attachTimers(runtime);
  await host.start();
  const channel = Channel.current;
  channel.receive({ type: 'ready', width: 800, height: 600 });
  await until(() => channel.sent.some(message => message.type === 'frame'));
  const frame = channel.sent.find(message => message.type === 'frame');
  channel.receive({ type: 'shown', generation: frame.scene.generation, revision: frame.scene.revision });
  const action = (value: any, revision = runtime.get('private-native-timer')!.revision, generation = frame.scene.generation) =>
    channel.receive({ type: 'timer-action', generation, id: 'opaque_timer', revision, action: value });
  return { host, runtime, channel, frame, action, captures, origins, cleanup: () => {
    host.dispose(); runtime.dispose(); globalThis.BroadcastChannel = oldChannel;
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else delete (globalThis as any).window;
  } };
}

test('Room routes timer controls through opaque IDs and rejects stale revisions/generations', async () => {
  const f = await fixture();
  try {
    assert.equal(f.frame.timers[0].id, 'opaque_timer');
    assert.doesNotMatch(JSON.stringify(f.frame.timers), /private-native-timer/);
    const revision = f.runtime.get('private-native-timer')!.revision;
    f.action({ type: 'start' }, revision);
    assert.equal(f.runtime.get('private-native-timer')!.status, 'running');
    f.action({ type: 'reset' }, revision);
    assert.equal(f.runtime.get('private-native-timer')!.status, 'running');
    f.action({ type: 'pause' }, f.runtime.get('private-native-timer')!.revision, f.frame.scene.generation - 1);
    assert.equal(f.runtime.get('private-native-timer')!.status, 'running');
    f.action({ type: 'pause' }); assert.equal(f.runtime.get('private-native-timer')!.status, 'paused');
    assert.deepEqual(f.origins, []); assert.deepEqual(f.captures, []);
  } finally { f.cleanup(); }
});
test('Room configuration waits for teacher ink and uses its own history without a teacher capture', async () => {
  const f = await fixture();
  try {
    f.host.setInkPreview('teacher-stroke');
    f.action({ type: 'sound', enabled: true });
    assert.equal(f.runtime.get('private-native-timer')!.soundEnabled, false);
    f.host.setInkPreview(null);
    await until(() => f.runtime.get('private-native-timer')!.soundEnabled);
    assert.deepEqual(f.origins, ['room']); assert.deepEqual(f.captures, ['never']);
    assert.ok(f.channel.sent.some(message => message.type === 'history-state' && message.undo));
    f.channel.receive({ type: 'history', generation: f.frame.scene.generation, action: 'undo' });
    assert.equal(f.runtime.get('private-native-timer')!.soundEnabled, false);
    assert.equal(f.runtime.get('private-native-timer')!.status, 'ready');
  } finally { f.cleanup(); }
});

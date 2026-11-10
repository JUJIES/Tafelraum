// From the repository root after npm run build in the app directory.
// All clipboard events, material files and lessons belong to this test.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDesktopServer, initializeEmptyArchive } from '../prototypes/surface-shell-a-b/desktop-server.mjs';
import distribution from '../prototypes/surface-shell-a-b/distribution.json' with {type:'json'};

const app = fileURLToPath(new URL('../prototypes/surface-shell-a-b/', import.meta.url));
const { chromium, webkit } = createRequire(path.join(app, 'package.json'))('playwright');
const engine = process.argv[2] ?? 'chromium';
assert.ok(['chromium', 'webkit'].includes(engine));
const fixture = await mkdtemp(path.join(tmpdir(), 'tafelraum-image-clipboard-'));
const archive = path.join(fixture, 'archive');
let server, browser;
try {
  await initializeEmptyArchive(archive);
  const catalogPath = path.join(archive, 'archive.json');
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  catalog.catalog.lessons.push({ ...catalog.catalog.lessons[0], id: 'lesson-target', title: 'Clipboard Testziel' });
  catalog.catalog.lessonOrderBySeriesId['series-start'].push('lesson-target');
  await writeFile(catalogPath, JSON.stringify(catalog));
  server = await createDesktopServer({ archiveRoot: archive, webRoot: path.join(app, 'dist') });
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await (engine === 'webkit' ? webkit : chromium).launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator.clipboard, 'write', {
      value: async ([item]) => { window.copiedPng = await item.getType('image/png'); },
    });
    window.pasteImage = async (internal) => {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 120;
      const context = canvas.getContext('2d');
      context.fillStyle = '#d32d48';
      context.fillRect(0, 0, 240, 120);
      const png = internal ? window.copiedPng : await new Promise(resolve => canvas.toBlob(resolve));
      const data = new DataTransfer();
      data.items.add(new File([png], 'clipboard-test.png', { type: 'image/png' }));
      const target = document.querySelector('.canvas-engine .excalidraw');
      target.focus();
      target.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
    };
  });
  const lessonDir = id => path.join(archive, 'faecher/subject-start/reihen/series-start/stunden', id);
  const readJson = file => readFile(file, 'utf8').then(JSON.parse).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  async function waitForImages(id, count) {
    for (let i = 0; i < 100; i++) {
      const snapshot = await readJson(path.join(lessonDir(id), 'board/scene.json'));
      const images = snapshot?.elements.filter(element => element.type === 'image' && !element.isDeleted);
      if (images?.length === count) return { snapshot, images };
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Expected ${count} image(s) in ${id}`);
  }
  const surface = page.locator('.canvas-engine .excalidraw');
  const canvas = surface.locator('canvas.interactive');
  await page.goto(origin);
  await canvas.waitFor();
  await page.evaluate(() => window.pasteImage(false));
  const { snapshot, images: [original] } = await waitForImages('lesson-start', 1);
  const bounds = await canvas.boundingBox();
  const zoom = snapshot.viewport.zoom.value;
  const x = bounds.x + (original.x + original.width / 2 + snapshot.viewport.scrollX) * zoom;
  const y = bounds.y + (original.y + original.height / 2 + snapshot.viewport.scrollY) * zoom;
  await page.mouse.dblclick(x, y);
  await surface.evaluate(element => {
    element.focus();
    element.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true }));
  });
  await page.waitForFunction(() => window.copiedPng?.size > 0, undefined, {timeout: 10000});
  await page.evaluate(() => window.pasteImage(true));
  await waitForImages('lesson-start', 2);
  assert.deepEqual(await readdir(path.join(lessonDir('lesson-start'), 'material')), ['clipboard-test.png']);

  const targetLesson = page.getByRole('button', {name: 'Clipboard Testziel', exact: true});
  if (!await targetLesson.isVisible()) await page.getByRole('button', {name: 'Unterricht öffnen'}).click();
  await targetLesson.click();
  await page.getByRole('heading', {name: 'Clipboard Testziel', exact: true}).waitFor();
  await canvas.waitFor();
  await canvas.hover({ position: { x: 440, y: 340 } });

  const targetAssets = '**/api/archive/lessons/lesson-target/assets';
  const failAssetWrite = route => route.request().method() === 'PUT'
    ? route.fulfill({status:500, json:{error:'Synthetic target asset write failure'}})
    : route.continue();
  await page.route(targetAssets, failAssetWrite);
  await page.evaluate(() => window.pasteImage(true));
  await page.getByText('Synthetic target asset write failure', {exact:true}).waitFor();
  assert.ok(!(await readJson(path.join(lessonDir('lesson-target'), 'board/scene.json')))?.elements.some(element => element.type === 'image' && !element.isDeleted));
  await page.unroute(targetAssets, failAssetWrite);

  await page.evaluate(() => window.pasteImage(true));
  const { images: [copied] } = await waitForImages('lesson-target', 1);
  assert.equal(copied.fileId, original.fileId);
  assert.equal(copied.width, original.width);
  assert.equal(copied.height, original.height);
  assert.match(copied.customData.archiveMaterialPath, /\/lesson-target\/material\/clipboard-test\.png$/);
  const source = await readFile(path.join(lessonDir('lesson-start'), 'material/clipboard-test.png'));
  assert.deepEqual(await readFile(path.join(lessonDir('lesson-target'), 'material/clipboard-test.png')), source);
  assert.deepEqual(await readdir(path.join(lessonDir('lesson-target'), 'material')), ['clipboard-test.png']);
  const assets = await readJson(path.join(lessonDir('lesson-target'), 'assets/manifest.json'));
  const copiedAsset = assets.assets.find(asset => asset.fileId === copied.fileId);
  assert.ok(copiedAsset, 'The target asset must exist independently of the browser cache');
  assert.deepEqual(await readFile(path.join(lessonDir('lesson-target'), 'assets', copiedAsset.fileName)), source);

  // A fresh origin storage context proves that the scene can load from the archive alone.
  const reopened = await browser.newPage();
  await reopened.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  const assetRead = reopened.waitForResponse(response => response.url().endsWith('/lesson-target/assets'));
  await reopened.addInitScript(() => localStorage.setItem('surface-lab-active-lesson', 'lesson-target'));
  await reopened.goto(origin);
  const result = await assetRead;
  assert.ok(result.ok());
  assert.ok((await result.json()).files.some(file => file.id === copied.fileId));
  console.log(`${distribution.profile}/${engine}: external PNG import, same-lesson copy, failed target write and retry, target material and asset persistence, fresh browser load passed`);
} finally {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  await rm(fixture, { recursive: true, force: true });
}

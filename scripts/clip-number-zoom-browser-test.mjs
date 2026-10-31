// Real ClipLayer/CanvasSurface with a separate, synthetic archive.
// From the app directory: npm run test:browser:clips
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, writeFile, rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createArchiveMiddleware} from '../prototypes/surface-shell-a-b/archive-server.mjs';
import {initializeEmptyArchive} from '../prototypes/surface-shell-a-b/desktop-server.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = root + 'output/clip-number-zoom/';
await mkdir(out, {recursive:true});
const require = createRequire(root + 'prototypes/surface-shell-a-b/package.json');
const {createServer} = await import(require.resolve('vite'));
const {default:react} = await import(require.resolve('@vitejs/plugin-react'));
const pw = process.argv[2] ? await import(process.argv[2]) : require('playwright');
const archiveRoot = await mkdtemp(out + 'archive-');
await initializeEmptyArchive(archiveRoot);
const archive = createArchiveMiddleware(archiveRoot);
const server = await createServer({
  configFile:false, root:root + 'prototypes/surface-shell-a-b', cacheDir:out + 'vite-cache',
  define:{__TAFELRAUM_VERSION__:JSON.stringify('clip-number-check')},
  server:{host:'127.0.0.1', port:0, hmr:false, watch:{ignored:['**/src-tauri/**','**/desktop-resources/**']}},
  plugins:[react(), {name:'synthetic-clip-number-archive', configureServer(s) {s.middlewares.use(archive);}}],
});
const results = [];
try {
  await server.listen();
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  for (const engine of ['chromium','webkit']) {
    const browser = await pw[engine].launch({headless:true});
    try {
      const page = await browser.newPage({viewport:{width:1920,height:1050}, hasTouch:true});
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/src/live/clip.browser.html?lesson=lesson-start&inlineRoom');
      await page.waitForFunction(() => window.clipFixture?.api && window.clipFixture.port && !window.clipFixture.api.getAppState().isLoading);
      await page.getByRole('button', {name:'Testinhalt',exact:true}).click();
      await page.getByRole('button', {name:'Clip aufnehmen',exact:true}).click();
      await page.mouse.move(90,160); await page.mouse.down();
      await page.mouse.move(445,660,{steps:10}); await page.mouse.up();
      const area = page.getByRole('button', {name:'Clip 1 zeigen',exact:true});
      await area.waitFor();
      await page.getByRole('button', {name:'Testbild',exact:true}).click();
      await page.waitForFunction(() => window.clipFixture.api.getSceneElements().some(e => e.type === 'image' && !e.isDeleted));
      await page.evaluate(() => {
        const api = window.clipFixture.api, image = api.getSceneElements().find(e => e.type === 'image' && !e.isDeleted);
        api.updateScene({elements:api.getSceneElements().map(e => e.id === image.id ? {...e,x:550,y:90,width:500,height:400} : e),
          appState:{selectedElementIds:{[image.id]:true}}});
      });
      await page.keyboard.press('Control+2');
      let material = page.getByRole('button', {name:'Materialclip 2 zeigen',exact:true});
      await material.waitFor();
      await material.locator('..').click({button:'right'});
      await page.getByRole('menuitem', {name:'Nummer ändern',exact:true}).click();
      await page.getByLabel('Neue Nummer', {exact:true}).fill('99');
      await page.getByRole('button', {name:'Übernehmen',exact:true}).click();
      material = page.getByRole('button', {name:'Materialclip 99 zeigen',exact:true});
      await material.waitFor();
      await page.evaluate(() => window.clipFixture.api.updateScene({appState:{selectedElementIds:{}}}));
      const savedClips = await page.evaluate(async () => {
        await window.clipFixture.port.flushPersistence();
        return (await (await fetch('/api/archive/lessons/lesson-start/board')).json()).clips;
      });
      for (const theme of ['light','dark']) {
        if (theme === 'dark') await page.getByRole('button', {name:'Theme wechseln',exact:true}).click();
        for (const zoom of [.1,.25,.5,1,2,3]) {
          await page.evaluate(zoom => window.clipFixture.api.updateScene({appState:{zoom:{value:zoom},scrollX:0,scrollY:0}}), zoom);
          await page.waitForFunction(zoom => +document.querySelector('.clip-layer').style.getPropertyValue('--clip-number-scale') === Math.min(1,zoom), zoom);
          const metrics = await page.locator('.clip-number').evaluateAll(buttons => buttons.map(button => {
            const hit = button.getBoundingClientRect(), badge = button.querySelector('.clip-number-badge'), rect = badge.getBoundingClientRect();
            const style = getComputedStyle(badge);
            return {number:button.textContent,hitWidth:hit.width,hitHeight:hit.height,width:rect.width,height:rect.height,
              fontSize:parseFloat(style.fontSize),color:style.color,background:style.backgroundColor};
          }));
          for (const item of metrics) {
            assert.equal(item.hitWidth,48); assert.equal(item.hitHeight,48);
            assert.ok(Math.abs(item.width - 48 * Math.min(1,zoom)) < .01);
            assert.ok(Math.abs(item.height - item.width) < .01);
            assert.equal(item.fontSize,24);
          }
          results.push({engine,theme,zoom,metrics});
          if ([.25,.5,1,2].includes(zoom)) await page.screenshot({path:out + `${engine}-${theme}-${zoom}.png`});
        }
      }
      await page.getByRole('button', {name:'Präsentieren',exact:true}).click();
      await page.getByRole('button', {name:'Starten',exact:true}).click();
      await page.waitForFunction(() => window.clipFixture.room.state.ready);
      await page.evaluate(() => window.clipFixture.api.updateScene({appState:{zoom:{value:.5},scrollX:0,scrollY:0}}));
      // A real touch tap in the badge selects; a tap in its invisible extension
      // still reaches the same accessible 48px control.
      let rect = await area.boundingBox();
      await page.touchscreen.tap(rect.x+40,rect.y+40);
      await page.waitForFunction(() => document.querySelector('[aria-label="Clip 1 zeigen"]').getAttribute('aria-pressed') === 'true');
      const activeColors = await area.locator('.clip-number-badge').evaluate(el => {
        const style = getComputedStyle(el); return {foreground:style.color,background:style.backgroundColor};
      });
      assert.notEqual(activeColors.foreground,activeColors.background);
      await material.focus(); await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.querySelector('[aria-label="Materialclip 99 zeigen"]').getAttribute('aria-pressed') === 'true');
      await page.waitForFunction(() => window.clipFixture.room.state.ready && document.querySelector('.clip-frame.is-active'));
      await page.screenshot({path:out + engine + '-active-overview.png'});
      // Menu remains reachable at overview zoom; Escape and deletion/undo retain
      // the existing clip data path.
      await material.locator('..').click({button:'right'});
      await page.getByRole('menuitem', {name:'Entfernen',exact:true}).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('menu').count(),0);
      const afterZoom = await page.evaluate(async () => {
        await window.clipFixture.port.flushPersistence();
        return (await (await fetch('/api/archive/lessons/lesson-start/board')).json()).clips;
      });
      assert.deepEqual(afterZoom,savedClips,'zoom and selection preserve stored clip geometry and numbering');
      await material.locator('..').click({button:'right'});
      await page.getByRole('menuitem', {name:'Entfernen',exact:true}).click();
      assert.equal(await material.count(),0);
      await page.getByRole('button', {name:'Clip-Änderung rückgängig',exact:true}).click();
      await material.waitFor();
      assert.deepEqual(errors,[]);
      results.push({engine,checks:'touch extension, keyboard activation, context menu, reassignment 99, Escape, deletion/undo, unchanged saved clips',errors});
    } finally {await browser.close();}
  }
  await writeFile(out + 'checks.json',JSON.stringify(results,null,2));
  console.log('PASS: clip badges at 10/25/50/100/200/300% in light/dark, Chromium/WebKit, 48px hit targets and clip actions');
} finally {
  await server.close();
  await rm(archiveRoot,{recursive:true,force:true});
}

// Real ClipLayer/CanvasSurface with a separate, synthetic archive.
// From the app directory: npm run test:browser:clips
import assert from 'node:assert/strict';
import {mkdir, mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
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
let archive;
const server = await createServer({
  configFile:false, root:root + 'prototypes/surface-shell-a-b', cacheDir:out + 'vite-cache',
  define:{__TAFELRAUM_VERSION__:JSON.stringify('clip-number-check')},
  server:{host:'127.0.0.1', port:0, hmr:false, watch:{ignored:['**/src-tauri/**','**/desktop-resources/**']}},
  plugins:[react(), {name:'synthetic-clip-number-archive', configureServer(s) {
    s.middlewares.use((request,response,next) => archive(request,response,next));
  }}],
});
const results = [];
try {
  await server.listen();
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  for (const engine of ['chromium','webkit']) {
    const engineArchive = archiveRoot + '/' + engine;
    await mkdir(engineArchive);
    await initializeEmptyArchive(engineArchive);
    const catalogPath = engineArchive + '/archive.json';
    const catalog = JSON.parse(await readFile(catalogPath,'utf8'));
    catalog.catalog.lessons[0].materialBasis = {scope:'lesson',archivePath:'material',archiveSeriesId:'series-start'};
    await writeFile(catalogPath,JSON.stringify(catalog));
    const htmlPath = engineArchive + '/material/interaktiv/scroll-test';
    await mkdir(htmlPath,{recursive:true});
    await writeFile(htmlPath + '/manifest.json',JSON.stringify({
      format:'tafelraum-interactive-html',schemaVersion:1,id:'scroll-test',title:'Scrolltest',entry:'index.html',
      defaultViewport:{width:600,height:448},
    }));
    await writeFile(htmlPath + '/index.html','<!doctype html><meta charset="utf-8"><title>Scrolltest</title><main style="height:1600px">Scrollbares Testblatt</main>');
    archive = createArchiveMiddleware(engineArchive);
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

      // Room renders from local asset URLs like the teacher preview, but a
      // zoomed Room clip has its own bounded, interactive camera.
      await page.waitForFunction(() => window.clipFixture.room.state.ready && window.clipFixture.room.state.target.kind==='clip');
      const roomFrame=page.frameLocator('#clip-fixture-room');
      await roomFrame.getByRole('button',{name:'Werkzeugleiste einblenden',exact:true}).click();
      const hand=roomFrame.getByRole('button',{name:'Hand',exact:true});
      await hand.click();
      const stage=roomFrame.locator('.live-view-canvas.is-clip.is-ready');
      await stage.evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(animation=>animation.finished)));
      const roomBox=await page.locator('#clip-fixture-room').boundingBox();
      const x=roomBox.x+207,y=roomBox.y+142;
      const raster=stage.locator('canvas.static');
      const pixels=()=>raster.evaluate(canvas=>canvas.toDataURL());
      const hostState=()=>page.evaluate(()=>{
        const api=window.clipFixture.api,{scrollX,scrollY,zoom}=api.getAppState();
        return {scrollX,scrollY,zoom,objects:api.getSceneElements().map(({id,version})=>[id,version])};
      });
      const beforeHand=await hostState(), fittedInset=await stage.evaluate(el=>el.style.clipPath);
      await page.mouse.move(x,y);
      await page.keyboard.down('Control');
      for(let i=0;i<4;i++)await page.mouse.wheel(0,-110);
      await page.keyboard.up('Control');
      assert.notEqual(await stage.evaluate(el=>el.style.clipPath),fittedInset,'Room zoom must not snap back to fit');
      const zoomed=await pixels();
      await page.mouse.down();await page.mouse.move(x+30,y-38,{steps:10});await page.mouse.up();
      assert.notEqual(await pixels(),zoomed,'the hand pans a zoomed Room clip with a mouse');
      if(engine==='chromium'){
        const input=await page.context().newCDPSession(page);
        const beforeTouch=await pixels();
        await input.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x+30,y:y-38}]});
        for(let i=1;i<=8;i++)await input.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30-30*i/8,y:y-38+38*i/8}]});
        await input.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        assert.notEqual(await pixels(),beforeTouch,'the hand pans a zoomed Room clip with touch');
        await input.detach();
      }
      assert.equal(await hand.getAttribute('aria-pressed'),'true');
      assert.equal(await roomFrame.locator('.room-object-input,.room-ink-input').count(),0);
      assert.deepEqual(await hostState(),beforeHand,'Room hand gestures leave teacher camera and objects intact');

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

      // The first room document opens but never runs its receiver, as with a
      // white window. Recovery must actually launch a new receiver and show the
      // already selected clip, not just retry publishing to the dead channel.
      await page.getByRole('button', {name:/^Room Canvas,/}).click();
      await page.getByRole('button', {name:'Beenden',exact:true}).press('Enter');
      await page.route('**/room.html?channel=*', route => route.fulfill({
        contentType:'text/html', body:'<!doctype html><title>Room Canvas</title>',
      }), {times:1});
      await page.getByRole('button', {name:'Präsentieren',exact:true}).click();
      await page.getByRole('button', {name:'Starten',exact:true}).click();
      await page.getByRole('button', {name:'Room Canvas, Wird vorbereitet …',exact:true}).waitFor();
      const firstRoomUrl = await page.locator('#clip-fixture-room').getAttribute('src');
      await material.focus(); await page.keyboard.press('Enter');
      await page.getByRole('button', {name:'Room Canvas, Nicht bereit',exact:true}).waitFor();
      const startupError = page.getByRole('alert').filter({hasText:'Room Canvas konnte nicht starten.'});
      await startupError.waitFor();
      await startupError.screenshot({path:out + engine + '-room-startup-error.png'});
      await startupError.getByRole('button', {name:'Erneut versuchen',exact:true}).click();
      await page.waitForFunction(() => window.clipFixture.room.state.ready &&
        document.querySelector('[aria-label="Materialclip 99 zeigen"]').closest('.clip-frame').classList.contains('is-active'));
      assert.notEqual(await page.locator('#clip-fixture-room').getAttribute('src'),firstRoomUrl);
      await startupError.waitFor({state:'hidden'});

      // The PDF renderer places an independent raster element per page.
      await page.evaluate(() => window.clipFixture.api.updateScene({
        appState:{zoom:{value:1},scrollX:0,scrollY:0,selectedElementIds:{}},
      }));
      await page.waitForFunction(() => +document.querySelector('.clip-layer').style.getPropertyValue('--clip-number-scale') === 1);
      const pdf = await page.evaluate(async () => {
        const {api,port} = window.clipFixture;
        const image = api.getSceneElements().find(element => element.type === 'image');
        const file = api.getFiles()[image.fileId];
        const layer = document.querySelector('.clip-layer').getBoundingClientRect();
        await port.placeImages([{id:crypto.randomUUID(),dataUrl:file.dataURL,mimeType:'image/png',pixelWidth:640,pixelHeight:427,
          source:{fileName:'Testblatt.pdf',kind:'pdf-page',pageNumber:1}},
          {id:crypto.randomUUID(),dataUrl:file.dataURL,mimeType:'image/png',pixelWidth:640,pixelHeight:427,
            source:{fileName:'Testblatt.pdf',kind:'pdf-page',pageNumber:2}}],{clientX:layer.x+1240,clientY:layer.y+375});
        const sheet = api.getSceneElements().find(element => element.customData?.sourceKind === 'pdf-page');
        return {id:sheet.id,x:sheet.x,y:sheet.y};
      });
      const layer = await page.locator('.clip-layer').boundingBox();
      const pageX = layer.x + pdf.x, pageY = layer.y + pdf.y;
      await page.getByRole('button', {name:'Clip aufnehmen',exact:true}).click();
      await page.mouse.move(pageX+50,pageY+55);
      await page.mouse.down();
      await page.mouse.move(pageX+250,pageY+170,{steps:10});
      await page.mouse.up();
      const pdfClip = page.getByRole('button', {name:'Clip 2 zeigen',exact:true});
      const frame = pdfClip.locator('xpath=../..');
      const framePosition = locator => locator.evaluate(el => ({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}));
      const freeFrame = area.locator('xpath=../..');
      const originalFrame = await framePosition(frame);
      const originalFree = await framePosition(freeFrame);
      await page.keyboard.press('2');
      await page.waitForFunction(() => window.clipFixture.room.state.ready && window.clipFixture.room.state.target.kind === 'clip');
      await page.getByRole('button', {name:'Auswahl',exact:true}).click();
      await page.mouse.move(pageX+300,pageY+210);
      await page.mouse.down();
      await page.mouse.move(pageX+425,pageY+295,{steps:10});
      await page.mouse.up();
      await page.waitForFunction(({id,x,y}) => {
        const current = window.clipFixture.api.getSceneElements().find(element => element.id === id);
        return current?.x === x+125 && current?.y === y+85;
      },pdf);
      const movedFrame = {x:originalFrame.x+125,y:originalFrame.y+85};
      await page.waitForFunction(({x,y}) => {
        const target = window.clipFixture.room.state.target;
        return target.kind === 'clip' && target.clip.x === x && target.clip.y === y;
      },movedFrame);
      assert.deepEqual(await framePosition(frame),movedFrame);
      assert.deepEqual(await framePosition(freeFrame),originalFree);
      await page.evaluate(() => window.clipFixture.port.undo());
      await page.waitForFunction(({x,y}) => {
        const target = window.clipFixture.room.state.target;
        return target.kind === 'clip' && target.clip.x === x && target.clip.y === y;
      },originalFrame,{timeout:3500}).catch(async error => {
        const state = await page.evaluate(id => {
          const {api,room} = window.clipFixture;
          const image = api.getSceneElements().find(element => element.id === id);
          return {image:{x:image?.x,y:image?.y,sourceKind:image?.customData?.sourceKind},target:room.state.target};
        },pdf.id);
        throw new Error(`Undo did not return to ${JSON.stringify(originalFrame)}. Current state: ${JSON.stringify(state)}`,{cause:error});
      });
      assert.deepEqual(await framePosition(frame),originalFrame);
      await page.evaluate(() => window.clipFixture.port.redo());
      await page.waitForFunction(({x,y}) => {
        const target = window.clipFixture.room.state.target;
        return target.kind === 'clip' && target.clip.x === x && target.clip.y === y;
      },movedFrame);
      await page.evaluate(() => window.clipFixture.port.flushPersistence());
      await page.reload();
      assert.deepEqual(await framePosition(frame),movedFrame);
      assert.deepEqual(await framePosition(freeFrame),originalFree);

      await page.evaluate(() => window.clipFixture.port.placeInteractiveHtml({
        archiveMaterialPath:'material/interaktiv/scroll-test',id:'scroll-test',lessonId:'lesson-start',
        title:'Scrolltest',entry:'index.html',print:null,defaultViewport:{width:600,height:448},
      },{clientX:700,clientY:400}));
      const teacherHtml = page.frameLocator('.interactive-html-canvas-frame iframe').locator('main');
      await teacherHtml.waitFor();
      await page.evaluate(async () => {
        const {getInteractiveHtmlScroll} = await import('/src/canvas/interactive-html-live.ts');
        window.readTeacherHtmlOffset = () => {
          const sheet = window.clipFixture.api.getSceneElements().find(el => el.customData?.materialKind==='interactive-html');
          return sheet && getInteractiveHtmlScroll(sheet.id).y;
        };
      });
      const scrollOffset = locator => locator.evaluate(el => el.ownerDocument.defaultView.scrollY);
      const scrollTeacher = async top => {
        await teacherHtml.evaluate((el,y) => el.ownerDocument.defaultView.scrollTo(0,y),top);
        await page.waitForFunction(y => window.readTeacherHtmlOffset()===y,top);
      };
      await scrollTeacher(150);
      const sheetBox = await page.locator('.interactive-html-canvas-frame').boundingBox();
      await page.getByRole('button', {name:'Clip aufnehmen',exact:true}).click();
      await page.mouse.move(sheetBox.x+80,sheetBox.y+140);
      await page.mouse.down();
      await page.mouse.move(sheetBox.x+420,sheetBox.y+340,{steps:10});
      await page.mouse.up();
      const htmlClip = page.getByRole('button',{name:'Clip 3 zeigen',exact:true});
      const htmlFrame = htmlClip.locator('xpath=../..');
      const initialHtmlFrame = await framePosition(htmlFrame);
      await page.getByRole('button', {name:'Präsentieren',exact:true}).click();
      await page.getByRole('button', {name:'Starten',exact:true}).click();
      await page.waitForFunction(() => window.clipFixture.room.state.ready);
      await page.keyboard.press('3');
      await page.waitForFunction(() => window.clipFixture.room.state.ready && window.clipFixture.room.state.target.kind==='clip');
      const roomHtml = roomFrame.frameLocator('[data-room-material-id] iframe').getByText('Scrollbares Testblatt',{exact:true});
      const waitForRoomOffset = y => roomHtml.evaluate((el,expected) => new Promise((resolve,reject) => {
        const view=el.ownerDocument.defaultView;
        const timeout=view.setTimeout(() => reject(new Error(`Room scroll: ${view.scrollY}, expected ${expected}, root: ${el.ownerDocument.scrollingElement?.scrollHeight}/${view.innerHeight}`)),4000);
        const check=()=>{if(view.scrollY===expected){view.clearTimeout(timeout);resolve();}else view.requestAnimationFrame(check);};
        check();
      }),y);
      await waitForRoomOffset(150);
      const outputGeometry = () => page.evaluate(() => window.clipFixture.room.getPreviewSnapshot()?.scene.presentation?.clip);
      const initialOutput = await outputGeometry();
      await scrollTeacher(230);
      await page.waitForFunction(y => {
        const frame=document.querySelector('[aria-label="Clip 3 zeigen"]')?.closest('.clip-frame');
        return frame && Math.abs(parseFloat(frame.style.top)-y)<.1;
      },initialHtmlFrame.y-80);
      assert.deepEqual(await outputGeometry(),initialOutput,'scrolling the teacher never moves the output clip');
      assert.equal(await scrollOffset(roomHtml),150);
      await scrollTeacher(700);
      await htmlClip.waitFor({state:'hidden'});
      assert.deepEqual(await outputGeometry(),initialOutput,'scrolling the teacher frame off the sheet keeps Room presenting');
      await scrollTeacher(150);
      assert.deepEqual(await framePosition(htmlFrame),initialHtmlFrame);

      const moveHandle = page.getByRole('button',{name:'Clip 3 verschieben'});
      const handle = await moveHandle.boundingBox();
      await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);
      await page.mouse.down();
      await page.mouse.move(handle.x+handle.width/2+32,handle.y+handle.height/2+20,{steps:8});
      await page.mouse.up();
      await page.waitForFunction(x => {
        const clip=window.clipFixture.room.getPreviewSnapshot()?.scene.presentation?.clip;
        return clip && Math.abs(clip.x-x)<.1;
      },initialOutput.x+32);
      const movedHtmlFrame=await framePosition(htmlFrame);
      assert.equal(await scrollOffset(roomHtml),150);
      const roomHtmlFrame = roomFrame.locator('[data-room-material-id] iframe');
      const htmlBox = await roomHtmlFrame.boundingBox();
      await page.mouse.move(htmlBox.x+htmlBox.width/2,htmlBox.y+htmlBox.height/2);
      await page.mouse.wheel(0,180);
      const localOffset = await roomHtml.evaluate(el => new Promise((resolve,reject) => {
        const view=el.ownerDocument.defaultView;
        const timeout=view.setTimeout(() => reject(new Error('Manual Room scroll did not move the sheet')),4000);
        const check=()=>{if(view.scrollY>150){view.clearTimeout(timeout);resolve(view.scrollY);}else view.requestAnimationFrame(check);};
        check();
      }));
      await scrollTeacher(610);
      await htmlClip.waitFor({state:'hidden'});
      assert.equal(await scrollOffset(roomHtml),localOffset,'manual Room scroll survives teacher scroll');
      await scrollTeacher(150);
      assert.deepEqual(await framePosition(htmlFrame),movedHtmlFrame);
      await page.evaluate(() => window.clipFixture.port.flushPersistence());
      await page.reload();
      await htmlClip.waitFor();
      const reloaded = await framePosition(htmlFrame);
      assert.ok(Math.abs(reloaded.y-(movedHtmlFrame.y+150))<.1,'reload restores the document anchor with the teacher scrolled to the top');
      assert.deepEqual(errors,[]);
      results.push({engine,checks:'clip controls, Room gestures and recovery, PDF clip binding, stable HTML scroll in active Room clip, manual Room scroll and clip movement',errors});
    } finally {await browser.close();}
  }
  await writeFile(out + 'checks.json',JSON.stringify(results,null,2));
  console.log('PASS: clip actions, 48px hit targets, Room hand gestures and blank startup recovery');
} finally {
  await server.close();
  await rm(archiveRoot,{recursive:true,force:true});
}

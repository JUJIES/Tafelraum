// Source-only checkout smoke: real Vite configuration, empty archive, dev + preview.
// From the app directory: npm run test:developer-start
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {access, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {promisify} from 'node:util';
import {snapshotBuildSource} from './snapshot-build-source.mjs';

const run = promisify(execFile);
const repository = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(repository, 'output/developer-onboarding');
const source = path.join(output, `source-${process.pid}`);
const app = path.join(source, 'prototypes/surface-shell-a-b');
const require = createRequire(path.join(repository, 'prototypes/surface-shell-a-b/package.json'));
const {chromium} = process.argv[2]
  ? await import(pathToFileURL(path.resolve(process.argv[2])).href)
  : require('playwright');
const {createServer, preview} = await import(require.resolve('vite'));
const originalCwd = process.cwd();
const environment = {...process.env};
// This test must never inherit an archive or private provisioning from the shell.
for (const key of Object.keys(process.env)) if (key.startsWith('TAFELRAUM_')) delete process.env[key];
const checks = [], errors = [];
let browser, server;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
try {
  await mkdir(output, {recursive:true});
  await snapshotBuildSource(repository, source, {includeLocalFixtures:false});
  await assert.rejects(access(path.join(source, 'test-materials')));
  await assert.rejects(access(path.join(source, 'data')));
  await assert.rejects(access(path.join(app, '.env.local')));
  // Remove the snapshot's optional office-runtime link; no local runtime/config needed.
  await rm(path.join(source, 'local-data'), {recursive:true, force:true});
  const {startLocal} = await import(pathToFileURL(path.join(app,'start-local.mjs')).href);
  server = await startLocal(0);
  const archive = path.join(source, 'local-data/public-lessons');
  const firstStatus = await (await fetch(`http://127.0.0.1:${server.httpServer.address().port}/api/archive/status`)).json();
  assert.equal(firstStatus.archiveRoot, archive);
  await server.close();
  server = null;
  checks.push('Public start command creates an isolated lesson archive in a clean checkout');
  const archiveFile = path.join(archive, 'archive.json');
  const catalog = JSON.parse(await readFile(archiveFile, 'utf8'));
  const demo = {...catalog.catalog.lessons[0], id:'lesson-demo', title:'Transport-Demo', seed:{prompt:'',showTransportImage:true}};
  catalog.catalog.lessons.push(demo);
  catalog.catalog.lessonOrderBySeriesId['series-start'].push(demo.id);
  await writeFile(archiveFile, JSON.stringify(catalog));
  const build = await run('npm', ['run','build'], {cwd:app, timeout:120000, maxBuffer:4*1024*1024});
  await writeFile(path.join(output,'checkout-build.log'),build.stdout+build.stderr);
  checks.push('Source-only production build without test-materials/');
  const image = await readFile(path.join(app,'src/assets/demo/transport-set.png'));
  assert.equal(image.readUInt32BE(16),1536);
  assert.equal(image.readUInt32BE(20),1024);
  process.chdir(app); // loadEnv in the actual vite.config.ts uses the app cwd.
  browser = await chromium.launch({headless:true});
  for (const mode of ['dev','preview']) {
    // The browser-only converter fixture must be optimized before navigation;
    // discovering it later intentionally makes Vite reload the current page.
    const config = {root:app, configFile:path.join(app,'vite.config.ts'), logLevel:'warn',
      optimizeDeps:{include:['@excalidraw/mermaid-to-excalidraw','dompurify','mermaid','katex']},
      cacheDir:path.join(source,'.vite-cache'), server:{host:'127.0.0.1',port:0}, preview:{host:'127.0.0.1',port:0}};
    server = mode === 'dev' ? await createServer(config) : await preview(config);
    if (mode === 'dev') await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    const status = await (await fetch(origin+'/api/archive/status')).json();
    assert.equal(status.archiveRoot,archive);
    const context = await browser.newContext({viewport:{width:1280,height:900}});
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.on('pageerror', error => errors.push(`${mode}: ${error.message}`));
    const observedDemoImages = [];
    page.on('response', response => {
      if (/transport-set.*\.png(?:\?|$)/.test(response.url()) && response.headers()['content-type']?.startsWith('image/png')) observedDemoImages.push(response.url());
    });
    await page.goto(origin);
    await page.getByRole('button',{name:'Erster Unterricht',exact:true}).waitFor();
    // Exercise the extracted navigation through real catalog writes. All names
    // and data belong to this temporary archive, never the installed app.
    const subject = `Testfach ${mode}`, series = `Testreihe ${mode}`;
    const title = `Neue Stunde ${mode}`, renamed = `Umbenannte Stunde ${mode}`;
    await page.getByRole('button',{name:/^Fach in .+ anlegen$/}).click();
    await page.getByRole('textbox',{name:'Name des Fachs',exact:true}).fill(subject);
    await page.getByRole('textbox',{name:'Name des Fachs',exact:true}).press('Enter');
    await page.getByRole('button',{name:`Neue Reihe in ${subject}`,exact:true}).click();
    await page.getByRole('textbox',{name:'Name der Reihe',exact:true}).fill(series);
    await page.getByRole('textbox',{name:'Name der Reihe',exact:true}).press('Enter');
    await page.getByRole('button',{name:`Neuer Unterricht in ${series}`,exact:true}).click();
    await page.getByRole('textbox',{name:'Titel des Unterrichts',exact:true}).fill('Verworfener Entwurf');
    await page.getByRole('textbox',{name:'Titel des Unterrichts',exact:true}).press('Escape');
    assert.equal(await page.getByRole('button',{name:'Verworfener Entwurf',exact:true}).count(),0);
    await page.getByRole('button',{name:`Neuer Unterricht in ${series}`,exact:true}).click();
    await page.getByRole('textbox',{name:'Titel des Unterrichts',exact:true}).fill(title);
    await page.getByRole('textbox',{name:'Titel des Unterrichts',exact:true}).press('Enter');
    // The date is a separate <time>, so use the title span for the lesson row.
    const lessonRow = name => page.locator('.lesson-link').filter({has:page.locator('.lesson-link-title',{hasText:name})});
    await lessonRow(title).click({button:'right'});
    await page.getByRole('menuitem',{name:'Umbenennen',exact:true}).click();
    await page.getByRole('textbox',{name:'Unterricht umbenennen',exact:true}).fill(renamed);
    await page.getByRole('textbox',{name:'Unterricht umbenennen',exact:true}).press('Enter');
    await lessonRow(renamed).waitFor();
    await lessonRow(renamed).click({button:'right'});
    page.once('dialog',dialog => dialog.accept());
    await page.getByRole('menuitem',{name:'Löschen',exact:true}).click();
    await lessonRow(renamed).waitFor({state:'detached'});
    await page.getByText('Papierkorb',{exact:true}).click();
    await page.getByRole('button',{name:`${renamed} wiederherstellen`,exact:true}).click();
    await lessonRow(renamed).waitFor();
    let savedCatalog;
    for (let attempt=0;attempt<100;attempt++) {
      savedCatalog = JSON.parse(await readFile(archiveFile,'utf8')).catalog;
      if (savedCatalog.lessons.some(item => item.title === renamed) && !savedCatalog.trash.some(item => item.label === renamed)) break;
      await new Promise(resolve => setTimeout(resolve,100));
    }
    assert.ok(savedCatalog.lessons.some(item => item.title === renamed));
    assert.ok(!savedCatalog.lessons.some(item => item.title === 'Verworfener Entwurf'));
    assert.ok(!savedCatalog.trash.some(item => item.label === renamed));
    await page.reload();
    await lessonRow(renamed).waitFor();
    await page.getByRole('button',{name:'Unterricht schließen',exact:true}).click();
    await page.getByRole('button',{name:'Unterricht öffnen',exact:true}).click();
    await lessonRow(renamed).waitFor();
    await page.screenshot({path:path.join(output,`${mode}-navigation.png`)});
    checks.push(`${mode}: create subject/series/lesson, cancel, rename, trash/restore, reload and collapse/expand`);
    // Class deletion uses the ordinary catalog tombstone, including active-lesson handoff.
    const groupName = `Lerngruppe ${mode}`, groupLesson = `Unterricht ${mode} Lerngruppe`;
    await page.getByRole('button',{name:/^Klassen & Kurse:/}).click();
    await page.getByRole('button',{name:'Klasse oder Kurs anlegen',exact:true}).click();
    await page.getByRole('textbox',{name:'Name',exact:true}).fill(groupName);
    await page.getByRole('button',{name:'Anlegen',exact:true}).click();
    await page.getByRole('button',{name:`Klassen & Kurse: ${groupName}`,exact:true}).click();
    await page.screenshot({path:path.join(output,`${mode}-class-menu.png`)});
    page.once('dialog',dialog => dialog.dismiss());
    await page.getByRole('button',{name:'Löschen',exact:true}).click();
    await page.getByRole('button',{name:`Klassen & Kurse: ${groupName}`,exact:true}).waitFor();
    await page.getByRole('button',{name:`Klassen & Kurse: ${groupName}`,exact:true}).click();
    page.once('dialog',dialog => dialog.accept());
    await page.getByRole('button',{name:'Löschen',exact:true}).click();
    await page.getByRole('button',{name:`Klassen & Kurse: ${groupName}`,exact:true}).waitFor({state:'detached'});
    await page.getByText('Papierkorb',{exact:true}).click();
    await page.getByRole('button',{name:`${groupName} wiederherstellen`,exact:true}).click();
    await page.getByRole('button',{name:`Fach in ${groupName} anlegen`,exact:true}).click();
    await page.getByRole('textbox',{name:'Name des Fachs',exact:true}).fill('Testfach');
    await page.getByRole('textbox',{name:'Name des Fachs',exact:true}).press('Enter');
    await page.getByRole('button',{name:'Neue Reihe in Testfach',exact:true}).click();
    await page.getByRole('textbox',{name:'Name der Reihe',exact:true}).fill('Testreihe');
    await page.getByRole('textbox',{name:'Name der Reihe',exact:true}).press('Enter');
    await page.getByRole('button',{name:'Neuer Unterricht in Testreihe',exact:true}).click();
    await page.getByRole('textbox',{name:'Titel des Unterrichts',exact:true}).fill(groupLesson);
    await page.getByRole('textbox',{name:'Titel des Unterrichts',exact:true}).press('Enter');
    await lessonRow(groupLesson).click();
    await page.getByRole('heading',{name:groupLesson,exact:true}).waitFor();
    await page.getByRole('button',{name:`Klassen & Kurse: ${groupName}`,exact:true}).click();
    page.once('dialog',dialog => dialog.accept());
    await page.getByRole('button',{name:'Löschen',exact:true}).click();
    await lessonRow(groupLesson).waitFor({state:'detached'});
    const waitForClassTrash = async (present) => {
      for(let attempt=0;attempt<100;attempt++) {
        const saved=JSON.parse(await readFile(archiveFile,'utf8'));
        if(saved.catalog.trash.some(item=>item.kind==='class' && item.label===groupName)===present) return saved;
        await new Promise(resolve=>setTimeout(resolve,100));
      }
      throw Error('Class trash state was not persisted');
    };
    const removedGroup = await waitForClassTrash(true);
    assert.ok(removedGroup.catalog.lessons.some(lesson=>lesson.title===groupLesson));
    await page.reload();
    await page.getByText('Papierkorb',{exact:true}).click();
    await page.getByRole('button',{name:`${groupName} wiederherstellen`,exact:true}).click();
    await lessonRow(groupLesson).waitFor();
    await waitForClassTrash(false);
    await page.reload();
    await lessonRow(groupLesson).waitFor();
    await lessonRow(groupLesson).click();
    await page.getByRole('heading',{name:groupLesson,exact:true}).waitFor();
    // Return to the original class for the existing demo/material checks below.
    await page.getByRole('button',{name:/^Klassen & Kurse:/}).click();
    await page.getByRole('button',{name:'Meine Klasse',exact:true}).click();
    checks.push(`${mode}: class delete cancellation, empty class restore, active lesson handoff, descendants preserved and restore after reload`);

    if (mode === 'dev') {
      const materials = await page.evaluate(async () => {
        const {materialElementsFixture} = await import('/src/canvas/material-elements.browser.ts');
        return materialElementsFixture();
      });
      const {images,media,links,restored} = materials;
      assert.deepEqual(images.map(({x,y,width,height})=>({x,y,width,height})),[
        {x:40,y:140,width:920,height:720},{x:1016,y:350,width:200,height:300}]);
      assert.equal(images[0].roundness.value,20);
      assert.equal(images[1].roundness,null);
      assert.equal(images[1].customData.sourcePageNumber,3);
      assert.deepEqual(media.map(item=>item.customData.materialKind ?? item.customData.surfaceKind),['audio','video','interactive-html','youtube','embedded-app']);
      assert.equal(media[2].customData.interactiveHtmlPageOrientation,'landscape');
      for (const item of [media[1],media[3],media[4]]) assert.deepEqual(item.groupIds,[`tafelraum-image-annotations:${item.id}`]);
      assert.equal(links[0].boundElements[0].id,links[1].id);
      assert.equal(links[1].containerId,links[0].id);
      assert.ok(links.every(item=>item.link==='https://example.org'));
      assert.deepEqual(restored.map(item=>item.customData),[...images,...media,...links].map(item=>item.customData));
      checks.push('Real Excalidraw material creation: image/PDF geometry, provenance, media/app groups, link binding and serialization/restore');
      const dependencies = await page.evaluate(async () => {
        const {dependencySecurityFixture} = await import('/src/dependency-security.browser.ts');
        return dependencySecurityFixture();
      });
      assert.ok(dependencies.elements.length>=3,'the real Mermaid converter must still produce a diagram');
      assert.ok(dependencies.elements.some(element=>element.type==='arrow'));
      assert.ok(dependencies.elements.every(element=>typeof element.id==='string' && element.id.length>0));
      assert.equal(new Set(dependencies.elements.map(element=>element.id)).size,dependencies.elements.length);
      assert.doesNotMatch(dependencies.sanitized,/onerror|javascript:|<script/i);
      assert.equal(dependencies.math.parseErrors,0);
      assert.ok(dependencies.math.fractions>0 && dependencies.math.roots>0,'Mermaid must still render actual MathML formulas');
      checks.push(`Patched dependencies: actual Mermaid conversion, unique native IDs, DOMPurify sanitation and KaTeX ${dependencies.math.version} MathML in Chromium`);
    }
    await page.getByRole('button',{name:'Transport-Demo',exact:true}).click();
    // The archive can commit before Excalidraw finishes decoding/drawing the PNG.
    // Require substantial colored canvas pixels rather than capturing its placeholder.
    await page.waitForFunction(() => [...document.querySelectorAll('canvas')].some(canvas => {
      const context = canvas.getContext('2d');
      if (!context || !canvas.width || !canvas.height) return false;
      const pixels = context.getImageData(0,0,canvas.width,canvas.height).data;
      let colored = 0;
      for (let i=0;i<pixels.length;i+=16) {
        if (pixels[i+3] > 200 && Math.max(pixels[i],pixels[i+1],pixels[i+2])-Math.min(pixels[i],pixels[i+1],pixels[i+2]) > 60) colored++;
      }
      return colored > 2000;
    }));
    // Navigation/reload may have already loaded this asset. Capture its real
    // response URL from the whole page lifetime, then bypass browser cache to
    // verify served bytes without requiring an unnecessary repeat request.
    assert.ok(observedDemoImages.length,'the source asset must be loaded by the actual app');
    const servedImage = await fetch(observedDemoImages.at(-1));
    assert.equal(servedImage.status,200);
    assert.equal(hash(Buffer.from(await servedImage.arrayBuffer())),hash(image));
    await page.screenshot({path:path.join(output,`${mode}-rendered.png`)});
    // Seeds are intentionally not autosaved just by opening them. Move the image
    // through the normal UI, then poll the real archive outside the browser.
    await page.keyboard.press('v');
    await page.mouse.move(790,480);
    await page.mouse.down();
    await page.mouse.move(825,495,{steps:8});
    await page.mouse.up();
    let board;
    for (let attempt=0;attempt<100;attempt++) {
      const response = await fetch(origin+'/api/archive/lessons/lesson-demo/board');
      board = response.ok ? await response.json() : null;
      if (board?.elements?.some(element => !element.isDeleted && element.type === 'image' && element.fileId === 'tafelraum-transport-set' && element.width === 640 && element.height === 427)) break;
      await new Promise(resolve => setTimeout(resolve,100));
    }
    assert.ok(board?.elements?.some(element => !element.isDeleted && element.fileId === 'tafelraum-transport-set'),'UI edit must commit native demo geometry to the isolated archive');
    await writeFile(path.join(output,`${mode}-board.json`),JSON.stringify(board,null,2));
    await context.close();
    if (mode === 'dev') await server.close();
    else await new Promise(resolve => server.httpServer.close(resolve));
    server = null;
    checks.push(`${mode}: actual config starts, own archive, demo bytes + native image snapshot + rendered canvas`);
  }
  assert.deepEqual(errors,[]);
  await writeFile(path.join(output,'report.json'),JSON.stringify({checks,errors,demoSha256:hash(image)},null,2)+'\n');
  console.log(checks.join('\n'));
} finally {
  await browser?.close();
  if (server) {
    if (server.close) await server.close();
    else await new Promise(resolve => server.httpServer.close(resolve));
  }
  process.chdir(originalCwd);
  for (const key of Object.keys(process.env)) if (key.startsWith('TAFELRAUM_')) delete process.env[key];
  Object.assign(process.env,environment);
  await rm(source,{recursive:true,force:true});
}

// Isolated preference + real teacher/Room regression, with an empty test archive.
import assert from 'node:assert/strict';
import {prepareAgentKit} from './prepare-agent-kit.mjs';
import {createAgentKitMiddleware} from '../prototypes/surface-shell-a-b/agent-kit-server.mjs';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {initializeEmptyArchive} from '../prototypes/surface-shell-a-b/desktop-server.mjs';
import {createArchiveMiddleware} from '../prototypes/surface-shell-a-b/archive-server.mjs';
const repository=fileURLToPath(new URL('../',import.meta.url));
const app=path.join(repository,'prototypes/surface-shell-a-b');
const require=createRequire(path.join(app,'package.json'));
const {createServer}=await import(require.resolve('vite'));
const {default:react}=await import(require.resolve('@vitejs/plugin-react'));
const {chromium,webkit}=require('playwright');
const temporary=await mkdtemp(path.join(tmpdir(),'tafelraum-language-'));
const output=path.join(repository,'output/ui-language-browser');
await mkdir(output,{recursive:true});
await initializeEmptyArchive(path.join(temporary,'archive'));
const archiveFile=path.join(temporary,'archive/archive.json');
const fixture=JSON.parse(await readFile(archiveFile,'utf8'));
fixture.classes[0].label='Stift';fixture.catalog.lessons[0].title='Marker';
fixture.catalog.lessons[0].metadata.scheduledFor='2026-10-30';
await writeFile(archiveFile,JSON.stringify(fixture));
await prepareAgentKit(repository,path.join(temporary,'agent-kit'));
const nativeHtml=`<!doctype html><html><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';
import {NativeUiLanguage} from '/src/NativeUiLanguage.tsx';
import {LanguageSettings} from '/src/LanguageSettings.tsx';
window.isTauri=true;window.nativeCalls=[];
window.__TAURI_INTERNALS__={invoke:async(command,args)=>{window.nativeCalls.push({command,args});}};
createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,React.createElement(NativeUiLanguage),React.createElement(LanguageSettings)));
</script></body></html>`;
const server=await createServer({configFile:false,root:app,cacheDir:path.join(temporary,'vite'),
 define:{__TAFELRAUM_VERSION__:JSON.stringify('language-test')},server:{host:'127.0.0.1',port:0,watch:{ignored:['**/agent-kit/**','**/.agent-kit-*/**']}},
 plugins:[react(),{name:'isolated-language',configureServer(vite){
  vite.middlewares.use(createAgentKitMiddleware({kitRoot:path.join(temporary,'agent-kit')}));
  vite.middlewares.use((req,res,next)=>{
   if(req.url==='/native-language.html'){void vite.transformIndexHtml(req.url,nativeHtml).then(body=>{res.setHeader('Content-Type','text/html');res.end(body);});return;}
   if(req.url?.startsWith('/api/')&&!req.url.startsWith('/api/archive')){
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({configured:false,supported:false}));return;
   }next();
  });
  vite.middlewares.use(createArchiveMiddleware(path.join(temporary,'archive')));
 }}]});
const checks=[],errors=[];let browser;
try{
 await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  await rm(path.join(temporary,'archive'),{recursive:true,force:true});
  await initializeEmptyArchive(path.join(temporary,'archive'));
  await writeFile(archiveFile,JSON.stringify(fixture));
  console.log(name+': starting isolated language flow');
  browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>route.request().url().startsWith(origin)||/^(data:|blob:)/.test(route.request().url())?route.continue():route.abort());
  const page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push(name+': '+error.message));
  await page.goto(origin+'/?dev=1');
  await page.getByRole('button',{name:'Stift',exact:true}).waitFor();
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('combobox',{name:'Sprache',exact:true}).selectOption('en');
  await page.getByRole('combobox',{name:'Language',exact:true}).waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.equal(await page.getByRole('heading',{name:'Marker',exact:true}).textContent(),'Marker');
  await page.getByRole('button',{name:'Classes & courses: Stift',exact:true}).waitFor();
  assert.match(await page.locator('.lesson-date-meta').textContent(),/Oct/);
  assert.equal(await page.getByRole('combobox',{name:'Language',exact:true}).inputValue(),'en');
  assert.deepEqual(await page.locator('.settings-language option').allTextContents(),['Deutsch 🇩🇪','English 🇬🇧']);
  await page.getByRole('button',{name:'Pen',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Pen',exact:true}).getAttribute('title'),'Pen (S)');
  await page.getByRole('combobox',{name:'Light theme',exact:true}).waitFor();
  await page.screenshot({path:path.join(output,name+'-settings-en.png'),animations:'disabled'});
  await page.getByRole('switch',{name:'Switch to dark theme',exact:true}).click();
  await page.getByRole('combobox',{name:'Dark theme',exact:true}).waitFor();
  await page.screenshot({path:path.join(output,name+'-settings-en-dark.png'),animations:'disabled'});
  await page.getByRole('switch',{name:'Switch to light theme',exact:true}).click();
  await page.getByRole('button',{name:'Connect agent',exact:true}).click();
  await page.getByRole('textbox',{name:'Starting prompt for your agent',exact:true}).waitFor();
  assert.match(await page.getByRole('textbox',{name:'Starting prompt for your agent',exact:true}).inputValue(),/^Connect to my local Tafelraum app/);
  await page.getByRole('button',{name:'Close agent connection',exact:true}).click();
  await page.getByRole('button',{name:'Keyboard shortcuts',exact:true}).click();
  await page.getByRole('heading',{name:'Keyboard shortcuts',exact:true}).waitFor();
  assert.equal(await page.getByText('Tool shortcuts apply on the canvas, not while typing.',{exact:true}).count(),1);
  await page.getByRole('button',{name:'Close keyboard shortcuts',exact:true}).click();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  // A language change must not remount the canvas or save a scene.
  await page.getByRole('button',{name:'Pen',exact:true}).click();
  await page.getByRole('dialog',{name:'Adjust Pen',exact:true}).waitFor();
  await page.getByRole('listbox',{name:'Pen colour',exact:true}).waitFor();
  await page.getByRole('option',{name:'Pen: Black',exact:true}).click();
  const saved=page.waitForResponse(r=>r.url().endsWith('/lesson-start/board')&&r.request().method()==='PUT'&&r.status()===200);
  await page.mouse.move(620,400);await page.mouse.down();await page.mouse.move(740,450,{steps:10});await page.mouse.up();await saved;
  let before;
  for(let attempt=0;attempt<100;attempt++){
   before=await (await page.request.get(origin+'/api/archive/lessons/lesson-start/board')).json();
   if(before.elements?.some(element=>element.type==='freedraw'&&!element.isDeleted))break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  await page.screenshot({path:path.join(output,name+'-after-stroke.png')});
  assert.ok(before.elements.length>0,name+': expected confirmed stroke, received '+JSON.stringify(before));
  await page.getByRole('button',{name:'Present',exact:true}).click();
  const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Start',exact:true}).click();
  const room=await popup;room.on('pageerror',error=>errors.push(name+' Room: '+error.message));
  await room.locator('canvas').first().waitFor();
  assert.equal(await room.locator('html').getAttribute('lang'),'en');
  await room.getByRole('button',{name:'Show toolbar',exact:true}).click();
  await room.getByRole('button',{name:'Pen',exact:true}).waitFor();
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('combobox',{name:'Language',exact:true}).selectOption('de');
  await room.getByRole('button',{name:'Stift',exact:true}).waitFor();
  assert.equal(await room.locator('html').getAttribute('lang'),'de');
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  const after=await (await page.request.get(origin+'/api/archive/lessons/lesson-start/board')).json();
  assert.deepEqual(after,before,'changing language must not change the saved canvas');
  await page.locator('.live-host-trigger').click();
  await page.getByRole('button',{name:'Beenden',exact:true}).click();
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('combobox',{name:'Sprache',exact:true}).selectOption('en');
  await page.reload();await page.getByRole('button',{name:'Settings',exact:true}).waitFor();
  const restored=await (await page.request.get(origin+'/api/archive/lessons/lesson-start/board')).json();
  assert.deepEqual(restored.elements,before.elements,name+': reload keeps saved stroke');
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('combobox',{name:'Language',exact:true}).focus();
  await page.keyboard.press('d');await page.keyboard.press('Enter');await page.getByRole('button',{name:'Einstellungen',exact:true}).waitFor();
  await page.locator('.settings-popover').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished)));
  const target=await page.getByRole('combobox',{name:'Sprache',exact:true}).boundingBox();assert.ok(target.height>=48,JSON.stringify(target));
  const native=await context.newPage();await native.goto(origin+'/native-language.html');
  await native.waitForFunction(()=>window.nativeCalls?.some(call=>call.command==='set_ui_language'&&call.args.language==='de'));
  await native.getByRole('combobox',{name:'Sprache',exact:true}).selectOption('en');
  await native.waitForFunction(()=>window.nativeCalls.some(call=>call.command==='set_ui_language'&&call.args.language==='en'));
  await native.close();
  checks.push(name+': DE/EN immediate, content names unchanged, date, agent prompt, tooltips, light/dark, shortcuts, pen palette, saved stroke unchanged, open Room sync, reload, keyboard and native bridge');
  await context.close();await browser.close();browser=null;
 }
 assert.deepEqual(errors,[]);await writeFile(path.join(output,'report.json'),JSON.stringify({checks,errors},null,2));console.log(checks.join('\n'));
}finally{await browser?.close();await server.close();await rm(temporary,{recursive:true,force:true});}

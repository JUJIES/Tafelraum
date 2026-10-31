import {settle} from './browser-animation.mjs';
// Isolated preference + real teacher/Room regression, with an empty test archive.
import {canvasAgentPlugin,teachingAgentPlugin} from '../prototypes/surface-shell-a-b/canvas-agent-server.mjs';
import assert from 'node:assert/strict';
import distribution from '../prototypes/surface-shell-a-b/distribution.json' with {type:'json'};
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
const temporary=await mkdtemp(path.join(tmpdir(),'tafelraum-ui-settings-'));
const output=path.join(repository,'output/ui-settings-browser');
await mkdir(output,{recursive:true});
await initializeEmptyArchive(path.join(temporary,'archive'));
const archiveFile=path.join(temporary,'archive/archive.json');
const fixture=JSON.parse(await readFile(archiveFile,'utf8'));
fixture.classes[0].label='Stift';fixture.catalog.lessons[0].title='Marker';
fixture.catalog.lessons[0].metadata.scheduledFor='2026-10-30';
await writeFile(archiveFile,JSON.stringify(fixture));
await prepareAgentKit(repository,path.join(temporary,'agent-kit'));
const server=await createServer({configFile:false,root:app,cacheDir:path.join(temporary,'vite'),
 define:{__TAFELRAUM_VERSION__:JSON.stringify('settings-test')},server:{host:'127.0.0.1',port:0,watch:{ignored:['**/agent-kit/**','**/.agent-kit-*/**']}},
 plugins:[react(),canvasAgentPlugin(),teachingAgentPlugin(),{name:'isolated-language',configureServer(vite){
  vite.middlewares.use(createAgentKitMiddleware({kitRoot:path.join(temporary,'agent-kit')}));
  vite.middlewares.use((req,res,next)=>{
   if(req.url?.startsWith('/api/')&&!req.url.startsWith('/api/archive')){
    res.setHeader('Content-Type','application/json');res.end(JSON.stringify({configured:false,supported:false}));return;
   }next();
  });
  vite.middlewares.use(createArchiveMiddleware(path.join(temporary,'archive')));
 }}]});
const checks=[],errors=[];let browser;
async function assertButtonStates(page,button){
 const inspect=el=>{const s=getComputedStyle(el);return {outline:s.outlineStyle,background:s.backgroundColor,color:s.color,border:s.borderColor,filter:s.filter};};
 await page.mouse.move(0,0);await page.keyboard.press('Tab');await button.focus();await settle(button);
 const focused=await button.evaluate(inspect);assert.equal(focused.outline,'none');
 await button.evaluate(el=>el.blur());await button.hover();await settle(button);
 assert.deepEqual(await button.evaluate(inspect),focused,await button.textContent());
}

try {
 await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 for (const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
  browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>route.request().url().startsWith(origin)||/^(data:|blob:)/.test(route.request().url())?route.continue():route.abort());
  await context.addInitScript(()=>localStorage.setItem('surface-lab-material-shadows','off'));
  const page=await context.newPage();page.setDefaultTimeout(20000);
  page.on('pageerror',error=>errors.push(name+': '+error.message));
  await page.goto(origin+'/?dev=1');
  const settings=page.getByRole('button',{name:'Einstellungen',exact:true});await settings.waitFor();
  assert.equal(await page.locator('.topbar-utility-group > .desktop-update-menu, .topbar-utility-group > .desktop-update-trigger').count(),0);
  const saved=page.waitForResponse(response=>response.url().endsWith('/lesson-start/board')&&response.request().method()==='PUT'&&response.status()===200);
  await page.getByLabel('Material auswählen',{exact:true}).setInputFiles(path.join(app,'src/assets/demo/transport-set.png'));
  const shadow=page.locator('.material-shadow-frame.has-material-shadow').first();
  await shadow.waitFor();await saved;
  assert.notEqual(await shadow.evaluate(el=>getComputedStyle(el).boxShadow),'none');
  await page.reload();await settings.waitFor();await shadow.waitFor();
  assert.notEqual(await shadow.evaluate(el=>getComputedStyle(el).boxShadow),'none','old off preference must not disable restored image shadows');
  const versionLabel=distribution.officialUpdates?'Version und Updates':'Version';
  for(const [theme,width,height] of [['light',1440,1000],['dark',800,1000],['dark',800,320],['light',320,700]]) {
   await page.setViewportSize({width,height});await settings.click();
   if(await page.locator('html').getAttribute('data-theme')!==theme)await page.getByRole('switch',{name:theme==='dark'?'Dunkles Design aktivieren':'Helles Design aktivieren',exact:true}).click();
   await page.getByRole('heading',{name:'Darstellung',exact:true}).waitFor();
   assert.equal(await page.getByRole('switch',{name:'Objektschatten',exact:true}).count(),0);
   assert.notEqual(await shadow.evaluate(el=>getComputedStyle(el).boxShadow),'none');
   await page.getByRole('heading',{name:'Verbindungen',exact:true}).waitFor();
   const themeControl=page.getByRole('combobox',{name:theme==='dark'?'Dunkles Design':'Helles Design',exact:true});
   await settle(page.locator('.settings-popover'));
   const target=await themeControl.boundingBox();assert.ok(target.height>=48,JSON.stringify(target));
   const language=page.getByRole('combobox',{name:'Sprache',exact:true});
   const languageTarget=await language.boundingBox();assert.ok(languageTarget.height>=48,JSON.stringify(languageTarget));
   assert.equal(languageTarget.width,target.width);
   for(const control of [themeControl,language]) assert.equal(await control.evaluate(el=>{
    const wrapper=el.parentElement,box=wrapper.getBoundingClientRect(),visual=getComputedStyle(wrapper,'::before');
    return box.height-parseFloat(visual.top)-parseFloat(visual.bottom);
   }),36,'visible dropdown face is flatter while the native input retains its touch height');
   assert.ok(target.width<=128,'dropdowns remain compact');
   assert.equal(languageTarget.x,target.x,'dropdowns share the same column');
   const appearance=page.locator('.settings-section').first();
   assert.deepEqual(await appearance.locator('.settings-select-row > span:first-child').allTextContents(),['Design','Sprache']);
   for(const control of [themeControl,language]){
    assert.equal(await control.evaluate(el=>{
     const box=el.getBoundingClientRect(),row=el.closest('.settings-select-row').getBoundingClientRect(),menu=el.closest('.settings-popover').getBoundingClientRect();
     return box.left>=row.left&&box.right<=row.right&&box.left>=menu.left&&box.right<=menu.right;
    }),true,'dropdown stays inside its row and popover');
   }

   assert.equal(await language.inputValue(),'de');
   assert.equal(await language.evaluate(el=>el.selectedOptions[0].label),'Deutsch 🇩🇪');
   const menu=await page.locator('.settings-popover').boundingBox();assert.ok(menu.x>=0&&menu.y+menu.height<=height);
   if(height===320)assert.ok(await page.locator('.settings-popover').evaluate(el=>el.scrollHeight>el.clientHeight),'short viewport must scroll within settings');
   if(width>320&&height>320){
    await page.getByRole('button',{name:'Agent verbinden',exact:true}).click();
    const connection=page.getByRole('dialog',{name:'Agent verbinden',exact:true});
    const close=connection.getByRole('button',{name:'Agentenverbindung schließen',exact:true});
    await connection.getByRole('textbox',{name:'Startauftrag für deinen Agenten',exact:true}).waitFor();
    assert.equal(await close.evaluate(el=>getComputedStyle(el).outlineStyle),'none','modal autofocus has no outer ring');
    // WebKit follows the platform's Tab-to-buttons setting; establish keyboard
    // modality, then focus the same native control without changing its tab order.
    await page.keyboard.press('Tab');await close.focus();
    assert.equal(await close.evaluate(el=>el===document.activeElement),true);
    await page.mouse.move(0,0);
    await settle(close);
    const keyboardSurface=await close.evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.notEqual(keyboardSurface,'rgba(0, 0, 0, 0)','keyboard focus remains visible');
    await close.hover();await settle(close);
    assert.equal(await close.evaluate(el=>getComputedStyle(el).backgroundColor),keyboardSurface,'hover and keyboard use the same surface');
    await page.screenshot({path:path.join(output,`${name}-${theme}-agent-button-states.png`),animations:'disabled'});
    await page.keyboard.press('Enter');assert.equal(await connection.isVisible(),false);
    await settings.click();
    await page.getByRole('button',{name:'Material hinzufügen',exact:true}).click();
    const panel=page.locator('.lesson-material-panel[data-state="open"]');await panel.waitFor();
    const row=panel.locator('.lesson-material-item[data-used="true"]').first();await row.waitFor();
    // Exercise the source's real payload writer and the host's validated drop;
    // cross-engine native drag mechanics are outside this button-state check.
    const transfer=await page.evaluateHandle(()=>new DataTransfer());
    await row.dispatchEvent('dragstart',{dataTransfer:transfer});
    assert.ok(await transfer.evaluate(value=>value.types.length>0));
    await page.locator('.workspace').dispatchEvent('drop',{dataTransfer:transfer,clientX:500,clientY:300});
    await row.dispatchEvent('dragend',{dataTransfer:transfer});await transfer.dispose();
    const duplicate=page.locator('dialog[open]').filter({has:page.locator('#material-duplicate-title')});await duplicate.waitFor();
    for(const button of await duplicate.getByRole('button').all())await assertButtonStates(page,button);
    await duplicate.getByRole('button',{name:'Abbrechen',exact:true}).click();
    await panel.locator('.lesson-material-remove').first().click();
    const removal=page.getByRole('dialog',{name:'Material aus dem Archiv entfernen?',exact:true});await removal.waitFor();
    for(const button of await removal.getByRole('button').all())await assertButtonStates(page,button);
    await page.screenshot({path:path.join(output,`${name}-${theme}-material-removal-states.png`),animations:'disabled'});
    await removal.getByRole('button',{name:'Abbrechen',exact:true}).click();
    await page.getByRole('button',{name:'Material hinzufügen',exact:true}).click();await settings.click();

   }
   if(width===320){
    await language.selectOption('en');
    for(const control of await appearance.locator('select').all()) assert.equal(await control.evaluate(el=>{
     const box=el.getBoundingClientRect(),row=el.closest('.settings-select-row').getBoundingClientRect();return box.left>=row.left&&box.right<=row.right;
    }),true,'English dropdowns stay within their rows');
    await page.screenshot({path:path.join(output,`${name}-english-compact-settings.png`),animations:'disabled'});
    await page.locator('.settings-language select').selectOption('de');await page.keyboard.press('Escape');continue;
   }
   await page.getByRole('button',{name:versionLabel,exact:true}).focus();await page.keyboard.press('Enter');
   const dialog=page.getByRole('dialog',{name:versionLabel,exact:true});await dialog.waitFor();
   assert.equal(await page.locator('.settings-popover').count(),0);
   assert.equal(await dialog.getByRole('button',{name:'Nach Updates suchen',exact:true}).count(),distribution.officialUpdates?1:0);
   if(distribution.officialUpdates)assert.equal(await dialog.getByRole('button',{name:'Nach Updates suchen',exact:true}).isDisabled(),true);
   const rect=await dialog.boundingBox();assert.ok(rect.x>=0&&rect.x+rect.width<=width);
   await page.screenshot({path:path.join(output,`${name}-${theme}-${width}x${height}-version.png`),animations:'disabled'});
   await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.equal(await settings.evaluate(el=>el===document.activeElement),true);
   await settings.click();await page.screenshot({path:path.join(output,`${name}-${theme}-${width}x${height}-settings.png`),animations:'disabled'});await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Präsentieren',exact:true}).click();
  const popup=page.waitForEvent('popup');await page.getByRole('button',{name:'Starten',exact:true}).click();const room=await popup;
  room.on('pageerror',error=>errors.push(name+' Room: '+error.message));
  await room.getByRole('button',{name:'Werkzeugleiste einblenden',exact:true}).click();
  const hide=room.getByRole('button',{name:'Werkzeugleiste ausblenden',exact:true});await hide.waitFor();
  await hide.focus();assert.equal(await hide.evaluate(el=>getComputedStyle(el).outlineStyle),'none','Room shares the ring-free button focus');
  assert.equal(await hide.locator('.fluent-toolbar-icon').getAttribute('style'),await page.locator('.toolbar-visibility-button .fluent-toolbar-icon').getAttribute('style')); 
  assert.equal(await hide.evaluate(el=>getComputedStyle(el).color),await room.locator('.room-tools__drag').evaluate(el=>getComputedStyle(el).color));
  const position=await room.locator('.room-tools').boundingBox();
  await room.screenshot({path:path.join(output,name+'-room-toolbar.png'),animations:'disabled'});
  await hide.click();await room.getByRole('button',{name:'Werkzeugleiste einblenden',exact:true}).click();
  assert.deepEqual(await room.locator('.room-tools').boundingBox(),position);
  if(!await page.getByRole('region',{name:'Präsentieren',exact:true}).isVisible())await page.locator('.live-host-trigger').click();
  await page.getByRole('button',{name:'Beenden',exact:true}).click();
  await context.close();

  // Mock only the native IPC boundary; exercise the real settings, hook and dialog.
  const native=await browser.newContext({viewport:{width:1440,height:1000}});
  await native.addInitScript(()=>{
   window.isTauri=true;window.testHandlers={};window.testCommands=[];
   window.testOverview={currentVersion:'settings-test',availableVersion:null,phase:'idle'};
   window.__TAURI_INTERNALS__={metadata:{currentWindow:{label:'main'},currentWebview:{label:'main'}},transformCallback:fn=>fn,invoke:async(cmd,args)=>{
    window.testCommands.push(cmd);
    if(cmd==='plugin:event|listen'){window.testHandlers[args.event]=args.handler;return 1;}
    if(cmd==='plugin:app|version')return 'settings-test';
    if(cmd==='desktop_update_overview')return window.testOverview;
    if(cmd==='request_desktop_update_check'&&window.testUpdateError)throw Error('Synthetic update failure');
    return null;
   }};
   window.__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener:()=>{}};
   window.testEmitUpdate=payload=>{window.testOverview=payload;window.testHandlers['tafelraum-update-overview']?.({payload});};
  });
  const nativePage=await native.newPage();nativePage.setDefaultTimeout(20000);
  nativePage.on('pageerror',error=>errors.push(name+' native boundary: '+error.message));
  await nativePage.goto(origin+'/?dev=1');
  const nativeSettings=nativePage.getByRole('button',{name:'Einstellungen',exact:true});await nativeSettings.waitFor();
  await nativeSettings.click();await nativePage.getByRole('button',{name:versionLabel,exact:true}).click();
  const nativeDialog=nativePage.getByRole('dialog',{name:versionLabel,exact:true});await nativeDialog.waitFor();
  if(distribution.officialUpdates){
   const subscriptions=await nativePage.evaluate(()=>window.testCommands.filter(cmd=>cmd==='desktop_update_overview').length);assert.ok(subscriptions>=1);
   await nativePage.evaluate(()=>window.testUpdateError=true);
   await nativeDialog.getByRole('button',{name:'Nach Updates suchen',exact:true}).click();await nativeDialog.getByText('Synthetic update failure',{exact:true}).waitFor();
   await nativeDialog.getByRole('button',{name:'Schließen',exact:true}).click();
   await nativePage.evaluate(()=>window.testEmitUpdate({currentVersion:'settings-test',availableVersion:'0.2.0',phase:'idle'}));
   await nativeDialog.waitFor();await nativePage.locator('.settings-update-dot').waitFor();
   await nativePage.screenshot({path:path.join(output,name+'-available-update.png'),animations:'disabled'});
   await nativeDialog.getByRole('button',{name:'Später',exact:true}).click();
   await nativePage.evaluate(()=>window.testEmitUpdate({currentVersion:'settings-test',availableVersion:'0.2.0',phase:'idle'}));
   await nativeSettings.click();await nativePage.getByRole('button',{name:versionLabel,exact:true}).click();await nativeDialog.waitFor();
   assert.equal(await nativePage.evaluate(()=>window.testCommands.filter(cmd=>cmd==='desktop_update_overview').length),subscriptions,'settings toggles must not restart the native subscription');
   await nativePage.keyboard.press('Escape');
  }else{
   assert.equal(await nativePage.evaluate(()=>window.testCommands.some(cmd=>cmd==='desktop_update_overview'||cmd==='request_desktop_update_check')),false);
   assert.equal(await nativePage.locator('.settings-update-dot').count(),0);
  }
  await native.close();
  // Native automatic hints must wait for presentations and appear once afterwards.
  if(distribution.officialUpdates){
   const fixture=await browser.newContext();await fixture.addInitScript(()=>{
    window.isTauri=true;window.testHandlers={};window.__TAURI_EVENT_PLUGIN_INTERNALS__={unregisterListener:()=>{}};
    window.__TAURI_INTERNALS__={transformCallback:fn=>fn,invoke:async(cmd,args)=>{
     if(cmd==='plugin:event|listen'){window.testHandlers[args.event]=args.handler;return 1;}
     if(cmd==='plugin:app|version')return 'settings-test';
     if(cmd==='desktop_update_overview')return {currentVersion:'settings-test',availableVersion:null,phase:'idle'};
    }};
   });
   const test=await fixture.newPage();await test.goto(origin+'/src/desktop-update-prompt.browser.html');
   await test.waitForFunction(()=>window.setPresenting&&window.emitUpdate);
   await test.evaluate(()=>window.setPresenting(true));
   await test.evaluate(()=>window.emitUpdate({currentVersion:'settings-test',availableVersion:'0.3.0',phase:'idle'}));
   assert.equal(await test.getByRole('dialog').count(),0);
   await test.evaluate(()=>window.setPresenting(false));await test.getByRole('dialog').waitFor();
   await test.getByRole('button',{name:'Später',exact:true}).click();
   await test.evaluate(()=>{window.setPresenting(true);});await test.evaluate(()=>window.setPresenting(false));
   assert.equal(await test.getByRole('dialog').count(),0);await fixture.close();
  }
  checks.push(`${name}: ${distribution.profile}, grouped settings, theme control, light/dark and narrow/short windows, keyboard return, Room collapse/reopen, native update lifecycle or public absence`);
  await browser.close();browser=null;
 }
 assert.deepEqual(errors,[]);await writeFile(path.join(output,'report.json'),JSON.stringify({profile:distribution.profile,checks,errors},null,2));console.log(checks.join('\n'));
} finally {await browser?.close();await server.close();await rm(temporary,{recursive:true,force:true});}

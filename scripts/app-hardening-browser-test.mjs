import distribution from '../prototypes/surface-shell-a-b/distribution.json' with {type:'json'};
// Isolated archive and provider. No private configuration, service, login or live data.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
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
const temporary=await mkdtemp(path.join(tmpdir(),'tafelraum-hardening-'));
const output=path.join(repository,'output/app-hardening-regression');
await mkdir(output,{recursive:true});
await initializeEmptyArchive(path.join(temporary,'archive'));
let remoteConfigured=false,remoteFails=false;
const guardHtml=`<!doctype html><html><body><div id="root"></div><script type="module">
import React from 'react';import {createRoot} from 'react-dom/client';
import {DesktopPersistenceGuard} from '/src/DesktopPersistenceGuard.tsx';import '/src/styles.css';
window.isTauri=true;window.handlers={};window.ack=[];window.flushStarted=false;
window.__TAURI_INTERNALS__={transformCallback:fn=>fn,invoke:async(cmd,args)=>{
 if(cmd==='plugin:event|listen'){window.handlers[args.event]=args.handler;return 1;}
 if(cmd==='confirm_desktop_persistence')window.ack.push(args);
}};
createRoot(document.getElementById('root')).render(React.createElement(React.Fragment,null,
 React.createElement('input',{'aria-label':'Draft'}),React.createElement(DesktopPersistenceGuard,{flush:async()=>{
 window.focusDuringFlush=document.activeElement?.tagName;window.flushStarted=true;await new Promise((resolve,reject)=>window.finishFlush=ok=>ok?resolve():reject(Error('Synthetic disk failure')));
}})));
</script></body></html>`;
const server=await createServer({configFile:false,root:app,cacheDir:path.join(temporary,'vite'),
 define:{__TAFELRAUM_VERSION__:JSON.stringify('hardening-test')},server:{host:'127.0.0.1',port:0},
 plugins:[react(),{name:'isolated-hardening',configureServer(vite){
  vite.middlewares.use((req,res,next)=>{
   if(req.url==='/guard.html'){void vite.transformIndexHtml(req.url,guardHtml).then(body=>{res.setHeader('Content-Type','text/html');res.end(body);});return;}
   if(req.url==='/api/live/config'){res.setHeader('Content-Type','application/json');res.statusCode=remoteFails?503:200;res.end(JSON.stringify({configured:remoteConfigured,baseUrl:remoteConfigured?'https://fixture.invalid':null}));return;}
   if(req.url?.startsWith('/api/')&&!req.url.startsWith('/api/archive')){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({configured:false,supported:false}));return;}
   next();
  });
  vite.middlewares.use(createArchiveMiddleware(path.join(temporary,'archive')));
 }}]});
const checks=[],errors=[],outbound=[];
let browser;
try{
 await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  await rm(path.join(temporary,'archive'),{recursive:true,force:true});await initializeEmptyArchive(path.join(temporary,'archive'));
  browser=await engine.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});
  await context.route('**/*',route=>{
   const url=route.request().url();if(url.startsWith(origin)||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
   outbound.push({engine:name,url});
   if(url.startsWith('https://lerndeck.jujies.app/teacher'))return route.fulfill({contentType:'text/html',body:`<body style="font:20px system-ui;background:#fff;color:#222"><h1>Synthetic Lerndeck</h1><script>parent.postMessage({type:'tafelraum:app-ready',appId:'lerndeck'},'*')</script></body>`});
   return route.abort();
  });
  const page=await context.newPage();const personalApiRequests=[];page.on('request',request=>{if(/\/api\/(?:live\/|settings\/sentence-check)/.test(request.url()))personalApiRequests.push(request.url());});page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push({engine:name,error:error.message}));
  remoteConfigured=false;remoteFails=false;
  await page.goto(origin+'/?dev=1');
  await page.getByRole('button',{name:'Widgets',exact:true}).waitFor();
  if(distribution.remoteCanvas){
  await page.getByRole('button',{name:'Präsentieren',exact:true}).click();
  const remote=page.getByRole('button',{name:'Remote Canvas',exact:true});
  await page.getByText('Remote Canvas ist auf diesem Gerät noch nicht eingerichtet.',{exact:true}).waitFor();
  assert.equal(await remote.isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Starten',exact:true}).isEnabled(),true);
  await page.screenshot({path:path.join(output,name+'-remote-unconfigured.png')});
  await page.getByRole('region',{name:'Präsentieren',exact:true}).getByRole('button',{name:'Schließen',exact:true}).click();
  remoteFails=true;await page.getByRole('button',{name:'Präsentieren',exact:true}).click();
  await page.getByRole('button',{name:'Erneut prüfen',exact:true}).waitFor();
  remoteFails=false;remoteConfigured=true;
  await page.getByRole('button',{name:'Erneut prüfen',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Remote Canvas'&&!button.disabled));
  await page.getByRole('region',{name:'Präsentieren',exact:true}).getByRole('button',{name:'Schließen',exact:true}).click();
  checks.push(name+': Remote setup, error and retry respect the local capability; Room remains available');

  }else{
   await page.getByRole('button',{name:'Präsentieren',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Remote Canvas',exact:true}).count(),0);
   await page.getByRole('button',{name:'Room Canvas',exact:true}).waitFor();
   await page.getByRole('region',{name:'Präsentieren',exact:true}).getByRole('button',{name:'Schließen',exact:true}).click();
   checks.push(name+': public presentation offers Room without Remote setup or requests');
  }
  assert.equal(outbound.filter(entry=>entry.engine===name).length,0,'empty canvas must not contact providers');
  if(distribution.embeddedApps.length){
  const appSaved=page.waitForResponse(response=>response.url().endsWith('/lesson-start/board')&&response.request().method()==='PUT'&&response.status()===200).then(()=>true,error=>error.message);
  await page.getByRole('button',{name:'Apps',exact:true}).click();
  await page.getByRole('menuitem',{name:'Lerndeck auf der Fläche öffnen',exact:true}).click();
  await page.frameLocator('.is-embedded-app iframe').getByText('Synthetic Lerndeck').waitFor();
  await page.waitForFunction(()=>!document.querySelector('.is-embedded-app .is-overlay'));
  assert.equal(await appSaved,true);
  // A previous opt-out must not keep the removed preference alive.
  await page.evaluate(()=>localStorage.setItem('tafelraum-lerndeck-connected-v1','false'));
  page.on('dialog',dialog=>dialog.accept());
  await page.reload();
  await page.frameLocator('.is-embedded-app iframe').getByText('Synthetic Lerndeck').waitFor();
  assert.equal(await page.locator('.is-embedded-app').count(),1,'reload preserves the saved carrier');
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  assert.equal(await page.getByRole('switch',{name:'Lerndeck verbinden',exact:true}).count(),0);
  await page.screenshot({path:path.join(output,name+'-settings.png'),animations:'disabled'});
  checks.push(name+': Lerndeck loads on placement and restored references without a connection switch or old preference gate');

  }else{
   assert.equal(await page.getByRole('button',{name:'Apps',exact:true}).count(),0);
   await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
   await page.getByRole('group',{name:'Einstellungen',exact:true}).waitFor();
   assert.equal(await page.getByText('KI-Anschluss',{exact:true}).count(),0);
   assert.equal(await page.getByRole('switch',{name:'Lerndeck verbinden',exact:true}).count(),0);
   await page.screenshot({path:path.join(output,name+'-public-settings.png'),animations:'disabled'});
   await page.getByRole('switch',{name:'Dunkles Design aktivieren',exact:true}).click();
   await page.getByRole('switch',{name:'Helles Design aktivieren',exact:true}).waitFor();
   await page.screenshot({path:path.join(output,name+'-public-settings-dark.png'),animations:'disabled'});
   await page.getByRole('switch',{name:'Helles Design aktivieren',exact:true}).click();
   await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
   const saved=page.waitForResponse(r=>r.url().endsWith('/lesson-start/board')&&r.request().method()==='PUT'&&r.status()===200);
   await page.getByRole('button',{name:'Stift',exact:true}).click();
   await page.mouse.move(600,400);await page.mouse.down();await page.mouse.move(700,450,{steps:12});await page.mouse.up();await saved;
   assert.equal(outbound.filter(entry=>entry.engine===name).length,0);
   await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
   await page.getByRole('button',{name:'Version',exact:true}).click();
   await page.getByRole('dialog',{name:'Version',exact:true}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Nach Updates suchen',exact:true}).count(),0);
   await page.getByRole('dialog',{name:'Version',exact:true}).getByRole('button',{name:'Schließen',exact:true}).click();
   await page.getByRole('button',{name:'Präsentieren',exact:true}).click();
   const popup=page.waitForEvent('popup');
   await page.getByRole('button',{name:'Starten',exact:true}).click();
   const room=await popup;
   await room.locator('canvas').first().waitFor();
   await page.getByRole('button',{name:'Fenster anzeigen',exact:true}).waitFor();
   await room.screenshot({path:path.join(output,name+'-public-room.png')});
   const closed=room.waitForEvent('close');
   await page.getByRole('button',{name:'Beenden',exact:true}).click();
   await closed;
   assert.deepEqual(personalApiRequests,[],'Public UI and Room must never ask for personal services');
   checks.push(name+': public settings in light/dark, version without updater, confirmed save and actual Room window');
  }

  // Exercise the actual StrictMode Canvas initial-data path, not only the dialog.
  await page.goto(origin+'/guard.html');
  await page.evaluate(async()=>{
    const snapshot=await (await fetch('/api/archive/lessons/lesson-start/board')).json();
    snapshot.viewport.scrollX+=75;
    const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('tafelraum-surface-lab',3);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    await new Promise((resolve,reject)=>{const tx=db.transaction('canvas-snapshots','readwrite');tx.objectStore('canvas-snapshots').put(snapshot,'lesson-start');tx.oncomplete=resolve;tx.onerror=reject;});db.close();
  });
  await page.goto(origin+'/?dev=1');
  await page.getByRole('heading',{name:'Welche Fassung öffnen?',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'canvas-recovery-title','opening the dialog must not focus the discard action');
  await page.screenshot({path:path.join(output,name+'-real-canvas-recovery.png')});
  await page.getByRole('button',{name:'Entwurf wiederherstellen',exact:true}).click();
  await page.getByRole('button',{name:'Material hinzufügen',exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Welche Fassung öffnen?',exact:true}).isVisible(),false);
  checks.push(name+': actual StrictMode Canvas recovery resolves once and loads the saved elements');

  const guard=await context.newPage();await guard.goto(origin+'/guard.html');
  await guard.waitForFunction(()=>window.handlers?.['tafelraum-flush-before-exit']);
  await guard.getByRole('textbox',{name:'Draft'}).fill('unsaved');
  await guard.evaluate(()=>{void window.handlers['tafelraum-flush-before-exit']({payload:17});});
  await guard.waitForFunction(()=>window.flushStarted);
  assert.equal(await guard.locator('dialog[open]').count(),1);
  assert.notEqual(await guard.evaluate(()=>window.focusDuringFlush),'INPUT');
  assert.deepEqual(await guard.evaluate(()=>window.ack),[],'close cannot be acknowledged before the write completes');
  await guard.screenshot({path:path.join(output,name+'-saving.png')});
  await guard.evaluate(()=>window.finishFlush(false));
  await guard.waitForFunction(()=>window.ack.length===1);
  assert.deepEqual(await guard.evaluate(()=>window.ack),[{id:17,saved:false}]);
  assert.equal(await guard.locator('dialog[open]').count(),0);
  await guard.evaluate(()=>{window.flushStarted=false;void window.handlers['tafelraum-flush-before-exit']({payload:18});});
  await guard.waitForFunction(()=>window.flushStarted);await guard.evaluate(()=>window.finishFlush(true));
  await guard.waitForFunction(()=>window.ack.length===2);
  assert.deepEqual(await guard.evaluate(()=>window.ack[1]),{id:18,saved:true});
  assert.equal(await guard.locator('dialog[open]').count(),1,'keep input blocked until native exit or release');
  await guard.evaluate(()=>window.handlers['tafelraum-exit-released']({}));
  await guard.waitForFunction(()=>!document.querySelector('dialog[open]'));
  await guard.evaluate(()=>{window.flushStarted=false;void window.handlers['tafelraum-flush-before-exit']({payload:19});});
  await guard.waitForFunction(()=>window.flushStarted);
  await guard.evaluate(()=>{window.oldFinish=window.finishFlush;window.handlers['tafelraum-exit-released']({});window.flushStarted=false;void window.handlers['tafelraum-flush-before-exit']({payload:20});});
  await guard.waitForFunction(()=>window.flushStarted);
  await guard.evaluate(()=>window.oldFinish(true));
  assert.equal(await guard.locator('dialog[open]').count(),1);
  assert.equal(await guard.evaluate(()=>window.ack.length),2,'expired completion cannot approve a new exit');
  await guard.evaluate(()=>window.finishFlush(true));await guard.waitForFunction(()=>window.ack.length===3);
  assert.deepEqual(await guard.evaluate(()=>window.ack[2]),{id:20,saved:true});
  checks.push(name+': desktop handshake blocks edits, waits for commit, rejects errors and releases after cancelled update');
  await guard.close();
  await context.close();await browser.close();browser=null;
 }
 await writeFile(path.join(output,'verification.json'),JSON.stringify({checks,errors,outbound},null,2)+'\n');
 assert.deepEqual(errors,[]);console.log(checks.join('\n'));
}catch(error){console.error('Browser regression failed:',error);throw error;}finally{await browser?.close();await server.close();await rm(temporary,{recursive:true,force:true});}

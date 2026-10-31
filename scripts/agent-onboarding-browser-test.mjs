// Agent-neutral reference flow through the real CLIs and teacher UI.
// Separate source copy, empty archive, no private rules/plugins/provider calls.
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {access,mkdir,readFile,writeFile,copyFile,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {snapshotBuildSource} from './snapshot-build-source.mjs';

const run=promisify(execFile),repository=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(repository,'output/agent-onboarding'),source=path.join(output,`source-${process.pid}`);
const app=path.join(source,'prototypes/surface-shell-a-b'),originalCwd=process.cwd();
const require=createRequire(path.join(repository,'prototypes/surface-shell-a-b/package.json'));
const {createServer}=await import(require.resolve('vite'));
const {chromium,webkit}=require('playwright');
const environment={...process.env};
for(const key of Object.keys(process.env))if(key.startsWith('TAFELRAUM_'))delete process.env[key];
const selectedEngine=process.argv[2];if(selectedEngine&&!['chromium','webkit'].includes(selectedEngine))throw Error('Engine: chromium oder webkit');
const report={status:'running',profile:null,engines:[],errors:[],outbound:[],limits:'Local CLI/browser reference run; no claim of automatic setup or acceptance for every agent/model, native hardware or worksheet printing.'};
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
let browser,server;
try{
 await mkdir(output,{recursive:true});
 await snapshotBuildSource(repository,source,{includeLocalFixtures:false});
 // The generic snapshot can link the pinned office cache; this flow needs none.
 await rm(path.join(source,'local-data'),{recursive:true,force:true});
 await rm(path.join(source,'docs/unterricht/beispiele'),{recursive:true,force:true});
 for(const absent of ['data','test-materials','local-data','.git'])await assert.rejects(access(path.join(source,absent)),{code:'ENOENT'});
 report.profile=JSON.parse(await readFile(path.join(app,'distribution.json'),'utf8')).profile;
 const guide=await readFile(path.join(source,'CONTRIBUTING.md'),'utf8');
 const bootstrap=guide.match(/node --input-type=module <<'NODE'\n([\s\S]*?)\nNODE/)[1];
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(selectedEngine&&engineName!==selectedEngine)continue;
  const checks=[],commands=[],result={engine:engineName,checks,commands};report.engines.push(result);
  await run(process.execPath,['--input-type=module','-e',bootstrap],{cwd:app});
  const archiveRoot=path.join(source,'local-data/dev-onboarding/archive');
  await assert.rejects(access(path.join(archiveRoot,'_rules')),{code:'ENOENT'});
  const archiveBefore=JSON.parse(await readFile(path.join(archiveRoot,'archive.json'),'utf8'));
  const seriesId=archiveBefore.catalog.series[0].id;
  process.chdir(app);
  server=await createServer({root:app,configFile:path.join(app,'vite.config.ts'),logLevel:'warn',cacheDir:path.join(source,`.vite-agent-${engineName}`),
   server:{host:'127.0.0.1',port:0,fs:{allow:[source,path.join(repository,'prototypes/surface-shell-a-b/node_modules')]},watch:{ignored:['**/src-tauri/**','**/desktop-resources/**','**/local-data/**','**/output/**']}},
   optimizeDeps:{include:['@excalidraw/excalidraw']}});
  await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
  const kitResponse=await fetch(origin+'/api/agent-kit',{headers:{'X-Tafelraum-Agent':'1'}});
  assert.equal(kitResponse.status,200);const kit=await kitResponse.json();
  assert.equal(kit.protocol,'tafelraum-agent-kit-v1');
  assert.ok(kit.root.startsWith(app+path.sep));
  assert.equal(JSON.parse(await readFile(path.join(kit.root,'agent-kit.json'),'utf8')).revision,kit.revision);
  checks.push('Running app supplies its local kit, canonical skills and helpers without global plugins');
  async function cli(name,args,{failure=false}={}){
   const executable=path.join(kit.root,'scripts',name);
   const full=[...args,...(name==='tafelraum-unterricht.mjs'&&!args.includes('--help')?['--archive-root',archiveRoot]:[]),'--url',origin];
   let response;
   try{response=await run(process.execPath,[executable,...full],{cwd:source,timeout:50000,maxBuffer:4*1024*1024});assert.equal(failure,false,'Expected command rejection');}
   catch(error){if(!failure)throw error;assert.equal(error.code,1);response=error;}
   commands.push({cli:name,action:args[0],rejected:failure});
   return args.includes('--help')?response.stdout:JSON.parse(response.stdout);
  }
  const teaching=(...args)=>cli('tafelraum-unterricht.mjs',args);
  const canvas=(action,session,extra=[],options={})=>cli('tafelraum-canvas-agent.mjs',[action,...(session?['--session',session]:[]),...extra],options);
  assert.match(await teaching('--help'),/create --series/);
  assert.match(await cli('tafelraum-canvas-agent.mjs',['--help']),/validate --file/);
  const status=await teaching('status');assert.equal(status.archiveRoot,archiveRoot);
  checks.push('Documented bootstrap and CLI help work without private rules, examples or global skills');
  browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  // Hold only host-to-Room readiness ACKs to exercise real input before confirmation.
  await context.addInitScript(()=>{
   const Original=window.BroadcastChannel;
   window.__roomInputAcks=[];window.__holdRoomInputReady=false;
   window.BroadcastChannel=class extends Original {
    postMessage(message){
     if(message?.type==='input-ready'&&message.ready===true&&window.__holdRoomInputReady){
      window.__roomInputAcks.push(()=>super.postMessage(message));return;
     }
     super.postMessage(message);
    }
   };
  });
  await context.route('**/*',route=>{
   const url=route.request().url();if(url.startsWith(origin+'/')||/^(data|blob):/.test(url))return route.continue();
   report.outbound.push({engine:engineName,url});return route.abort();
  });
  const page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',error=>report.errors.push({engine:engineName,error:error.message}));
  page.on('response',response=>{if(response.url().endsWith('.woff2')&&response.status()>=400)report.errors.push({engine:engineName,font:response.url(),status:response.status()});});
  await page.goto(origin);
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Agent verbinden',exact:true}).click();
  await page.getByRole('textbox',{name:'Startauftrag für deinen Agenten',exact:true}).waitFor();
  assert.equal(await page.getByRole('textbox',{name:'Startauftrag für deinen Agenten',exact:true}).inputValue(),kit.prompt);
  await page.screenshot({path:path.join(output,`${engineName}-connection.png`)});
  await page.getByRole('button',{name:'Agentenverbindung schließen',exact:true}).click();
  await page.keyboard.press('Escape');
  const sessionsPath='/api/teaching-agent/sessions';
  const waitForTeacher=async()=>{
   for(let tries=0;tries<100;tries++){
    const response=await fetch(origin+sessionsPath,{headers:{'X-Tafelraum-Agent':'1'}});
    if((await response.json()).sessions.length===1)return;
    await new Promise(resolve=>setTimeout(resolve,100));
   }
   throw Error('Teacher session was not ready');
  };
  await waitForTeacher();
  const created=await teaching('create','--series',seriesId,'--title','Agenten-Probe');
  assert.equal(created.persisted,true);assert.equal(created.view.refreshed,true);const lessonId=created.lesson.id;
  assert.equal((await teaching('create','--series',seriesId,'--title','Agenten-Probe')).created,false);
  const found=await teaching('find','--query','Agenten-Probe');assert.equal(found.lessons.length,1);
  assert.equal((await teaching('resolve','--lesson',lessonId)).lesson.id,lessonId);
  checks.push('Lesson created through the ordinary archive queue; repeated creation resolves to the same lesson');
  const work=path.join(source,'output',engineName);await mkdir(work,{recursive:true});
  const original=path.join(app,'src/assets/demo/transport-set.png'),materialFile=path.join(work,'agent-demo.png');
  await copyFile(original,materialFile);const bytes=await readFile(materialFile);
  assert.deepEqual(bytes.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));assert.equal(bytes.readUInt32BE(16),1536);assert.equal(bytes.readUInt32BE(20),1024);
  const imported=await teaching('import','--lesson',lessonId,'--file',materialFile);
  assert.equal(imported.persisted,true);assert.equal(imported.result.created,true);const materialPath=imported.result.material.path;
  assert.equal((await teaching('import','--lesson',lessonId,'--file',materialFile)).result.created,false);
  const materials=await teaching('materials','--lesson',lessonId);assert.equal(materials.materials.length,1);
  assert.equal(digest(await readFile(path.join(archiveRoot,materials.basis.archivePath,materialPath))),digest(bytes));
  checks.push('Public demo image prepared and checked, then imported additively with source bytes preserved and no duplicates');
  const opened=await teaching('open','--lesson',lessonId);assert.equal(opened.context.lessonId,lessonId);assert.equal(opened.context.ready,true);
  let sessions;
  for(let tries=0;tries<50;tries++){
   sessions=(await canvas('sessions')).filter(session=>session.lessonId===lessonId);
   if(sessions.length===1)break;await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(sessions.length,1);let session=sessions[0].id;
  let inspected=await canvas('inspect',session);assert.equal(inspected.ok,true);assert.equal(inspected.lessonId,lessonId);assert.equal(inspected.state.objects.length,0);
  assert.equal(inspected.materials[0].path,materialPath);
  const commandFile=path.join(work,'canvas.json');
  const command={type:'apply',expectedRevision:inspected.state.revision,operations:[
   {type:'text',key:'title',x:40,y:40,text:'Agenten-Probe',fontSize:36},
   {type:'material',key:'picture',x:40,y:160,path:materialPath},
   {type:'shape',key:'notes',x:1080,y:160,width:420,height:550,shape:'rectangle'}],viewport:{scrollX:60,scrollY:60,zoom:0.7}};
  await writeFile(commandFile,JSON.stringify(command));
  assert.equal((await canvas('validate',null,['--file',commandFile])).type,'apply');
  const requestId='onboarding-objects',applied=await canvas('apply',session,['--file',commandFile,'--request-id',requestId]);
  assert.equal(applied.ok,true);assert.equal(applied.persisted,true);
  const replay=await canvas('apply',session,['--file',commandFile,'--request-id',requestId]);assert.deepEqual(replay.created,applied.created);
  const stale=await canvas('apply',session,['--file',commandFile,'--request-id','onboarding-stale'],{failure:true});
  assert.equal(stale.ok,false);assert.equal(stale.applied,false);
  const pictureId=applied.created.picture[0];
  for(const [number,target] of [[1,{rect:{x:0,y:0,width:1550,height:1000}}],[2,{elementId:pictureId}]]){
   inspected=await canvas('inspect',session);
   const clipFile=path.join(work,`clip-${number}.json`);await writeFile(clipFile,JSON.stringify({type:'clip',expectedRevision:inspected.state.revision,number,...target}));
   const clip=await canvas('apply',session,['--file',clipFile,'--request-id',`onboarding-clip-${number}`]);assert.equal(clip.ok,true);assert.equal(clip.persisted,true);
  }
  inspected=await canvas('inspect',session);assert.equal(inspected.state.persistence.pending,false);assert.equal(inspected.state.clips.length,2);
  assert.equal(inspected.state.objects.filter(object=>object.materialPath).length,1);
  assert.equal((await teaching('context')).context.lessonId,lessonId);
  assert.equal(await page.getByRole('button',{name:'Beenden',exact:true}).count(),0);
  await page.screenshot({path:path.join(output,`${engineName}-prepared.png`),animations:'disabled'});
  const boardUrl=origin+`/api/archive/lessons/${lessonId}/board`,saved=await (await fetch(boardUrl)).json();
  const ids=inspected.state.objects.map(object=>object.id).sort();
  assert.deepEqual(saved.elements.filter(element=>!element.isDeleted).map(element=>element.id).sort(),ids);
  assert.equal(saved.clips.length,2);
  checks.push('Live teacher confirmed native text, archived image, shape and two clips; replay creates no duplicate, stale revision is rejected');
  await page.reload();
  await waitForTeacher();
  for(let tries=0;tries<50;tries++){
   sessions=(await canvas('sessions')).filter(item=>item.lessonId===lessonId);if(sessions.length===1)break;await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(sessions.length,1);session=sessions[0].id;
  let restored;
  for(let tries=0;tries<50;tries++){
   restored=await canvas('inspect',session);
   if(!restored.state.persistence.pending&&restored.state.persistence.state==='saved')break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(restored.ok,true);assert.deepEqual(restored.state.objects.map(object=>object.id).sort(),ids);assert.equal(restored.state.clips.length,2);
  assert.equal(restored.state.objects.find(object=>object.id===applied.created.title[0]).text,'Agenten-Probe');
  assert.equal(restored.state.persistence.pending,false);assert.equal(restored.state.persistence.state,'saved');
  // Excalidraw restores absent bindings as [] and omits an empty HTML-state map.
  // Compare every other stored field unchanged; these are equivalent empty values.
  const normalized=snapshot=>({...snapshot,interactiveHtmlStates:snapshot.interactiveHtmlStates??{},
   elements:snapshot.elements.map(element=>({...element,boundElements:element.boundElements??[]}))});
  assert.deepEqual(normalized(await (await fetch(boardUrl)).json()),normalized(saved));
  result.lessonId=lessonId;result.objects=ids.length;result.clips=2;result.materialSha256=digest(bytes);
  await page.screenshot({path:path.join(output,`${engineName}-reloaded.png`),animations:'disabled'});
  checks.push('Reload restores identical object IDs, text, material and clips from the confirmed archive; presentation remains stopped');
  // Use the shipped local pipeline for a real HTML handoff, independent of plugins.
  const packageSource=path.join(kit.root,'docs/agent-examples/starter-interactive');
  const html=await teaching('install-html','--lesson',lessonId,'--source-dir',packageSource,'--mode','digital');
  assert.equal(html.persisted,true);
  const afterHtml=await teaching('materials','--lesson',lessonId);
  assert.equal(afterHtml.materials.length,2);
  const worksheetSource=path.join(work,'starter-worksheet');
  await cp(path.join(kit.root,'docs/agent-examples/starter-worksheet'),worksheetSource,{recursive:true});
  const worksheetEntry=path.join(worksheetSource,'index.html');
  await writeFile(worksheetEntry,(await readFile(worksheetEntry,'utf8')).replace('</main>','<label for="teacher-note">Weiterer Hinweis</label><textarea id="teacher-note" name="teacher-note" aria-label="Weiterer Hinweis"></textarea></main>'));

  await run(process.execPath,[path.join(kit.root,'scripts/check-interactive-material.mjs'),'--source-dir',worksheetSource,'--require-print'],{cwd:work});
  checks.push('Shipped HTML example installs through the ordinary bound archive pipeline; worksheet example passes the technical print gate (actual print acceptance remains open)');
  const htmlMaterial=afterHtml.materials.find(material=>material.kind==='interactive');assert.ok(htmlMaterial);
  inspected=await canvas('inspect',session);
  await writeFile(commandFile,JSON.stringify({type:'apply',expectedRevision:inspected.state.revision,operations:[{type:'material',key:'html',path:htmlMaterial.path,x:500,y:160}]}));
  const placedHtml=await canvas('apply',session,['--file',commandFile,'--request-id','onboarding-html']);
  assert.equal(placedHtml.ok,true);assert.equal(placedHtml.persisted,true);
  inspected=await canvas('inspect',session);
  await writeFile(commandFile,JSON.stringify({type:'clip',expectedRevision:inspected.state.revision,number:3,elementId:placedHtml.created.html[0]}));
  assert.equal((await canvas('apply',session,['--file',commandFile,'--request-id','onboarding-html-clip'])).persisted,true);
  const teacherFrame=page.frameLocator('.interactive-html-canvas-frame iframe');
  await teacherFrame.getByRole('button',{name:'A',exact:true}).waitFor();
  await page.getByRole('button',{name:'Präsentieren',exact:true}).click();
  await page.getByRole('button',{name:'Room Canvas',exact:true}).click();
  const popup=context.waitForEvent('page');await page.getByRole('button',{name:'Starten',exact:true}).click();
  const room=await popup;room.on('pageerror',error=>report.errors.push({engine:engineName,room:error.message}));
  await page.getByRole('button',{name:'Materialclip 3 zeigen',exact:true}).click();
  const roomFrame=room.frameLocator('[data-room-material-id] iframe');
  await teacherFrame.getByRole('button',{name:'A',exact:true}).click();
  await roomFrame.getByRole('button',{name:'A',exact:true}).waitFor();
  await room.waitForFunction(()=>document.querySelector('[data-room-material-id] iframe'));
  // Cross-origin sandbox frames remain isolated; assertions operate through their UI.
  for(let attempt=0;attempt<50;attempt++){
   if(await roomFrame.getByRole('button',{name:'A',exact:true}).getAttribute('aria-pressed')==='true')break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(await roomFrame.getByRole('button',{name:'A',exact:true}).getAttribute('aria-pressed'),'true');
  await roomFrame.getByRole('button',{name:'B',exact:true}).click();
  for(let attempt=0;attempt<50;attempt++){
   if(await teacherFrame.getByRole('button',{name:'B',exact:true}).getAttribute('aria-pressed')==='true')break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(await teacherFrame.getByRole('button',{name:'B',exact:true}).getAttribute('aria-pressed'),'true');
  let htmlBoard;
  for(let attempt=0;attempt<100;attempt++){
   htmlBoard=await (await fetch(boardUrl)).json();
   if(htmlBoard.interactiveHtmlStates?.[placedHtml.created.html[0]]?.state?.choice==='b')break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.equal(htmlBoard.interactiveHtmlStates?.[placedHtml.created.html[0]]?.state?.choice,'b','Wait for the real archive acknowledgement before reload');
  await writeFile(path.join(output,`${engineName}-html-saved.json`),JSON.stringify(htmlBoard,null,2));
  await room.screenshot({path:path.join(output,`${engineName}-html-room.png`)});
  if(!await page.getByRole('button',{name:'Beenden',exact:true}).isVisible())await page.getByRole('button',{name:/^Room Canvas,/}).click();
  await page.getByRole('button',{name:'Beenden',exact:true}).click();
  if(!room.isClosed())await room.close();
  await page.reload();
  await page.frameLocator('.interactive-html-canvas-frame iframe').getByRole('button',{name:'B',exact:true}).waitFor();
  for(let attempt=0;attempt<50;attempt++){
   if(await page.frameLocator('.interactive-html-canvas-frame iframe').getByRole('button',{name:'B',exact:true}).getAttribute('aria-pressed')==='true')break;
   await new Promise(resolve=>setTimeout(resolve,100));
  }
  await writeFile(path.join(output,`${engineName}-html-reloaded.json`),JSON.stringify({board:await (await fetch(boardUrl)).json(),state:await page.frameLocator('.interactive-html-canvas-frame iframe').locator('body').evaluate(()=>window.tafelraumLive.getState())},null,2));
  assert.equal(await page.frameLocator('.interactive-html-canvas-frame iframe').getByRole('button',{name:'B',exact:true}).getAttribute('aria-pressed'),'true');
  result.htmlPipeline={materials:2,objects:4,clips:3,roomBothDirections:true,restoredChoice:'b'};
  checks.push('Kit HTML placed and clipped by shipped CLI; real teacher/Room actions synchronize both directions and survive saved reload');

  // A plain worksheet must stay inert, including keyboard focus, until the host ACK.
  await teaching('install-html','--lesson',lessonId,'--source-dir',worksheetSource,'--mode','worksheet');
  const worksheet=(await teaching('materials','--lesson',lessonId)).materials.find(item=>item.path.includes('starter-worksheet'));
  assert.ok(worksheet);
  sessions=(await canvas('sessions')).filter(item=>item.lessonId===lessonId);session=sessions[0].id;
  inspected=await canvas('inspect',session);
  await writeFile(commandFile,JSON.stringify({type:'apply',expectedRevision:inspected.state.revision,operations:[{type:'material',key:'worksheet',path:worksheet.path,x:1100,y:160}]}));
  const worksheetPlaced=await canvas('apply',session,['--file',commandFile,'--request-id','worksheet-ready-place']);
  inspected=await canvas('inspect',session);
  await writeFile(commandFile,JSON.stringify({type:'clip',expectedRevision:inspected.state.revision,number:4,elementId:worksheetPlaced.created.worksheet[0]}));
  await canvas('apply',session,['--file',commandFile,'--request-id','worksheet-ready-clip']);
  const sheetTeacher=page.frameLocator('iframe[title="Arbeitsblatt – technische Vorlage"]').locator('textarea').first();
  await page.bringToFront();await sheetTeacher.fill('Bestätigter Lehrertext');
  await page.evaluate(()=>{window.__holdRoomInputReady=true;});
  await page.getByRole('button',{name:'Präsentieren',exact:true}).click();
  await page.getByRole('button',{name:'Room Canvas',exact:true}).click();
  const waitingRoom=context.waitForEvent('page');await page.getByRole('button',{name:'Starten',exact:true}).click();
  const pendingRoom=await waitingRoom;
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Materialclip 4 zeigen',exact:true}).click();
  const sheetSurface=pendingRoom.locator('.live-interactive-material__surface');
  const roomSheet=pendingRoom.frameLocator('iframe[title="Arbeitsblatt – technische Vorlage"]').locator('textarea').first();
  await roomSheet.waitFor();
  await page.waitForFunction(()=>window.__roomInputAcks.length>0);
  assert.equal(await sheetSurface.evaluate(element=>element.inert),true);
  await pendingRoom.bringToFront();await roomSheet.evaluate(element=>element.focus());await pendingRoom.keyboard.type('ZU FRUEH');
  assert.equal(await roomSheet.inputValue(),'Bestätigter Lehrertext');
  assert.equal(await roomSheet.evaluate(element=>document.hasFocus()&&document.activeElement===element),false);
  await pendingRoom.screenshot({path:path.join(output,`${engineName}-worksheet-pending.png`)});
  await page.evaluate(()=>{window.__holdRoomInputReady=false;window.__roomInputAcks.splice(0).forEach(send=>send());});
  await pendingRoom.waitForFunction(()=>!document.querySelector('.live-interactive-material__surface').inert);
  await pendingRoom.bringToFront();await roomSheet.fill('Antwort aus Room');
  for(let n=0;n<100&&await sheetTeacher.inputValue()!=='Antwort aus Room';n++)await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(await sheetTeacher.inputValue(),'Antwort aus Room');
  await page.bringToFront();await page.frameLocator('iframe[title="Arbeitsblatt – technische Vorlage"]').locator('#teacher-note').fill('Neue Lehrerantwort');
  for(let n=0;n<100&&await pendingRoom.frameLocator('iframe[title="Arbeitsblatt – technische Vorlage"]').locator('#teacher-note').inputValue()!=='Neue Lehrerantwort';n++)await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(await pendingRoom.frameLocator('iframe[title="Arbeitsblatt – technische Vorlage"]').locator('#teacher-note').inputValue(),'Neue Lehrerantwort');
  await page.evaluate(()=>{window.__holdRoomInputReady=true;});
  await page.getByRole('button',{name:'Materialclip 3 zeigen',exact:true}).click();
  await pendingRoom.frameLocator('[data-room-material-id] iframe').getByRole('button',{name:'A',exact:true}).waitFor();
  await page.waitForFunction(()=>window.__roomInputAcks.length>0);
  const previousAcks=await page.evaluate(()=>window.__roomInputAcks.length);
  await page.getByRole('button',{name:'Materialclip 4 zeigen',exact:true}).click();
  await roomSheet.waitFor();
  await page.waitForFunction(count=>window.__roomInputAcks.length>count,previousAcks);
  assert.equal(await sheetSurface.evaluate(element=>element.inert),true);
  const beforeEarlyInput=await roomSheet.inputValue();
  await pendingRoom.bringToFront();await roomSheet.evaluate(element=>element.focus());await pendingRoom.keyboard.type('AUCH ZU FRUEH');
  assert.equal(await roomSheet.inputValue(),beforeEarlyInput);
  assert.equal(await pendingRoom.frameLocator('iframe[title="Arbeitsblatt – technische Vorlage"]').locator('#teacher-note').inputValue(),'Neue Lehrerantwort');
  // Releasing old and current ACKs together must unlock only the current target.
  await page.evaluate(()=>{window.__holdRoomInputReady=false;window.__roomInputAcks.splice(0).forEach(send=>send());});
  await pendingRoom.waitForFunction(()=>!document.querySelector('.live-interactive-material__surface').inert);
  await pendingRoom.bringToFront();await roomSheet.fill('Nach Clipwechsel');
  for(let n=0;n<100&&await sheetTeacher.inputValue()!=='Nach Clipwechsel';n++)await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(await sheetTeacher.inputValue(),'Nach Clipwechsel');
  await page.bringToFront();await page.frameLocator('iframe[title="Arbeitsblatt – technische Vorlage"]').locator('#teacher-note').fill('Neue Lehrerantwort');
  for(let n=0;n<100;n++){
   const board=await (await fetch(boardUrl)).json();
   const savedWorksheet=JSON.stringify(board.interactiveHtmlStates?.[worksheetPlaced.created.worksheet[0]]);
   if(savedWorksheet.includes('Neue Lehrerantwort')&&savedWorksheet.includes('Nach Clipwechsel'))break;
   if(n===99)throw Error('Worksheet did not persist');await new Promise(resolve=>setTimeout(resolve,100));
  }
  if(!await page.getByRole('button',{name:'Beenden',exact:true}).isVisible())await page.getByRole('button',{name:/^Room Canvas,/}).click();
  await page.getByRole('button',{name:'Beenden',exact:true}).click();if(!pendingRoom.isClosed())await pendingRoom.close();
  await page.reload();
  const restoredSheet=page.frameLocator('iframe[title="Arbeitsblatt – technische Vorlage"]').locator('textarea').first();
  await restoredSheet.waitFor();
  for(let n=0;n<100&&await restoredSheet.inputValue()!=='Nach Clipwechsel';n++)await new Promise(resolve=>setTimeout(resolve,100));
  assert.equal(await restoredSheet.inputValue(),'Nach Clipwechsel');
  checks.push('Worksheet pointer/keyboard input stays inert until exact host readiness ACK; both directions and saved reload then succeed');
  result.worksheetReadiness={earlyInputBlocked:true,keyboardBlocked:true,roomToTeacher:true,teacherToRoom:true,savedReload:true};

  await assert.rejects(access(path.join(archiveRoot,'_rules')),{code:'ENOENT'});
  await context.close();await browser.close();browser=null;await server.close();server=null;
  await rm(path.join(source,'local-data'),{recursive:true,force:true});
  await rm(path.join(app,'.env.local'));
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.outbound,[]);report.status='passed';
 console.log(report.engines.map(result=>`${result.engine}: ${result.checks.join('\n')}`).join('\n'));
}catch(error){report.status='failed';report.failure=error.message;throw error;}finally{
 await browser?.close();await server?.close();process.chdir(originalCwd);
 for(const key of Object.keys(process.env))if(key.startsWith('TAFELRAUM_'))delete process.env[key];
 for(const [key,value] of Object.entries(environment))if(key.startsWith('TAFELRAUM_'))process.env[key]=value;
 await writeFile(path.join(output,'verification.json'),JSON.stringify(report,null,2)+'\n');
}

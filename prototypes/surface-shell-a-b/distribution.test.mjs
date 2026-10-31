// Both distributions exercise their actual desktop server with an isolated archive.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import distribution from './distribution.json' with {type:'json'};
import {createDesktopServer} from './desktop-server.mjs';
import {createDirectSentenceGateway,sentenceCheckBridgeScript} from './interactive-html-sentence-check.mjs';

test('distribution selection and native update configuration agree',async()=>{
 const config=JSON.parse(await readFile(new URL('./src-tauri/tauri.conf.json',import.meta.url),'utf8'));
 assert.equal(Boolean(config.plugins?.updater?.endpoints?.length),distribution.officialUpdates);
 assert.equal(config.bundle.createUpdaterArtifacts,distribution.officialUpdates);
 if(distribution.profile==='public'){
  assert.deepEqual(distribution.embeddedApps,[]);
  assert.equal(distribution.remoteCanvas,false);
  assert.equal(config.plugins?.updater,undefined);
 }
});

test('desktop distribution exposes only its selected services and preserves files',async t=>{
 const temp=await mkdtemp(path.join(tmpdir(),'tafelraum-distribution-'));
 t.after(()=>rm(temp,{recursive:true,force:true}));
 const archiveRoot=path.join(temp,'archive'),webRoot=path.join(temp,'web');
 await mkdir(webRoot);await writeFile(path.join(webRoot,'index.html'),'<!doctype html>Public core');
 let credentials=0,network=0;
 const aiKeyStore={status:async()=>{credentials++;return {configured:true,supported:true};},read:async()=>{credentials++;throw Error('Never read in this test');},save:async()=>{credentials++;throw Error('Never save in this test');},remove:async()=>{credentials++;throw Error('Never remove in this test');}};
 const server=await createDesktopServer({archiveRoot,webRoot,aiKeyStore,sentenceRequest:async()=>{network++;throw Error('No provider calls');},liveRequest:async()=>{network++;throw Error('No service calls');}});
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const before=await readFile(path.join(archiveRoot,'archive.json'));
 const status=await fetch(origin+'/api/settings/sentence-check');
 assert.equal(status.status,distribution.profile==='public'?404:200);
 if(distribution.profile==='public'){
  for(const method of ['PUT','DELETE'])assert.equal((await fetch(origin+'/api/settings/sentence-check',{method,headers:{Origin:origin,'Content-Type':'application/json'},body:method==='PUT'?JSON.stringify({key:'synthetic-not-a-secret'}):undefined})).status,404);
  for(const endpoint of ['/api/live/config','/api/live/rooms'])assert.equal((await fetch(origin+endpoint)).status,404);
  assert.equal(credentials,0);
  assert.equal(sentenceCheckBridgeScript(),'');
  await assert.rejects(createDirectSentenceGateway({keyStore:aiKeyStore})({},{}),{status:503});
 }else{
  assert.equal(distribution.embeddedApps[0]?.sourceUrl,'https://lerndeck.jujies.app/teacher?embed=tafelraum');
  assert.deepEqual(await status.json(),{configured:true,supported:true});assert.equal(credentials,1);
  assert.equal((await fetch(origin+'/api/live/config')).status,200);
  assert.ok(sentenceCheckBridgeScript().includes('window.tafelraumSentenceCheck'));
 }
 assert.equal((await fetch(origin+'/api/archive')).status,200);
 assert.deepEqual(await readFile(path.join(archiveRoot,'archive.json')),before);
 const board={schemaVersion:1,elements:[{id:'old-personal-carrier',type:'rectangle',x:0,y:0,width:100,height:100,version:1,isDeleted:false,customData:{surfaceKind:'embedded-app',embeddedAppId:'unavailable-personal-app'}}],viewport:{scrollX:0,scrollY:0,zoom:{value:1}},clips:[]};
 const stored=await fetch(origin+'/api/archive/lessons/lesson-start/board',{method:'PUT',headers:{'Content-Type':'application/json','If-None-Match':'*',Origin:origin},body:JSON.stringify(board)});
 assert.equal(stored.status,200);
 const restored=await (await fetch(origin+'/api/archive/lessons/lesson-start/board')).json();
 assert.deepEqual(restored.elements,board.elements,'Unavailable integrations must not erase stored carriers');
 assert.equal(network,0);
});

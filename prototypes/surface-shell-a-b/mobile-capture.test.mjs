import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createDesktopServer} from './desktop-server.mjs';
import {createCaptureRelay} from '../../services/mobile-capture/server.mjs';
import {createMobileCaptureReceiver} from './mobile-capture-receiver.mjs';
import {newSecret,packCapture,encryptCapture,decryptCapture,parseBytes,fromBase64} from '../../shared/mobile-capture/protocol.mjs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0ioAAAAASUVORK5CYII=','base64');
test('mobile capture reaches the canonical lesson import, survives reload and deduplicates lost-response retries',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'tafelraum-mobile-capture-'));
  const adminKey=newSecret(),relay=createCaptureRelay({adminKey,publicUrl:'http://127.0.0.1:0'});
  await relay.listen(0);
  const webRoot=path.join(root,'web'),archiveRoot=path.join(root,'archive'),notesRoot=path.join(root,'notes'),captureConfigPath=path.join(root,'mobile-capture.json');
  await mkdir(webRoot);await writeFile(path.join(webRoot,'index.html'),'<!doctype html><title>Capture QA</title>');
  await writeFile(captureConfigPath,JSON.stringify({baseUrl:relay.publicUrl,adminKey}));
  let desktop=await createDesktopServer({webRoot,archiveRoot,notesRoot});
  let base=`http://127.0.0.1:${desktop.address().port}`;
  try{
    assert.equal((await(await fetch(`${base}/api/mobile-capture/status`)).json()).configured,true);
    const started=await fetch(`${base}/api/mobile-capture/session`,{method:'POST',body:JSON.stringify({lessonId:'lesson-start'})});
    assert.equal(started.status,200);
    const local=await started.json(),invite=new URL(local.session.inviteUrl);
    assert.equal(local.session.lessonId,'lesson-start');assert.equal(invite.search,'');
    const [token,secret]=invite.hash.slice(1).split('.'),sessionId=invite.pathname.split('/').at(-1);
    const remote=`${relay.publicUrl}/api/capture/sessions/${sessionId}`,headers={Authorization:`Bearer ${token}`};
    for(let tries=0;tries<100;tries++){
      const status=await(await fetch(remote,{headers})).json();
      assert.equal(JSON.stringify(status).includes('lesson-start'),false);
      if(status.receiverConnected)break;
      await new Promise(resolve=>setTimeout(resolve,10));
    }
    const id=newSecret(),bytes=await encryptCapture(secret,`file:${sessionId}:${id}`,packCapture({mime:'image/png'},png));
    const send=()=>fetch(`${remote}/transfers/${id}`,{method:'PUT',headers,body:bytes});
    const stored=await send();assert.equal(stored.status,200);
    const result=await stored.json();assert.equal(result.saved,true);
    const receipt=parseBytes(await decryptCapture(secret,`receipt:${sessionId}:${id}`,fromBase64(result.receipt)));
    const materialPath=`faecher/subject-start/reihen/series-start/stunden/lesson-start/material/${receipt.name}`;
    assert.deepEqual(await readFile(path.join(archiveRoot,materialPath)),png);
    assert.deepEqual(await(await send()).json(),result);
    const collection=await(await fetch(`${base}/api/archive/lessons/lesson-start/materials`)).json();
    assert.equal(collection.materials.length,1);
    const status=await(await fetch(`${base}/api/mobile-capture/status`)).json();
    assert.equal(status.revision,1);assert.equal(status.lastReceivedLessonId,'lesson-start');assert.equal(status.session.savedCount,1);
    const wrongId=newSecret(),wrong=await encryptCapture(newSecret(),`file:${sessionId}:${wrongId}`,packCapture({mime:'image/png'},png));
    assert.equal((await fetch(`${remote}/transfers/${wrongId}`,{method:'PUT',headers,body:wrong})).status,422);
    assert.equal((await(await fetch(`${base}/api/archive/lessons/lesson-start/materials`)).json()).materials.length,1);
    assert.equal((await fetch(`${base}/api/mobile-capture/session`,{method:'DELETE'})).status,200);
    assert.equal((await send()).status,410);
    assert.deepEqual(relay.diagnostics(),{sessions:0,bytes:0});
    await new Promise(resolve=>desktop.close(resolve));
    desktop=await createDesktopServer({webRoot,archiveRoot,notesRoot});
    base=`http://127.0.0.1:${desktop.address().port}`;
    const reloaded=await(await fetch(`${base}/api/archive/lessons/lesson-start/materials`)).json();
    assert.equal(reloaded.materials[0].name,receipt.name);
    assert.deepEqual(await readFile(path.join(archiveRoot,materialPath)),png);
    assert.equal((await(await fetch(`${base}/api/mobile-capture/status`)).json()).session,null);
  }finally{
    await new Promise(resolve=>desktop.close(resolve));await relay.close();await rm(root,{recursive:true,force:true});
  }
});

test('failed archive storage is rejected and can be retried; trashed destinations revoke reception',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'tafelraum-capture-failure-'));
  const adminKey=newSecret(),relay=createCaptureRelay({adminKey,publicUrl:'http://127.0.0.1:0'});
  await relay.listen(0);
  const webRoot=path.join(root,'web'),archiveRoot=path.join(root,'archive'),notesRoot=path.join(root,'notes'),configPath=path.join(root,'capture.json');
  await mkdir(webRoot);await writeFile(path.join(webRoot,'index.html'),'<!doctype html><title>QA</title>');
  await writeFile(configPath,JSON.stringify({baseUrl:relay.publicUrl,adminKey}));
  const desktop=await createDesktopServer({webRoot,archiveRoot,notesRoot,captureConfigPath:path.join(root,'absent.json')});
  const base=`http://127.0.0.1:${desktop.address().port}`;
  let failStorage=true;
  const receiver=createMobileCaptureReceiver({configPath,getArchiveUrl:()=>base,fetchImpl:(url,options)=>{
    if(failStorage&&String(url).includes('/materials/file?'))return Promise.resolve(new Response(JSON.stringify({error:'Word-Konvertierung fehlgeschlagen.'}),{status:500}));
    return fetch(url,options);
  }});
  try{
    const started=await receiver.start('lesson-start'),invite=new URL(started.session.inviteUrl);
    const [token,secret]=invite.hash.slice(1).split('.'),sessionId=invite.pathname.split('/').at(-1);
    const remote=`${relay.publicUrl}/api/capture/sessions/${sessionId}`,headers={Authorization:`Bearer ${token}`};
    const id=newSecret(),bytes=await encryptCapture(secret,`file:${sessionId}:${id}`,packCapture({mime:'image/png'},png));
    const send=()=>fetch(`${remote}/transfers/${id}`,{method:'PUT',headers,body:bytes});
    assert.equal((await send()).status,422);
    assert.equal((await receiver.status()).revision,0);
    assert.equal((await receiver.status()).session.error,'Word-Konvertierung fehlgeschlagen.');
    assert.equal((await(await fetch(`${base}/api/archive/lessons/lesson-start/materials`)).json()).materials.length,0);
    failStorage=false;assert.equal((await send()).status,200);
    assert.equal((await receiver.status()).revision,1);
    const archive=await(await fetch(`${base}/api/archive`)).json();
    archive.catalog.trash=[{kind:'subject',id:'subject-start',classId:'class-start',label:'Mein Fach',deletedAt:new Date().toISOString()}];
    assert.equal((await fetch(`${base}/api/archive`,{method:'PUT',body:JSON.stringify({catalog:archive.catalog})})).status,200);
    const secondId=newSecret(),second=await encryptCapture(secret,`file:${sessionId}:${secondId}`,packCapture({mime:'image/png'},png));
    assert.equal((await fetch(`${remote}/transfers/${secondId}`,{method:'PUT',headers,body:second})).status,410);
    assert.equal((await receiver.status()).session,null);
    await assert.rejects(receiver.start('lesson-start'),/verfügbare eigene Materialablage/);
  }finally{
    await receiver.close();await new Promise(resolve=>desktop.close(resolve));await relay.close();await rm(root,{recursive:true,force:true});
  }
});

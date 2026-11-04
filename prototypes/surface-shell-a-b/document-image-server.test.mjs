import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createDesktopServer } from './desktop-server.mjs';

test('document jobs are same-origin, optional, serialized and released after cancellation', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'tafelraum-document-image-'));
  const configPath = path.join(root, 'config.json');
  const web = path.join(root, 'web'); await mkdir(web);
  await writeFile(path.join(web, 'index.html'), '<!doctype html><title>Test</title>');
  const executable = path.join(root, 'worker.mjs');
  await writeFile(executable, `let input='';process.stdin.on('data',x=>input+=x);process.stdin.on('end',()=>{
const job=JSON.parse(input);setTimeout(()=>console.log(JSON.stringify({dataURL:job.dataURL,...(job.operation==='perspective'?{originalDataURL:job.originalDataURL}:{}),width:1,height:1,rect:{x:0,y:0,width:1,height:1},uncertain:false})),job.wait?30000:10);
});`, { mode: 0o700 });
  // A JS file with a Unix shebang is not an executable on Windows. Keep real
  // worker processes, cancellation and serialization, but launch Node directly.
  const server = await createDesktopServer({ archiveRoot: path.join(root,'archive'), webRoot:web, documentImageConfigPath:configPath, documentImageSpawnWorker(command, args, options) {
    assert.equal(command, process.execPath);
    assert.equal(args[1], configPath);
    return spawn(command, [executable], options);
  } });
  const base = `http://127.0.0.1:${server.address().port}/api/document-image`;
  const headers = { 'content-type':'application/json', 'x-tafelraum-document-image':'1' };
  const dataURL = 'data:image/png;base64,AA==';
  const post = (extra={}) => fetch(`${base}/process`, { method:'POST', headers, body:JSON.stringify({dataURL,...extra}) });
  try {
    assert.deepEqual(await (await fetch(`${base}/status`)).json(), {configured:false});
    await writeFile(configPath, JSON.stringify({python:process.execPath,repo:root,weights:executable,mbdWeights:executable}));
    assert.deepEqual(await (await fetch(`${base}/status`)).json(), {configured:true});
    for (const origin of ['null','https://evil.example', 'http://127.0.0.1:1']) {
      assert.equal((await fetch(`${base}/process`, {method:'POST',headers:{...headers,origin},body:'{}'})).status,403);
    }
    assert.equal((await fetch(`${base}/process`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'})).status,403);
    assert.equal((await fetch(`${base}/status`,{headers:{'sec-fetch-site':'same-site'}})).status,403);
    assert.equal((await post()).status,200);
    assert.equal((await post({operation:'perspective'})).status,400);
    const perspective=await fetch(`${base}/perspective`,{method:'POST',headers,body:JSON.stringify({dataURL,originalDataURL:dataURL,quad:[]})});
    assert.equal(perspective.status,200);
    assert.equal((await perspective.json()).originalDataURL,dataURL);
    assert.equal((await fetch(`${base}/perspective`,{method:'POST',headers:{...headers,origin:'null'},body:'{}'})).status,403);
    const controller = new AbortController();
    const waiting = fetch(`${base}/process`,{method:'POST',headers,body:JSON.stringify({dataURL,wait:true}),signal:controller.signal}).catch(error => error);
    await new Promise(resolve => setTimeout(resolve,80));
    assert.equal((await post()).status,409);
    controller.abort(); await waiting;
    let status;
    for (let i=0;i<30;i++) { await new Promise(resolve => setTimeout(resolve,20)); status=(await post()).status; if(status===200)break; }
    assert.equal(status,200);
    assert.equal((await fetch(`${base}/process`,{method:'POST',headers,body:'broken-json'})).status,400);
    assert.equal((await post()).status,200);
  } finally {
    await new Promise(resolve => server.close(resolve)); await rm(root,{recursive:true,force:true});
  }
});

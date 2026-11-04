import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

test('teaching CLI responds from a Windows namespaced installed-style path', {skip:process.platform!=='win32'}, ()=>{
 const cli=fileURLToPath(new URL('./tafelraum-unterricht.mjs',import.meta.url));
 const result=JSON.parse(execFileSync(process.execPath,[path.toNamespacedPath(cli),'--help'],{encoding:'utf8'}));
 assert.match(result.help,/status.*find/);
 for(const name of ['check-interactive-material.mjs','install-interactive-material.mjs','prune-archive-backups.mjs']) {
  const help=execFileSync(process.execPath,[path.toNamespacedPath(fileURLToPath(new URL(name,import.meta.url))),'--help'],{encoding:'utf8'});
  assert(help.trim().length>20,`${name} must not silently skip its entry point`);
 }
});

test('server CLI starts with a Windows namespaced resource path', {skip:process.platform!=='win32'}, async ()=>{
 const app=fileURLToPath(new URL('../prototypes/surface-shell-a-b/',import.meta.url));
 const archive=await mkdtemp(path.join(tmpdir(),'tafelraum-entry-'));
 const child=spawn(process.execPath,[path.toNamespacedPath(path.join(app,'desktop-server.mjs')),
  '--web-root',path.join(app,'dist'),'--archive-root',archive,'--parent-pid',String(process.pid),'--port','0'],{stdio:['ignore','pipe','pipe']});
 let stderr='';child.stderr.on('data',b=>stderr+=b);
 try {
  const port=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('No ready signal: '+stderr)),10000);
   child.stdout.on('data',b=>{const match=String(b).match(/TAFELRAUM_READY (\d+)/);if(match){clearTimeout(timer);resolve(Number(match[1]));}});
   child.once('error',e=>{clearTimeout(timer);reject(e);});
   child.once('exit',code=>{clearTimeout(timer);reject(Error(`Early exit ${code}: ${stderr}`));});
  });
  const origin=`http://127.0.0.1:${port}`;
  assert.equal((await fetch(origin)).status,200);
  const status=await(await fetch(origin+'/api/archive/status')).json();
  assert.equal(status.archiveRoot,archive);
 } finally {
  if(child.exitCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}
 }
});

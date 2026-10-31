import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,writeFile,rm,symlink,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createServer} from 'node:http';
import {prepareAgentKit,collectAgentKit} from './prepare-agent-kit.mjs';
import {createAgentKitMiddleware} from '../prototypes/surface-shell-a-b/agent-kit-server.mjs';
import {initializeEmptyArchive} from '../prototypes/surface-shell-a-b/desktop-server.mjs';
import {createArchiveLesson} from '../prototypes/surface-shell-a-b/archive-server.mjs';
const repository=fileURLToPath(new URL('../',import.meta.url)),run=promisify(execFile);

test('kit is a bounded, self-contained copy of the canonical local pipeline; no private/plugin tree',async()=>{
 const temp=await realpath(await mkdtemp(path.join(tmpdir(),'tafelraum-kit-')));
 try{
  const root=path.join(temp,'kit'),kit=await prepareAgentKit(repository,root);
  assert.ok(kit.files.length>20);
  for(const entry of kit.files){
   assert.doesNotMatch(entry.path,/(?:^|\/)(?:data|local-data|test-materials|beispiele|node_modules|_private|plugins)(?:\/|$)|openai\.yaml/);
   const bytes=await readFile(path.join(root,entry.path));assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
  }
  for(const file of ['scripts/tafelraum-unterricht.mjs','scripts/check-interactive-material.mjs','scripts/install-interactive-material.mjs','prototypes/surface-shell-a-b/interactive-material.mjs']){
   assert.deepEqual(await readFile(path.join(root,file)),await readFile(path.join(repository,file)));
  }
  for(const cli of ['tafelraum-unterricht.mjs','tafelraum-canvas-agent.mjs','check-interactive-material.mjs']){
   assert.match((await run(process.execPath,[path.join(root,'scripts',cli),'--help'],{cwd:temp})).stdout,/Tafelraum/);
  }
  await run(process.execPath,[path.join(root,'scripts/check-interactive-material.mjs'),'--source-dir',path.join(root,'docs/agent-examples/starter-worksheet'),'--require-print'],{cwd:temp});
  await run(process.execPath,[path.join(root,'scripts/check-interactive-material.mjs'),'--source-dir',path.join(root,'docs/agent-examples/starter-interactive')],{cwd:temp});
  await assert.rejects(run(process.execPath,[path.join(root,'scripts/check-interactive-material.mjs'),'--source-dir',path.join(root,'docs/agent-examples/starter-interactive'),'--require-print'],{cwd:temp}));
  // Validate the actual shipped references, not the developer's plugin/cache.
  const references=JSON.parse(await readFile(path.join(root,'docs/agent-references/files.json'),'utf8'));
  for(const manifest of references.filter(file=>file.endsWith('/manifest.json'))){
   const source=path.join(root,'docs/agent-references',path.dirname(manifest));
   const checked=JSON.parse((await run(process.execPath,[path.join(root,'scripts/check-interactive-material.mjs'),'--source-dir',source,'--require-print'],{cwd:temp})).stdout);
   assert.equal(checked.ok,true);assert.equal(checked.print.layout,'shared-pages');
  }
  const archive=path.join(temp,'archive');await initializeEmptyArchive(archive);
  const document=JSON.parse(await readFile(path.join(archive,'archive.json'),'utf8'));
  const lesson=(await createArchiveLesson(archive,{classSelector:document.classes[0].id,subjectSelector:document.catalog.subjects[0].id,seriesSelector:document.catalog.series[0].id,title:'Kit-Probe'})).lesson;
  const args=[path.join(root,'scripts/install-interactive-material.mjs'),'--source-dir',path.join(root,'docs/agent-references/ottomotor-bauteile-funktionen'),'--require-print','--lesson-id',lesson.id,'--archive-root',archive];
  const installed=JSON.parse((await run(process.execPath,args,{cwd:temp})).stdout);
  assert.equal(installed.created,true);
  assert.equal(JSON.parse((await run(process.execPath,args,{cwd:temp})).stdout).created,false);
  assert.ok((await collectAgentKit(repository)).manifest.revision===kit.revision);
 }finally{await rm(temp,{recursive:true,force:true});}
});

test('generator preserves unknown folders and symlink destinations',async()=>{
 const temp=await realpath(await mkdtemp(path.join(tmpdir(),'tafelraum-kit-')));
 try{
  const target=path.join(temp,'user-folder');await mkdir(target);await writeFile(path.join(target,'keep.txt'),'keep');
  await assert.rejects(prepareAgentKit(repository,target),/ohne Agentenpaket-Marker/);
  assert.equal(await readFile(path.join(target,'keep.txt'),'utf8'),'keep');
  const link=path.join(temp,'link');await symlink(target,link,'dir');await assert.rejects(prepareAgentKit(repository,link),/kein erzeugter Ordner/);
 }finally{await rm(temp,{recursive:true,force:true});}
});

test('discovery is read-only, loopback/same-origin and contains no archive credentials/data',async()=>{
 const temp=await realpath(await mkdtemp(path.join(tmpdir(),'tafelraum-kit-')));let server;
 try{
  const kitRoot=path.join(temp,'kit');await prepareAgentKit(repository,kitRoot);
  const middleware=createAgentKitMiddleware({kitRoot});
  server=createServer((req,res)=>void middleware(req,res,()=>{res.writeHead(404);res.end();}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  const get=headers=>fetch(origin+'/api/agent-kit',{headers});
  assert.equal((await get({})).status,403);
  const headers={'X-Tafelraum-Agent':'1'};
  for(const origin of ['null','https://example.com','http://127.0.0.1:1'])assert.equal((await get({...headers,Origin:origin})).status,403);
  for(const value of ['cross-site','same-site'])assert.equal((await get({...headers,'Sec-Fetch-Site':value})).status,403);
  const response=await get({...headers,Origin:origin});assert.equal(response.status,200);assert.equal(response.headers.get('access-control-allow-origin'),null);
  const data=await response.json();assert.equal(data.root,await import('node:fs/promises').then(fs=>fs.realpath(kitRoot)));assert.equal(data.appUrl,origin);
  assert.deepEqual(Object.keys(data).sort(),['protocol','appVersion','revision','appUrl','root','entry','nodeBinary','prompt','promptTemplate','promptValues'].sort());
  assert.equal(data.promptTemplate.replace(/\{(\d+)\}/g,(_,index)=>data.promptValues[Number(index)]),data.prompt);
  assert.deepEqual(data.promptValues,[origin,data.entry,data.nodeBinary,origin]);
  assert.equal((await fetch(origin+'/api/agent-kit',{method:'POST',headers})).status,405);
  await writeFile(path.join(kitRoot,'scripts/tafelraum-unterricht.mjs'),'changed');assert.equal((await get(headers)).status,503);
  await rm(path.join(kitRoot,'agent-kit.json'));assert.equal((await get(headers)).status,503);
 }finally{if(server)await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
});

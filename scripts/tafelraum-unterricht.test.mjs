import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {createArchiveMiddleware} from '../prototypes/surface-shell-a-b/archive-server.mjs';
import {createTeachingAgentBroker} from '../prototypes/surface-shell-a-b/canvas-agent-server.mjs';
import {teachingCatalog,resolveTeachingLesson,resolveTeachingSeries,readTeachingAgentCommand} from '../prototypes/surface-shell-a-b/teaching-agent-protocol.mjs';
import {runTeachingCommand,createTeachingClient,parseTeachingArguments} from './tafelraum-unterricht.mjs';

function archive(){return {format:'tafelraum-unterrichtsarchiv',schemaVersion:1,classes:[{id:'c1',label:'9a'},{id:'c2',label:'9b'}],catalog:{version:1,
  subjects:[{id:'s1',classId:'c1',label:'English'},{id:'s2',classId:'c2',label:'English'}],
  series:[{id:'r1',subjectId:'s1',classId:'c1',label:'Stories'},{id:'r2',subjectId:'s2',classId:'c2',label:'Stories'}],
  lessons:[{id:'l1',classId:'c1',subjectId:'s1',seriesId:'r1',title:'Five stories',metadata:{scheduledFor:null},seed:{prompt:'',showTransportImage:false}},
    {id:'l2',classId:'c2',subjectId:'s2',seriesId:'r2',title:'Five stories',metadata:{scheduledFor:null},seed:{prompt:'',showTransportImage:false}}],
  trash:[],hiddenLessonIds:[],subjectOrderByClassId:{},seriesOrderBySubjectId:{},lessonOrderBySeriesId:{}}};}

test('targets resolve across chats, never default to an open lesson, and reject ambiguity/trash/hidden ancestors',()=>{
  const a=archive();
  assert.throws(()=>resolveTeachingLesson(a,{}),/Zielstunde fehlt/);
  assert.throws(()=>resolveTeachingLesson(a,{lesson:'Five stories'}),error=>error.candidates.length===2);
  assert.equal(resolveTeachingLesson(a,{lesson:'Five stories',class:'9b'}).id,'l2');
  assert.equal(resolveTeachingLesson(a,{lesson:'l1'}).breadcrumb,'9a → English → Stories → Five stories');
  assert.throws(()=>resolveTeachingLesson(a,{lesson:'l1',class:'9b'}),/nicht gefunden/);
  assert.throws(()=>resolveTeachingSeries(a,{series:'Stories'}),/nicht eindeutig/);
  assert.equal(resolveTeachingSeries(a,{series:'Stories',class:'9a'}).seriesSelector,'r1');
  a.catalog.trash.push({kind:'subject',id:'s2'});
  assert.equal(teachingCatalog(a).lessons.length,1);
  a.catalog.hiddenLessonIds.push('l1');
  assert.equal(teachingCatalog(a).lessons.length,0);
});

test('organization protocol requires source revision; CLI rejects remote endpoints and accidental option overrides',()=>{
  assert.throws(()=>readTeachingAgentCommand({type:'openLesson',lessonId:'l1'}));
  assert.throws(()=>readTeachingAgentCommand({type:'delete',lessonId:'l1'}));
  assert.throws(()=>createTeachingClient('https://example.com'));
  assert.throws(()=>parseTeachingArguments(['resolve','--lesson','a','--lesson','b']));
});

test('real archive workflow preserves source, deduplicates, protects target and worksheet installer, and reports refresh separately',async t=>{
  const root=await mkdtemp(path.join(tmpdir(),'tafelraum-organize-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await writeFile(path.join(root,'archive.json'),JSON.stringify(archive()));
  const middleware=createArchiveMiddleware(root),broker=createTeachingAgentBroker({pollMs:5});
  const server=createServer((req,res)=>void broker.middleware(req,res,()=>void middleware(req,res,()=>{res.writeHead(404,{'Content-Type':'application/json'});res.end('{"error":"not found"}');})));
  await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{broker.close();server.closeAllConnections();server.close();});
  const url=`http://127.0.0.1:${server.address().port}`,run=(action,options={})=>runTeachingCommand(action,{url,...options});
  const before=await readFile(path.join(root,'archive.json'),'utf8');
  await assert.rejects(run('create',{'archive-root':path.join(root,'wrong'),series:'r1',title:'No'}),/andere Archivbasis/);
  await assert.rejects(run('link',{lesson:'Five stories',link:'https://example.com'}),/mehrdeutig/);
  assert.equal(await readFile(path.join(root,'archive.json'),'utf8'),before);
  const created=await run('create',{series:'r1',title:'New lesson'});
  assert.equal(created.created,true);assert.equal(created.persisted,true);assert.equal(created.view.refreshed,false);
  assert.equal((await run('create',{series:'r1',title:'New lesson'})).created,false);
  const lesson=created.lesson.id;
  const source=path.join(root,'source.png'),bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');
  await writeFile(source,bytes);
  const first=await run('import',{lesson,file:source});
  assert.equal(first.result.created,true);assert.equal((await run('import',{lesson,file:source})).result.created,false);
  assert.deepEqual(await readFile(source),bytes);
  const materialPath=first.result.material.path;
  await assert.rejects(run('rename',{lesson,path:materialPath,name:'Picture','previous-name':'outdated'}),/inzwischen geändert/);
  const named=await run('rename',{lesson,path:materialPath,name:'Picture','previous-name':first.result.material.name});
  assert.equal(named.result.material.displayName,'Picture');
  const link=await run('link',{lesson,link:'https://example.com/story'});
  assert.equal(link.result.created,true);assert.equal((await run('link',{lesson,link:'https://example.com/story'})).result.created,false);
  const orderFile=path.join(root,'order.json'),paths=link.materials.map(m=>m.path);
  await writeFile(orderFile,JSON.stringify({paths:[...paths].reverse(),previousPaths:paths}));
  assert.deepEqual((await run('order',{lesson,file:orderFile})).materials.map(m=>m.path),[...paths].reverse());
  await assert.rejects(run('order',{lesson,file:orderFile}),/inzwischen/);
  const pkg=path.join(root,'worksheet');await mkdir(pkg);
  const manifest={format:'tafelraum-interactive-html',schemaVersion:1,id:'worksheet',title:'Worksheet',entry:'index.html',defaultViewport:{width:800,height:600}};
  await writeFile(path.join(pkg,'manifest.json'),JSON.stringify(manifest));await writeFile(path.join(pkg,'index.html'),'<main data-tafelraum-page><textarea name="answer"></textarea></main>');
  await assert.rejects(run('install-html',{lesson,'source-dir':pkg}),/mode/);
  await assert.rejects(run('install-html',{lesson,'source-dir':pkg,mode:'worksheet'}),/A4-Druckvorlage/);
  manifest.print={entry:'index.html',page:'A4',orientation:'portrait',mode:'template',layout:'shared-pages'};
  await writeFile(path.join(pkg,'manifest.json'),JSON.stringify(manifest));
  assert.equal((await run('install-html',{lesson,'source-dir':pkg,mode:'worksheet'})).result.created,true);
  assert.equal((await run('install-html',{lesson,'source-dir':pkg,mode:'worksheet'})).result.created,false);
  await writeFile(path.join(pkg,'index.html'),'<main data-tafelraum-page><p>Changed</p></main>');
  await assert.rejects(run('install-html',{lesson,'source-dir':pkg,mode:'worksheet'}),/anderem Inhalt/);
  assert.equal((await run('materials',{lesson})).materials.length,3);
  const sourceLesson=JSON.parse(await readFile(path.join(root,'archive.json'),'utf8')).catalog.lessons.find(l=>l.id==='l1');
  assert.equal(sourceLesson.title,'Five stories');
});

test('organization shares broker protections, keeps job confirmation across lesson switches and cannot submit canvas operations',async t=>{
  const broker=createTeachingAgentBroker({pollMs:5});
  const server=createServer((req,res)=>void broker.middleware(req,res,()=>res.end()));
  await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>{broker.close();server.closeAllConnections();server.close();});
  const url=`http://127.0.0.1:${server.address().port}`;
  const raw=async(route,body,token,method='POST')=>{const r=await fetch(url+'/api/teaching-agent'+route,{method,headers:{'X-Tafelraum-Agent':'1','Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});return {status:r.status,value:await r.json()};};
  const host=(await raw('/hosts',{lessonId:'teacher',title:'Teaching'})).value;
  assert.equal((await raw(`/sessions/${host.id}/jobs`,{requestId:'bad',lessonId:'teacher',command:{type:'apply',operations:[]}})).status,400);
  const command={type:'openLesson',lessonId:'l2',expectedLessonId:'l1',expectedRevision:'r1'};
  await raw(`/sessions/${host.id}/jobs`,{requestId:'open',lessonId:'teacher',command});
  const activity={type:'materialActivity',lessonId:'l2',operationId:'01234567-0123-4567-89ab-0123456789ab',phase:'begin'};
  const activityRoute=`/sessions/${host.id}/activity`;
  assert.equal((await raw(activityRoute,{...activity,phase:'invalid'})).status,400);
  assert.equal((await raw(activityRoute,{...activity,phase:'added',materialPath:'../other'})).status,400);
  assert.equal((await raw(activityRoute,activity)).status,202);
  const archived={...activity,phase:'added',materialPath:'bild.png'};
  assert.equal((await raw(activityRoute,archived)).status,202);
  const delivered=(await raw(`/sessions/${host.id}/poll`,{},host.token)).value;
  assert.equal(delivered.job.command.lessonId,'l2');
  assert.deepEqual(delivered.activities,[activity,archived]);
  assert.equal((await raw(activityRoute,{...activity,phase:'clear'})).status,202);
  await raw(`/sessions/${host.id}/jobs/open`,{ok:true,opened:true,lesson:{id:'l2'}},host.token,'PUT');
  assert.equal((await raw(`/sessions/${host.id}/jobs`,{requestId:'open',lessonId:'teacher',command})).value.status,'completed');
  const foreign=await fetch(url+'/api/teaching-agent/sessions',{headers:{'X-Tafelraum-Agent':'1',Origin:'null'}});assert.equal(foreign.status,403);
});

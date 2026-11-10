import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createCanvasAgentBroker} from './canvas-agent-server.mjs';
import {readCanvasAgentCommand} from './canvas-agent-protocol.mjs';

test('commands reject invalid geometry, arbitrary engine payloads and ambiguous keys',()=>{
 assert.throws(()=>readCanvasAgentCommand({type:'apply',expectedRevision:'r',operations:[{type:'eval',key:'a',x:0,y:0}]}));
 assert.throws(()=>readCanvasAgentCommand({type:'apply',expectedRevision:'r',operations:[{type:'shape',key:'a',x:NaN,y:0,width:20,height:30}]}));
 assert.throws(()=>readCanvasAgentCommand({type:'apply',expectedRevision:'r',operations:[1,2].map(()=>({type:'text',key:'same',x:0,y:0,text:'hi'}))}));
 const command=readCanvasAgentCommand({type:'apply',expectedRevision:'r',operations:[{type:'shape',key:'a',x:0,y:0,width:20,height:30,customData:{evil:true}}]});
 assert.equal(command.operations[0].customData,undefined);
 assert.throws(()=>readCanvasAgentCommand({type:'clip',expectedRevision:'r',number:1,rect:{x:0,y:0,width:0,height:20}}));
});

test('broker delivers once, preserves request identity, isolates sessions and rejects foreign origins',async t=>{
 let clock=Date.now();const broker=createCanvasAgentBroker({now:()=>clock,pollMs:5,leaseMs:1000});
 const server=createServer((req,res)=>void broker.middleware(req,res,()=>{res.writeHead(404);res.end();}));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>{broker.close();server.closeAllConnections();server.close();});
 const base=`http://127.0.0.1:${server.address().port}/api/canvas-agent`;
 const send=async(path,body,headers={},method=body===undefined?'GET':'POST')=>{const r=await fetch(base+path,{method,headers:{'X-Tafelraum-Agent':'1','Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json()};};
 assert.equal((await send('/sessions',undefined,{'Origin':'https://evil.example'})).status,403);
 assert.equal((await send('/sessions',undefined,{'Origin':'null'})).status,403);
 assert.equal((await send('/sessions',undefined,{'Sec-Fetch-Site':'same-site'})).status,403);
 const host=(await send('/hosts',{lessonId:'lesson-test',title:'Test'})).body;
 const auth={Authorization:`Bearer ${host.token}`};
 assert.equal((await send('/sessions')).body.sessions.length,0,'registering alone is not a ready teacher');
 const b={requestId:'r1',lessonId:'lesson-test',command:{type:'inspect'}};
 assert.equal((await send(`/sessions/${host.id}/jobs`,{...b,lessonId:'wrong'})).status,400);
 assert.equal((await send(`/sessions/${host.id}/jobs`,b)).status,202);
 assert.equal((await send(`/sessions/${host.id}/poll`,{})).status,403);
 assert.equal((await send(`/sessions/${host.id}/poll`,{},auth)).body.job.id,'r1');
 assert.equal((await send(`/sessions/${host.id}/poll`,{},auth)).body.job,null);
 assert.equal((await send(`/sessions/${host.id}/jobs`,b)).body.status,'delivered');
 assert.equal((await send(`/sessions/${host.id}/jobs`,{...b,command:{type:'clip',expectedRevision:'r',number:1,rect:{x:0,y:0,width:50,height:50}}})).status,409);
 assert.equal((await send(`/sessions/${host.id}/jobs/r1`,{ok:true},auth,'PUT')).status,200);
 assert.equal((await send(`/sessions/${host.id}/jobs`,b)).body.status,'completed');
 assert.equal((await send(`/sessions/${host.id}/jobs/r1`)).body.result.ok,true);
 assert.equal((await send('/sessions')).body.sessions[0].token,undefined);
 clock+=1001;assert.equal((await send(`/sessions/${host.id}/jobs/r1`)).status,409);
});


test('expired jobs release the queue without replay; delivered work requires inspection and accepts a late result',async t=>{
 let clock=Date.now();
 const broker=createCanvasAgentBroker({now:()=>clock,pollMs:1,leaseMs:120000});
 const server=createServer((req,res)=>void broker.middleware(req,res,()=>res.end()));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>{broker.close();server.closeAllConnections();server.close();});
 const base='http://127.0.0.1:'+server.address().port+'/api/canvas-agent';
 async function send(route,body,token,method='POST'){
  const response=await fetch(base+route,{method,headers:{'X-Tafelraum-Agent':'1','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:response.status,value:await response.json()};
 }
 const host=(await send('/hosts',{lessonId:'test',title:'Test'})).value;
 const jobs='/sessions/'+host.id+'/jobs',poll='/sessions/'+host.id+'/poll';
 const command={type:'clip',expectedRevision:'revision',number:1,rect:{x:0,y:0,width:100,height:100}};
 const submit=(id,cmd=command)=>send(jobs,{lessonId:'test',requestId:id,command:cmd});
 await submit('never-delivered');
 clock+=30001;
 assert.equal((await send(jobs+'/never-delivered',undefined,undefined,'GET')).value.status,'expired');
 assert.equal((await submit('never-delivered')).value.status,'expired');
 assert.equal((await submit('lost-ack')).status,202);
 await send(poll,{},host.token);
 clock+=30001;
 assert.equal((await send(jobs+'/lost-ack',undefined,undefined,'GET')).value.status,'unconfirmed');
 assert.equal((await submit('unsafe-retry')).status,409);
 assert.equal((await submit('inspect',{type:'inspect'})).status,202);
 assert.equal((await send(poll,{},host.token)).value.job.id,'inspect');
 await send(jobs+'/inspect',{ok:true},host.token,'PUT');
 assert.equal((await submit('next')).status,202);
 assert.equal((await send(jobs+'/lost-ack',{ok:true,applied:true,persisted:true},host.token,'PUT')).status,200);
 const late=(await send(jobs+'/lost-ack',undefined,undefined,'GET')).value;
 assert.equal(late.status,'completed');assert.equal(late.result.persisted,true);
 assert.equal((await submit('lost-ack')).value.status,'completed');
});

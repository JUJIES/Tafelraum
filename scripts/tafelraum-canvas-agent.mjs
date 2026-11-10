#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {readCanvasAgentCommand} from '../prototypes/surface-shell-a-b/canvas-agent-protocol.mjs';
const args=process.argv.slice(2),action=args[0];
const usage=`Tafelraum Canvas vorbereiten (geöffnete lokale Lehreransicht)
  sessions | inspect | validate --file auftrag.json
  apply --file auftrag.json --request-id ID | job --request-id ID
Verbindung: --url http://127.0.0.1:49317 --session ID
Hilfe und validate funktionieren ohne laufende App.
Nur bestätigtes persisted:true ist gespeichert; nach Zeitüberschreitung dieselbe job-ID prüfen.`;
if(!action||action==='--help'||action==='help'){process.stdout.write(usage+'\n');process.exit(0);}

const option=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
const url=option('--url','http://127.0.0.1:49317');
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url))throw new Error('Nur eine lokale Tafelraum-Adresse ist erlaubt.');
const requestId=option('--request-id',randomUUID());
async function request(path,body){const r=await fetch(url+'/api/canvas-agent'+path,{method:body===undefined?'GET':'POST',headers:{'X-Tafelraum-Agent':'1',...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});const value=await r.json();if(!r.ok)throw new Error(value.error??`HTTP ${r.status}`);return value;}
const emit=v=>process.stdout.write(JSON.stringify(v,null,2)+'\n');
try{
 if(action==='validate'){
  const file=option('--file');if(!file)throw new Error('--file fehlt.');emit(readCanvasAgentCommand(JSON.parse(await readFile(file,'utf8'))));
 }else{
  const {sessions}=await request('/sessions');
  if(action==='sessions'){emit(sessions);process.exit(0);}
  const selected=option('--session');if(!selected&&sessions.length!==1)throw new Error(`Genau eine Lehreransicht auswählen: --session <id>. Gefunden: ${sessions.length}.`);
  const session=sessions.find(s=>s.id===(selected??sessions[0]?.id));if(!session)throw new Error('Lehreransicht fehlt. Tafelraum mit dieser Stunde öffnen.');
  if(action==='job'){emit(await request(`/sessions/${session.id}/jobs/${option('--request-id')}`));process.exit(0);}
  const file=option('--file');
  const command=action==='inspect'?{type:'inspect'}:action==='apply'&&file?readCanvasAgentCommand(JSON.parse(await readFile(file,'utf8'))):null;
  if(!command)throw new Error('Aufruf: sessions | inspect | apply --file auftrag.json | job --request-id ID | validate --file auftrag.json. Optionen: --url URL --session ID --request-id ID');
  process.stderr.write(`Auftrag ${requestId} · Sitzung ${session.id} · Stunde ${session.lessonId}\n`);
  await request(`/sessions/${session.id}/jobs`,{requestId,lessonId:session.lessonId,command});
  const deadline=Date.now()+40000;
  while(Date.now()<deadline){
   const job=await request(`/sessions/${session.id}/jobs/${requestId}`);
   if(job.status==='unconfirmed')throw new Error('Ergebnis unbestätigt. Auftragsstatus und aktuellen Stundenstand prüfen; nicht mit neuer ID wiederholen.');
   if(job.status==='completed'||job.status==='expired'){emit({requestId,...job.result});if(!job.result.ok)process.exitCode=1;break;}
   await new Promise(r=>setTimeout(r,150));
  }
  if(!process.exitCode&&Date.now()>=deadline)throw new Error(`Ergebnis unbestätigt. Nicht mit neuer requestId wiederholen. Status mit job --session ${session.id} --request-id ${requestId} prüfen.`);
 }
}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}

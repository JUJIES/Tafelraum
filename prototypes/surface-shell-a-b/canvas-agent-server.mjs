import {randomUUID,randomBytes} from 'node:crypto';
import {canvasAgentProtocol,readCanvasAgentCommand} from './canvas-agent-protocol.mjs';
import {teachingAgentPrefix,teachingAgentProtocol,readTeachingAgentCommand} from './teaching-agent-protocol.mjs';
function reply(res,status,value){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}
async function body(req){let size=0,parts=[];for await(const chunk of req){size+=chunk.length;if(size>256*1024)throw new Error('Auftrag zu groß.');parts.push(chunk);}return JSON.parse(Buffer.concat(parts).toString());}
/** RAM-only transport. It never reads or writes a lesson or replays delivered work. */
export function createCanvasAgentBroker({now=Date.now,leaseMs=45000,pollMs=20000,prefix='/api/canvas-agent',protocol=canvasAgentProtocol,readCommand=readCanvasAgentCommand}={}){
 const sessions=new Map();
 const validId=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v);
 function current(id){const s=sessions.get(id);if(!s||now()-s.seen>leaseMs){if(s){s.wake?.();sessions.delete(id);}return null;}return s;}
 function expireJobs(s){
  for(const job of s.jobs.values()){
   if(job.expiresAt>now())continue;
   if(job.status==='queued'){
    job.status='expired';job.result={ok:false,applied:false,persisted:false,error:'Auftrag vor Ausführung abgelaufen.'};
   }else if(job.status==='delivered'){
    job.status='unconfirmed';s.needsInspection=true;
   }
  }
 }
 function wake(s){s.wake?.();s.wake=null;}
 const middleware=async(req,res,next)=>{
  const url=new URL(req.url??'/','http://local');if(!url.pathname.startsWith(prefix+'/'))return next();
  // Custom header prevents form/opaque-sandbox requests; exact Origin defeats other local ports.
  const host=req.headers.host??'',origin=req.headers.origin;
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host)||req.headers['x-tafelraum-agent']!=='1'
    ||(origin!==undefined&&origin!==`http://${host}`)||['cross-site','same-site'].includes(req.headers['sec-fetch-site']))return reply(res,403,{error:'Lokaler Agentzugriff nicht erlaubt.'});
  try{
   if(url.pathname===prefix+'/sessions'&&req.method==='GET'){
    const entries=[...sessions.keys()].flatMap(id=>{const s=current(id);return s?.ready?[{id,lessonId:s.lessonId,title:s.title,protocol,
      ...(protocol===teachingAgentProtocol?{capabilities:{archiveWorkFinish:true}}:{})}]:[];});return reply(res,200,{sessions:entries});
   }
   if(url.pathname===prefix+'/hosts'&&req.method==='POST'){
    const b=await body(req);if(!validId(b.lessonId)||typeof b.title!=='string'||b.title.length>300)throw new Error('Ungültige Lehreransicht.');
    for(const key of sessions.keys())current(key);if(sessions.size>=8)return reply(res,429,{error:'Zu viele Lehreransichten.'});
    const id=randomUUID(),token=randomBytes(32).toString('hex');sessions.set(id,{id,token,lessonId:b.lessonId,title:b.title,seen:now(),jobs:new Map(),activities:new Map(),wake:null,polling:false,ready:false});return reply(res,201,{id,token,protocol});
   }
   const match=new RegExp('^'+prefix+'/sessions/([A-Za-z0-9_-]+)/(?:(poll|jobs|activity)(?:/([A-Za-z0-9_-]+))?)$').exec(url.pathname);
   if(!match)return reply(res,404,{error:'Unbekannter Agentpfad.'});
   const [,sid,kind,jid]=match,s=current(sid);if(!s)return reply(res,409,{error:'Lehreransicht nicht mehr verbunden.',code:'session_expired'});
   expireJobs(s);
   const hostCall=kind==='poll'||req.method==='PUT';
   if(hostCall&&req.headers.authorization!==`Bearer ${s.token}`)return reply(res,403,{error:'Ungültige Lehrerinstanz.'});
   if(kind==='activity'&&!jid&&protocol===teachingAgentProtocol&&req.method==='POST'){
    const notice=readTeachingAgentCommand(await body(req));
    if(notice.type!=='materialActivity')throw new Error('Ungültige Aktivitätsmeldung.');
    // Keep the start and outcome even if a fast import finishes in one poll interval.
    const key=notice.operationId+(notice.phase==='begin'?':begin':':result');
    if(s.activities.size>=64&&!s.activities.has(key))return reply(res,429,{error:'Zu viele Aktivitätsmeldungen.'});
    s.activities.set(key,notice);wake(s);return reply(res,202,{accepted:true});
   }
   if(kind==='poll'&&req.method==='DELETE'){wake(s);sessions.delete(sid);return reply(res,200,{closed:true});}
   if(kind==='poll'&&req.method==='POST'){
    if(s.polling)return reply(res,409,{error:'Lehreransicht wartet bereits.'});s.seen=now();s.polling=true;s.ready=true;
    try{
     if(!s.activities.size&&![...s.jobs.values()].some(j=>j.status==='queued'))await new Promise(resolve=>{const timer=setTimeout(done,pollMs);function disconnected(){s.ready=false;done();}function done(){clearTimeout(timer);res.off('close',disconnected);if(s.wake===done)s.wake=null;resolve();}s.wake=done;res.once('close',disconnected);});
     if(res.destroyed)return;s.seen=now();expireJobs(s);const j=[...s.jobs.values()].find(j=>j.status==='queued');const extra=s.activities.size?{activities:[...s.activities.values()]}:{};s.activities.clear();
     if(!j)return reply(res,200,{job:null,...extra});j.status='delivered';return reply(res,200,{job:{id:j.id,command:j.command,expiresAt:j.expiresAt},...extra});
    }finally{s.polling=false;}
   }
   if(kind==='jobs'&&!jid&&req.method==='POST'){
    const b=await body(req);if(!validId(b.requestId)||b.lessonId!==s.lessonId)throw new Error('Eindeutige requestId und passende lessonId erforderlich.');const command=readCommand(b.command),encoded=JSON.stringify(command);
    const existing=s.jobs.get(b.requestId);if(existing){if(existing.encoded!==encoded)return reply(res,409,{error:'requestId gehört bereits zu einem anderen Auftrag.'});return reply(res,200,{id:existing.id,status:existing.status});}
    if(s.needsInspection&&!['inspect','context','refresh'].includes(command.type)){
     return reply(res,409,{error:'Vorheriges Ergebnis unbestätigt. Aktuellen Stand mit inspect bzw. context prüfen, bevor ein neuer Schreibauftrag beginnt.',code:'inspection_required'});
    }
    // No eviction during a host session: a retried request ID can never be applied twice.
    if(s.jobs.size>=256)return reply(res,429,{error:'Sitzungsgrenze erreicht. Lehreransicht erneut verbinden.'});
    if([...s.jobs.values()].some(j=>j.status==='queued'||j.status==='delivered'))return reply(res,409,{error:'Ein Agentauftrag ist noch offen.'});
    const job={id:b.requestId,command,encoded,status:'queued',result:null,expiresAt:now()+30000};s.jobs.set(job.id,job);wake(s);return reply(res,202,{id:job.id,status:job.status});
   }
   const job=s.jobs.get(jid);if(!job)return reply(res,404,{error:'Agentauftrag unbekannt.'});
   if(kind==='jobs'&&req.method==='GET')return reply(res,200,{id:job.id,status:job.status,...(job.result?{result:job.result}:{})});
   if(kind==='jobs'&&req.method==='PUT'){
    if(!['delivered','unconfirmed'].includes(job.status))return reply(res,409,{error:'Auftrag wurde nicht zugestellt oder bereits bestätigt.'});
    const result=await body(req);job.result=result;job.status='completed';s.seen=now();
    if(result.ok&&['inspect','context'].includes(job.command.type))s.needsInspection=false;return reply(res,200,{received:true});
   }
   return reply(res,405,{error:'Methode nicht erlaubt.'});
  }catch(e){if(!res.headersSent)reply(res,400,{error:e.message});}
 };
 return {middleware,close(){for(const s of sessions.values())wake(s);sessions.clear();}};
}
export function createTeachingAgentBroker(options={}){return createCanvasAgentBroker({...options,prefix:teachingAgentPrefix,protocol:teachingAgentProtocol,readCommand:readTeachingAgentCommand});}
export function canvasAgentPlugin(){let broker;return{name:'tafelraum-canvas-agent',configureServer(server){broker=createCanvasAgentBroker();server.middlewares.use(broker.middleware);server.httpServer?.once('close',()=>broker.close());},configurePreviewServer(server){const b=createCanvasAgentBroker();server.middlewares.use(b.middleware);server.httpServer?.once('close',()=>b.close());}};}

export function teachingAgentPlugin(){return{name:'tafelraum-teaching-agent',configureServer(server){const b=createTeachingAgentBroker();server.middlewares.use(b.middleware);server.httpServer?.once('close',()=>b.close());},configurePreviewServer(server){const b=createTeachingAgentBroker();server.middlewares.use(b.middleware);server.httpServer?.once('close',()=>b.close());}};}

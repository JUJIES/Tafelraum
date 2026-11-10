#!/usr/bin/env node
import {readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {teachingAgentPrefix,teachingAgentProtocol,teachingCatalog,findTeachingLessons,resolveTeachingLesson,resolveTeachingSeries} from '../prototypes/surface-shell-a-b/teaching-agent-protocol.mjs';
import {installInteractiveMaterial} from './install-interactive-material.mjs';
import {interactiveMaterialFolderName} from '../prototypes/surface-shell-a-b/interactive-material.mjs';

const usage = `Tafelraum Unterricht organisieren (nur laufender lokaler Archivserver)
  status | find [--query Text] | resolve --lesson ID-oder-Titel | materials --lesson ...
  create --series ID-oder-Name [--class ... --subject ...] --title Titel [--date YYYY-MM-DD]
  import --lesson ... --file Datei [--work-id UUID]
  link --lesson ... --link https://... [--title Titel] [--work-id UUID]
  install-html --lesson ... --source-dir Ordner --mode worksheet|digital [--work-id UUID]
  rename --lesson ... --path Materialpfad --name Name --previous-name Bisheriger-Name
  order --lesson ... --file JSON-mit-paths-und-previousPaths
  work-start --lesson ... --work-id UUID [--work-scope canvas|archive] [--work-preparation images]
  work-heartbeat | work-finish | work-cancel --lesson ... --work-id UUID
  open --lesson ... | refresh | context | job --session ID --request-id ID
Ziel einschränken: --class ... --subject ... --series ...
Verbindung: --url http://127.0.0.1:49317 [--archive-root erwarteter-Pfad] [--session ID]
HTML-Arbeitsblätter nutzen immer require-print; die tatsächliche Druckabnahme bleibt erforderlich.
Keine automatische Zielwahl, Canvasplatzierung, Löschung oder Datei-Fallbacks.`;

export function parseTeachingArguments(argv) {
  const [action,...rest]=argv, options={};
  const names=new Set(['query','lesson','class','subject','series','title','date','lesson-id','file','link','source-dir','mode','path','name','previous-name','url','archive-root','session','request-id','work-id','work-scope','work-preparation']);
  for(let index=0;index<rest.length;index+=2){
    const key=rest[index]?.replace(/^--/,''),value=rest[index+1];
    if(!rest[index]?.startsWith('--')||!names.has(key)||typeof value!=='string'||value.startsWith('--')||key in options)throw new Error('Ungültige oder doppelte Option: '+rest[index]);
    options[key]=value;
  }
  return {action,options};
}

export function createTeachingClient(origin='http://127.0.0.1:49317') {
  if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw new Error('Nur ein lokaler Tafelraum-Server ist erlaubt.');
  async function request(route,{method='GET',body,stream,timeoutMs}={}){
    const response=await fetch(origin+route,{method,headers:{'X-Tafelraum-Agent':'1',...(body===undefined?{}:{'Content-Type':'application/json'})},
      body:stream??(body===undefined?undefined:JSON.stringify(body)),...(stream?{duplex:'half'}:{}),signal:AbortSignal.timeout(timeoutMs??(stream?600000:45000)),redirect:'error'});
    const result=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(result?.error??`Tafelraum antwortet mit ${response.status}; Anschluss gegebenenfalls noch nicht installiert.`);
    if(result===null)throw new Error('Tafelraum liefert keine gültige API-Antwort. Serveradresse und Appversion prüfen.');
    return result;
  }
  async function session(selected,timeoutMs){
    const {sessions}=await request(teachingAgentPrefix+'/sessions',{timeoutMs});
    const candidates=sessions.filter(s=>s.protocol===teachingAgentProtocol&&(!selected||s.id===selected));
    if(candidates.length!==1)throw new Error('Genau eine verbundene Lehreransicht auswählen (--session). Organisationsanschluss der aktuellen App erforderlich.');
    return candidates[0];
  }
  async function command(command,{sessionId,requestId=randomUUID(),onRequest=()=>{}}={}){
    const target=await session(sessionId);
    onRequest({sessionId:target.id,requestId});
    await request(`${teachingAgentPrefix}/sessions/${target.id}/jobs`,{method:'POST',body:{lessonId:'teacher',requestId,command}});
    const deadline=Date.now()+40000;
    while(Date.now()<deadline){
      const job=await request(`${teachingAgentPrefix}/sessions/${target.id}/jobs/${requestId}`);
      if(job.status==='unconfirmed')throw new Error('Ergebnis unbestätigt. Auftragsstatus und aktuellen Stundenstand prüfen; nicht mit neuer ID wiederholen.');
   if(job.status==='completed'||job.status==='expired'){
        if(!job.result.ok)throw new Error(job.result.error??'Auftrag fehlgeschlagen.');
        return job.result;
      }
      await new Promise(resolve=>setTimeout(resolve,150));
    }
    throw new Error(`Ergebnis unbestätigt. Nicht blind wiederholen: job --session ${target.id} --request-id ${requestId}`);
  }
  return {request,command,session};
}

export async function runTeachingCommand(action,o={},log=()=>{}) {
  if(!action||action==='--help'||action==='help')return {help:usage};
  if(!['status','find','resolve','materials','create','import','link','install-html','rename','order','open','refresh','context','job','work-start','work-heartbeat','work-finish','work-cancel'].includes(action))throw new Error('Unbekannter Befehl. --help verwenden.');
  const client=createTeachingClient(o.url),{request}=client;
  const status=await request('/api/archive/status');
  if(!status.available||typeof status.archiveRoot!=='string'||!path.isAbsolute(status.archiveRoot))throw new Error('Aktive Archivbasis ist nicht verfügbar.');
  if(o['archive-root']&&path.resolve(o['archive-root'])!==path.resolve(status.archiveRoot))throw new Error('Aktiver Server verwendet eine andere Archivbasis. Keine Änderung.');
  const selectors=Object.fromEntries(['class','subject','series','lesson','query'].filter(k=>o[k]).map(k=>[k,o[k]]));
  const command=(value)=>client.command(value,{sessionId:o.session,requestId:o['request-id'],onRequest:info=>log(info)});
  if(action==='context'||action==='refresh')return {archiveRoot:status.archiveRoot,...await command({type:action})};
  if(action==='job'){
    if(!o.session||!o['request-id'])throw new Error('--session und --request-id erforderlich.');
    return request(`${teachingAgentPrefix}/sessions/${encodeURIComponent(o.session)}/jobs/${encodeURIComponent(o['request-id'])}`);
  }
  const archive=await request('/api/archive');
  if(action==='status')return {archiveRoot:status.archiveRoot,catalog:teachingCatalog(archive)};
  if(action==='find')return {archiveRoot:status.archiveRoot,lessons:findTeachingLessons(archive,selectors)};
  if(action==='resolve')return {archiveRoot:status.archiveRoot,lesson:resolveTeachingLesson(archive,selectors)};
  async function finish(result){
    // Import acknowledgement and UI refresh are separate: a failed refresh never means retry the import.
    let view;
    try{view=await client.command({type:'refresh'},{sessionId:o.session});}
    catch(error){view={refreshed:false,error:error.message};}
    return {archiveRoot:status.archiveRoot,persisted:true,...result,view};
  }
  if(action==='create'){
    const input={...resolveTeachingSeries(archive,selectors),title:o.title,scheduledFor:o.date??null,...(o['lesson-id']?{lessonId:o['lesson-id']}:{})};
    const existing=teachingCatalog(archive).lessons.filter(l=>l.seriesId===input.seriesSelector&&l.title.trim().toLocaleLowerCase('de-DE')===String(input.title??'').trim().toLocaleLowerCase('de-DE')&&l.scheduledFor===input.scheduledFor);
    if(!input.lessonId&&existing.length>1){const error=new Error('Mehrere Stunden mit gleichem Titel und Termin vorhanden. Ziel-ID auswählen.');error.candidates=existing;throw error;}
    const result=await request('/api/archive/lessons',{method:'POST',body:input});
    const lesson=resolveTeachingLesson(await request('/api/archive'),{lesson:result.lesson.id});
    return finish({created:result.created,lesson});
  }
  const lesson=resolveTeachingLesson(archive,selectors);
  if(action.startsWith('work-')){
    if(!o['work-id'])throw new Error('--work-id UUID erforderlich; dieselbe ID für die gesamte Arbeitsphase verwenden.');
    const work={type:'workPhase',lessonId:lesson.id,workId:o['work-id'],action:action.slice(5),
      ...(o['work-scope']?{scope:o['work-scope']}:{}),...(o['work-preparation']?{preparation:o['work-preparation']}:{} )};
    if(action==='work-start'&&work.scope==='archive'){
      const target=await client.session(o.session);
      if(!target.capabilities?.archiveWorkFinish)throw new Error('Diese Lehreransicht unterstützt keinen bestätigten Archivabschluss.');
      return {archiveRoot:status.archiveRoot,...await client.command(work,{sessionId:target.id,requestId:o['request-id'],onRequest:log})};
    }
    return {archiveRoot:status.archiveRoot,...await command(work)};
  }
  const base=`/api/archive/lessons/${encodeURIComponent(lesson.id)}/materials`;
  if(action==='materials')return {lesson,...await request(base)};
  if(action==='open'){
    const target=await client.session(o.session);
    const current=await client.command({type:'context'},{sessionId:target.id});
    if(!current.context.ready)throw new Error('Lehrerfläche lädt noch.');
    const result=await client.command({type:'openLesson',lessonId:lesson.id,expectedLessonId:current.context.lessonId,expectedRevision:current.context.revision},
      {sessionId:target.id,requestId:o['request-id'],onRequest:info=>log(info)});
    const deadline=Date.now()+15000;
    while(Date.now()<deadline){
      const check=await client.command({type:'context'},{sessionId:target.id});
      if(check.context.lessonId===lesson.id&&check.context.ready)return {archiveRoot:status.archiveRoot,...result,context:check.context};
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    throw new Error('Stundenwechsel ausgeführt, Zielcanvas aber noch nicht bestätigt. context prüfen.');
  }
  // Optional UI signal. Queue it in the selected teacher session without waiting for UI execution.
  const tracksMaterial=['import','install-html','link'].includes(action);
  const target=tracksMaterial?await client.session(o.session,700).catch(()=>null):null;
  const operationId=randomUUID();
  async function signal(phase,materialPath){
    if(!target)return false;
    return request(teachingAgentPrefix+'/sessions/'+target.id+'/activity',{method:'POST',timeoutMs:700,
      body:{type:'materialActivity',lessonId:lesson.id,operationId,phase,
        ...(o['work-id']?{workId:o['work-id']}:{}),...(materialPath?{materialPath}:{})}}).then(
          result=>result.accepted===true,()=>false);
  }
  const activity={startQueued:await signal('begin'),resultQueued:false};
  const activityResult=tracksMaterial?{activity}:{};
  let heartbeat=Promise.resolve();
  const heartbeatTimer=target?setInterval(()=>{heartbeat=signal('begin');},10000):null;
  let phase='unconfirmed',confirmedPath;
  try {
    let result;
    if(action==='import'){
      if(!o.file||(await stat(o.file)).isFile()===false)throw new Error('Quelldatei fehlt.');
      result=await request(base+'/file?name='+encodeURIComponent(path.basename(o.file)),{method:'PUT',stream:createReadStream(o.file)});
    }else if(action==='link'){
      if(!o.link)throw new Error('--link fehlt.');
      result=await request(base+'/links',{method:'POST',body:{url:o.link}});
      if(o.title){
        try{
          const renamed=await request(base,{method:'PATCH',body:{path:result.material.path,displayName:o.title,previousDisplayName:result.material.displayName??result.material.name}});
          result={...result,material:renamed.material};
        }catch(error){result={...result,rename:{applied:false,error:error.message}};}
      }
    }else if(action==='install-html'){
      if(!o['source-dir']||!['worksheet','digital'].includes(o.mode))throw new Error('--source-dir und --mode worksheet|digital erforderlich.');
      // Keep the established validator/installer. Only its target comes from the live server.
      result=await installInteractiveMaterial({archiveRoot:status.archiveRoot,lessonId:lesson.id,sourceDirectory:path.resolve(o['source-dir']),requirePrint:o.mode==='worksheet'});
    }else if(action==='rename'){
      if(!o.path||!o.name||!o['previous-name'])throw new Error('--path, --name und --previous-name aus materials erforderlich.');
      result=await request(base,{method:'PATCH',body:{path:o.path,displayName:o.name,previousDisplayName:o['previous-name']}});
    }else if(action==='order'){
      if(!o.file)throw new Error('--file fehlt.');
      const order=JSON.parse(await readFile(o.file,'utf8'));
      result=await request(base+'/order',{method:'PUT',body:{paths:order.paths,previousPaths:order.previousPaths}});
    }
    try{
      phase='saved';
      const verified=await request(base);
      if(tracksMaterial&&result.material){
        const resultPath=action==='install-html'?interactiveMaterialFolderName+'/'+result.material.id:result.material.path;
        if(verified.materials.some(material=>material.path===resultPath))confirmedPath=resultPath;
      }
      const matched=!tracksMaterial||Boolean(confirmedPath);
      const completed=await finish({lesson,result,verified:matched,materials:verified.materials,...activityResult,
        ...(!matched?{verificationError:'Material im aktuellen Bestand nicht bestätigt.'}:{})});
      if(matched&&completed.view.refreshed)phase=result.created===true?'added':'clear';
      return completed;
    }catch(error){
      return finish({lesson,result,verified:false,verificationError:error.message,...activityResult});
    }
  } finally {
    if(heartbeatTimer)clearInterval(heartbeatTimer);
    await heartbeat;
    activity.resultQueued=await signal(phase,confirmedPath);
  }
}

if(process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  try{
    const {action,options}=parseTeachingArguments(process.argv.slice(2));
    const result=await runTeachingCommand(action,options,info=>process.stderr.write(JSON.stringify(info)+'\n'));
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
  }catch(error){process.stderr.write(JSON.stringify({error:error.message,...(error.candidates?{candidates:error.candidates}:{})},null,2)+'\n');process.exitCode=1;}
}

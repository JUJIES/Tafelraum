import {createHash} from 'node:crypto';
import {readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
export function createAgentKitMiddleware({kitRoot}){
 return async function middleware(request,response,next){
  if(new URL(request.url??'/','http://local').pathname!=='/api/agent-kit')return next();
  const reply=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});response.end(JSON.stringify(value));};
  const host=request.headers.host??'',origin=request.headers.origin;
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host)||request.headers['x-tafelraum-agent']!=='1'
   ||(origin!==undefined&&origin!==`http://${host}`)||['cross-site','same-site'].includes(request.headers['sec-fetch-site']))return reply(403,{error:'Lokaler Agentzugriff nicht erlaubt.'});
  if(request.method!=='GET')return reply(405,{error:'Nur lesender Einstieg.'});
  try{
   const root=await realpath(kitRoot),manifest=JSON.parse(await readFile(path.join(root,'agent-kit.json'),'utf8'));
   if(manifest.format!=='tafelraum-agent-kit-v1'||manifest.entry!=='README.md')throw Error('Unbekanntes Agentenpaket.');
   if(!Array.isArray(manifest.files)||manifest.files.length>128||!manifest.files.some(file=>file.path==='README.md'))throw Error('Unvollständiges Agentenpaket.');
   for(const file of manifest.files){
    if(typeof file.path!=='string'||!/^[a-zA-Z0-9_.\/-]+$/.test(file.path)||file.path.split('/').some(part=>!part||part==='.'||part==='..')||!Number.isInteger(file.bytes)||file.bytes<0||file.bytes>2*1024*1024)throw Error('Ungültiger Paketpfad.');
    const filename=await realpath(path.join(root,file.path));if(!filename.startsWith(root+path.sep))throw Error('Paketpfad außerhalb des Pakets.');
    const bytes=await readFile(filename);
    if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw Error('Agentenpaket verändert.');
   }
   const appUrl=`http://${host}`;
   const promptTemplate="Verbinde dich mit meiner lokalen Tafelraum-App ({0}). Lies zuerst {1} und die dortigen Arbeitsregeln. Verwende das mitgelieferte Agentenpaket, keine private OpenAI-/MCP-Pluginvariante. Node-Laufzeit: {2}. Prüfe zunächst nur status und sessions mit --url {3}; bestätige das tatsächlich geöffnete Archiv. Noch kein Material erzeugen, archivieren oder auf dem Canvas ändern. Danach arbeiten wir an meinem konkreten Unterrichtsauftrag.";
   const promptValues=[appUrl,path.join(root,'README.md'),process.execPath,appUrl];
   const prompt=promptTemplate.replace(/\{(\d+)\}/g,(_,index)=>promptValues[Number(index)]);
   return reply(200,{protocol:'tafelraum-agent-kit-v1',appVersion:manifest.appVersion,revision:manifest.revision,appUrl,root,entry:path.join(root,'README.md'),nodeBinary:process.execPath,prompt,promptTemplate,promptValues});
  }catch{return reply(503,{error:'Das Agentenpaket fehlt oder ist unvollständig. Ressourcen dieses Quellstands neu vorbereiten.'});}
 };
}

// Real app, isolated archive; only a local test photo copy is read.
import { mkdir, readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createDesktopServer } from '../prototypes/surface-shell-a-b/desktop-server.mjs';
const root=process.argv.includes('--fresh') ? await mkdtemp(path.join(tmpdir(),'tafelraum-document-image-qa-')) : fileURLToPath(new URL('../local-data/document-image-pilot/',import.meta.url));
await mkdir(root,{recursive:true});
const server=await createDesktopServer({archiveRoot:path.join(root,'archive'),notesRoot:path.join(root,'notes'),webRoot:fileURLToPath(new URL('../prototypes/surface-shell-a-b/dist/',import.meta.url)),
  documentImageConfigPath:fileURLToPath(new URL('../local-data/document-image.json',import.meta.url))});
const base=`http://127.0.0.1:${server.address().port}`;
const lesson=base+'/api/archive/lessons/lesson-start';
if((await fetch(lesson+'/board')).status===404){
  const bytes=await readFile(fileURLToPath(new URL('../output/scan-enhancement-compare/2026-10-17-archive-handwriting/photo-2-baseline/images/original.png',import.meta.url)));
  const file={id:'document-photo',dataURL:'data:image/png;base64,'+bytes.toString('base64'),mimeType:'image/png',created:Date.now()};
  const element={id:'document-photo-image',type:'image',x:0,y:0,width:831.5,height:623.5,angle:0,strokeColor:'transparent',backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,groupIds:[],frameId:null,roundness:null,seed:1,version:1,versionNonce:1,isDeleted:false,boundElements:null,updated:1,link:null,locked:false,status:'saved',fileId:file.id,scale:[1,1],crop:null,customData:{assetId:file.id}};
  for(const [route,body] of [['assets',{files:[file]}],['board',{schemaVersion:1,elements:[element],viewport:{scrollX:150,scrollY:80,zoom:{value:1}}}]]){
    const response=await fetch(lesson+'/'+route,{method:'PUT',headers:{'Content-Type':'application/json','If-None-Match':'*'},body:JSON.stringify(body)});
    if(!response.ok)throw Error(route+': '+response.status+' '+await response.text());
  }
}
console.log('Document image app QA: '+base);
process.on('SIGTERM',()=>server.close(()=>process.exit()));
process.on('SIGINT',()=>server.close(()=>process.exit()));

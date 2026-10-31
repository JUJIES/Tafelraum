import {access,mkdir,mkdtemp,readFile,writeFile,rm,rename,lstat,realpath} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {inflateRawSync} from 'node:zlib';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import runtime from './office-import/runtime.json' with {type:'json'};

export const docxMime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const officeInputBytes=20*1024*1024;
export const isDocxName=name=>typeof name==='string'&&/\.docx$/i.test(name);
const invalid=()=>new Error('Die Word-Datei ist beschädigt, geschützt oder kein unterstütztes DOCX-Dokument.');

// Inspect the ZIP directory before opening in Office: bounded expansion, no encryption,
// active content or externally loaded document parts. Ordinary web hyperlinks remain.
export function validateDocx(bytes){
  if(!Buffer.isBuffer(bytes))bytes=Buffer.from(bytes);
  if(bytes.length<22||bytes.length>officeInputBytes)throw invalid();
  let end=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(bytes.readUInt32LE(i)===0x06054b50&&i+22+bytes.readUInt16LE(i+20)===bytes.length){end=i;break;}}
  if(end<0||bytes.readUInt16LE(end+4)||bytes.readUInt16LE(end+6))throw invalid();
  const count=bytes.readUInt16LE(end+10),length=bytes.readUInt32LE(end+12),offset=bytes.readUInt32LE(end+16);
  if(!count||count>4096||offset+length!==end||bytes.readUInt16LE(end+8)!==count)throw invalid();
  const entries=new Map();let cursor=offset,total=0;
  for(let i=0;i<count;i++){
    if(cursor+46>end||bytes.readUInt32LE(cursor)!==0x02014b50)throw invalid();
    const flags=bytes.readUInt16LE(cursor+8),method=bytes.readUInt16LE(cursor+10),compressed=bytes.readUInt32LE(cursor+20),size=bytes.readUInt32LE(cursor+24);
    const nameLength=bytes.readUInt16LE(cursor+28),extra=bytes.readUInt16LE(cursor+30),comment=bytes.readUInt16LE(cursor+32),local=bytes.readUInt32LE(cursor+42);
    const next=cursor+46+nameLength+extra+comment;
    if(next>end||flags&1||![0,8].includes(method)||size>40*1024*1024||(total+=size)>120*1024*1024||local+30>offset)throw invalid();
    const name=bytes.subarray(cursor+46,cursor+46+nameLength).toString('utf8');
    if(!name||name.includes('\\')||name.startsWith('/')||name.split('/').some(p=>p==='..')||entries.has(name)||/vbaProject|activeX|embeddings\//i.test(name))throw invalid();
    if(bytes.readUInt32LE(local)!==0x04034b50)throw invalid();
    const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28);
    if(start+compressed>offset || bytes.subarray(local+30,local+30+bytes.readUInt16LE(local+26)).toString('utf8')!==name
      || bytes.readUInt16LE(local+8)!==method || bytes.readUInt16LE(local+6)!==flags)throw invalid();
    entries.set(name,{start,compressed,size,method});cursor=next;
  }
  if(cursor!==end||!entries.has('[Content_Types].xml')||!entries.has('word/document.xml'))throw invalid();
  const xml=name=>{const e=entries.get(name);const data=bytes.subarray(e.start,e.start+e.compressed);const value=e.method===8?inflateRawSync(data,{maxOutputLength:Math.min(e.size+1,40*1024*1024)}):data;if(value.length!==e.size)throw invalid();return value.toString('utf8');};
  for(const name of entries.keys())if(/\.(xml|rels)$/i.test(name)&&/<!DOCTYPE|<!ENTITY/i.test(xml(name)))throw invalid();
  if(!xml('[Content_Types].xml').includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'))throw invalid();
  for(const name of entries.keys())if(name.endsWith('.rels')){
    if(/&#/i.test(xml(name)))throw invalid();
    for(const relationship of xml(name).matchAll(/<(?:[A-Za-z_][\w.-]*:)?Relationship\b[^>]*>/gi)){
      if(/TargetMode\s*=\s*["']External["']/i.test(relationship[0])&&!/Type\s*=\s*["'][^"']*\/hyperlink["']/i.test(relationship[0]))throw new Error('Dieses Word-Dokument lädt externe Inhalte. Bitte zuerst in Word als PDF speichern.');
    }
  }
  if(Array.from(xml('word/document.xml').matchAll(/<(?:w:)?instrText\b[^>]*>([\s\S]*?)<\/(?:w:)?instrText>|\bw:instr=["']([^"']*)["']/gi)).some(match=>/\b(?:INCLUDETEXT|INCLUDEPICTURE|DDEAUTO|DDE)\b/i.test(match[1]??match[2])))throw new Error('Dieses Word-Dokument enthält externe Feldfunktionen. Bitte zuerst als PDF speichern.');
}

export async function officeRuntimePath(){
  const candidates=[fileURLToPath(new URL('../runtime/libreoffice/LibreOffice.app',import.meta.url)),
    fileURLToPath(new URL(`../../local-data/office-runtime/${runtime.version}/${process.arch}/LibreOffice.app`,import.meta.url))];
  for(const app of candidates){try{await access(path.join(app,'Contents/MacOS/soffice'));return app;}catch{}}
  throw new Error('Der Word-Konverter fehlt im Tafelraum-Paket. Bitte die vollständige App installieren.');
}

export async function convertOfficeToPdf(input,outputDirectory,{signal,timeoutMs=60_000}={}){
  if(process.platform!=='darwin')throw new Error('Die mitgelieferte Word-Konvertierung benötigt macOS.');
  signal?.throwIfAborted();const app=await officeRuntimePath();
  const profile=path.join(outputDirectory,'profile');await mkdir(profile,{recursive:true});
  await writeFile(path.join(profile,'registrymodifications.xcu'),'<?xml version="1.0"?><oor:items xmlns:oor="http://openoffice.org/2001/registry"><item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item><item oor:path="/org.openoffice.Office.Writer/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>0</value></prop></item></oor:items>');
  // macOS Office startup needs local Unix IPC (LaunchServices/CoreText).
  // Block IP sockets, while preserving that OS-local communication.
  const sandbox=`(version 1) (allow default) (deny network-outbound (remote ip "*:*")) (deny network-inbound (local ip "*:*"))
    (deny file-write* (subpath ${JSON.stringify(await realpath(app))}))`;
  await new Promise((resolve,reject)=>{
    // This process has no network access; profile and all outputs are disposable.
    const child=spawn('/usr/bin/sandbox-exec',['-p',sandbox,path.join(app,'Contents/MacOS/soffice'),
      `-env:UserInstallation=${pathToFileURL(profile).href}`,'--headless','--nologo','--nodefault','--norestore',
      '--convert-to','pdf:writer_pdf_Export','--outdir',outputDirectory,input],{stdio:['ignore','ignore','pipe'],detached:true,
      env:{PATH:'/usr/bin:/bin',HOME:outputDirectory,TMPDIR:outputDirectory,LANG:'de_DE.UTF-8',PYTHONDONTWRITEBYTECODE:'1',PYTHONPYCACHEPREFIX:path.join(outputDirectory,'python-cache')}});
    let reason=null;
    const kill=error=>{reason=error;try{process.kill(-child.pid,'SIGKILL');}catch{child.kill('SIGKILL');}};
    const abort=()=>kill(new Error('Word-Import wurde abgebrochen.'));
    const timer=setTimeout(()=>kill(new Error('Die Word-Konvertierung dauert zu lange. Bitte die Datei als PDF speichern.')),timeoutMs);
    signal?.addEventListener('abort',abort,{once:true});
    child.stderr.resume();
    const finish=error=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);error?reject(error):resolve();};
    child.once('error',()=>finish(new Error('Der mitgelieferte Word-Konverter konnte nicht gestartet werden.')));
    child.once('close',code=>finish(reason??(code===0?null:new Error('Die Word-Datei konnte nicht als PDF umgewandelt werden.'))));
    if(signal?.aborted)abort();
  });
  const pdfPath=path.join(outputDirectory,path.basename(input,path.extname(input))+'.pdf');
  let pdf;try{pdf=await readFile(pdfPath);}catch{throw new Error('Die Word-Datei konnte nicht als PDF umgewandelt werden.');}
  if(pdf.length>100*1024*1024||pdf.length<20||pdf.subarray(0,5).toString()!=='%PDF-')throw new Error('Der Word-Konverter hat keine gültige PDF-Datei erzeugt.');
  return pdf;
}

export async function importOfficeDocument(materialRoot,name,request,{convert=convertOfficeToPdf,signal,beforeCommit=async()=>{}}={}){
  if(Number(request.headers['content-length'])>officeInputBytes)throw new Error('Word-Dateien dürfen höchstens 20 MB groß sein.');
  let size=0;const chunks=[];
  for await(const chunk of request){signal?.throwIfAborted();size+=chunk.length;if(size>officeInputBytes)throw new Error('Word-Dateien dürfen höchstens 20 MB groß sein.');chunks.push(chunk);}
  const source=Buffer.concat(chunks);validateDocx(source);signal?.throwIfAborted();
  // A normal material subfolder keeps the original with its PDF. Only the PDF is
  // a renderable material; no parallel registry, cache, or second archive root.
  let stem='';for(const character of path.basename(name,path.extname(name))){if(Buffer.byteLength(stem+character)>120)break;stem+=character;}
  stem=stem.trim()||'Word-Dokument';const pdfName=stem+'.pdf',sourceName=stem+'.docx';
  await mkdir(materialRoot,{recursive:true});
  let folder;
  for(let copy=0;;copy++){
    folder=stem+' – Word'+(copy?` – Kopie ${copy}`:'');const target=path.join(materialRoot,folder);
    try{
      const entry=await lstat(target);if(entry.isDirectory()&&!entry.isSymbolicLink()){
        const previous=await readFile(path.join(target,sourceName)).catch(()=>null);
        if(previous?.equals(source)){const pdf=await readFile(path.join(target,pdfName)).catch(()=>null);if(pdf?.subarray(0,5).toString()==='%PDF-')return {created:false,fileName:path.posix.join(folder,pdfName)};}
      }
    }catch(error){if(error.code==='ENOENT')break;throw error;}
  }
  const stage=await mkdtemp(path.join(materialRoot,'.office-import-'));
  const work=await mkdtemp(path.join(os.tmpdir(),'tafelraum-word-'));
  try{
    const input=path.join(work,'document.docx');await writeFile(input,source,{flag:'wx'});
    const pdf=await convert(input,work,{signal});signal?.throwIfAborted();
    if(!Buffer.isBuffer(pdf)||pdf.subarray(0,5).toString()!=='%PDF-')throw new Error('Keine gültige PDF-Datei aus Word erhalten.');
    await beforeCommit();signal?.throwIfAborted();
    await writeFile(path.join(stage,sourceName),source,{flag:'wx'});await writeFile(path.join(stage,pdfName),pdf,{flag:'wx'});
    await rename(stage,path.join(materialRoot,folder));return {created:true,fileName:path.posix.join(folder,pdfName)};
  }finally{await rm(stage,{recursive:true,force:true});await rm(work,{recursive:true,force:true});}
}

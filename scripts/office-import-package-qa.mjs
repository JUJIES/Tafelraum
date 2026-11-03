#!/usr/bin/env node
// Run with the bundled Node binary; temporary archive only, never the app profile.
import {mkdir,mkdtemp,readFile,readdir,readlink,rm,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL,fileURLToPath} from 'node:url';
import os from 'node:os';
import path from 'node:path';
const app=path.resolve(process.argv[2]);
const outputDirectory=process.argv[3] ? path.resolve(process.argv[3]) : fileURLToPath(new URL('../output/office-import-qa',import.meta.url));
await mkdir(outputDirectory,{recursive:true});
const resources=path.join(app,'Contents/Resources/desktop-resources');
if(process.execPath!==path.join(resources,'runtime/node'))throw Error('Run this check with bundled Node.');
const {createDesktopServer}=await import(pathToFileURL(path.join(resources,'server/desktop-server.mjs')));
const {officeRuntimePath}=await import(pathToFileURL(path.join(resources,'server/office-import.mjs')));
if(await officeRuntimePath()!==path.join(resources,'runtime/libreoffice/LibreOffice.app'))throw Error('Converter was not resolved from the bundle.');
async function digestTree(root){
 const hash=createHash('sha256');let count=0;
 async function visit(dir,relative=''){
  const entries=await readdir(dir,{withFileTypes:true});entries.sort((a,b)=>a.name.localeCompare(b.name,'en'));
  for(const entry of entries){const rel=path.posix.join(relative,entry.name),full=path.join(dir,entry.name);hash.update(rel+'\0');
   if(entry.isSymbolicLink())hash.update(await readlink(full));else if(entry.isDirectory())await visit(full,rel);else{count++;hash.update(await readFile(full));}}
 }
 await visit(root);return {sha256:hash.digest('hex'),fileCount:count};
}
const before=await digestTree(resources);
const temporary=await mkdtemp(path.join(os.tmpdir(),'tafelraum-word-package-'));
let server;
try{
 server=await createDesktopServer({archiveRoot:path.join(temporary,'archive'),notesRoot:path.join(temporary,'notes'),webRoot:path.join(resources,'web')});
 const base=`http://127.0.0.1:${server.address().port}/api/archive/lessons/lesson-start/materials`;
 const fixture=fileURLToPath(new URL('../output/office-import-qa/Tabellen und Bilder.docx',import.meta.url));
 const source=await readFile(fixture);
 const send=bytes=>fetch(base+'/file?name=Offline%20Pakettest.docx',{method:'PUT',body:bytes});
 const started=performance.now(),result=await send(source);if(result.status!==201)throw Error('Package conversion failed: '+await result.text());
 const saved=await result.json();if(saved.material.kind!=='pdf')throw Error('No PDF material returned.');
 const file=await fetch(base+'/file?'+new URLSearchParams({path:saved.material.path}));const pdf=Buffer.from(await file.arrayBuffer());if(!file.ok||pdf.subarray(0,5).toString()!=='%PDF-')throw Error('Invalid PDF.');
 const original=await readFile(path.join(temporary,'archive',saved.archiveMaterialPath.replace(/\.pdf$/,'.docx')));if(!original.equals(source))throw Error('Changed original.');
 if((await send(source)).status!==200)throw Error('Duplicate import not reused.');
 if((await send(Buffer.from('broken DOCX'))).status!==422)throw Error('Corrupt DOCX not rejected.');
 const list=await(await fetch(base)).json();if(list.materials.length!==1)throw Error('Duplicate/partial material visible.');
 const output=path.join(outputDirectory,'package-output.pdf');await writeFile(output,pdf);
 const after=await digestTree(resources);if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Converter changed its app bundle.');
 const signature=spawnSync('/usr/bin/codesign',['--verify','--deep','--strict',app],{encoding:'utf8'});if(signature.status!==0)throw Error('Package signature changed after conversion.');
 const version=spawnSync('/usr/libexec/PlistBuddy',['-c','Print :CFBundleShortVersionString',path.join(app,'Contents/Info.plist')],{encoding:'utf8'});if(version.status!==0)throw Error('Cannot read bundle version.');
 const proof={version:version.stdout.trim(),bundledNode:true,bundledConverter:true,sourceByteEqual:true,materialEntries:1,duplicateReused:true,invalidRejected:true,resourcesUnchanged:after,signatureValid:true,conversionSeconds:(performance.now()-started)/1000,pdfBytes:pdf.length};
 await writeFile(path.join(outputDirectory,'package-proof.json'),JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{if(server)await new Promise(resolve=>server.close(resolve));await rm(temporary,{recursive:true,force:true});}

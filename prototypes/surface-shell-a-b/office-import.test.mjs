import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,rm,access} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {createServer} from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {createArchiveMiddleware} from './archive-server.mjs';
import {initializeEmptyArchive} from './desktop-server.mjs';
import {validateDocx,importOfficeDocument} from './office-import.mjs';
import {docxFixture,zipFixture} from './office-import/fixtures.mjs';
const pdf=Buffer.from('%PDF-1.4\n% synthetic converter result\n%%EOF\n');
function request(bytes){const value=Readable.from([bytes]);value.headers={'content-length':String(bytes.length)};return value;}

test('DOCX validation rejects disguised ZIPs, expansion bombs, active and externally loaded contents',()=>{
  assert.doesNotThrow(()=>validateDocx(docxFixture()));
  for(const file of [Buffer.from('%PDF-not-a-word-file'),zipFixture({'file.txt':'bad'}),docxFixture('text',{'word/vbaProject.bin':Buffer.from([0])}),docxFixture('text',{'word/_rels/document.xml.rels':'<Relationships><Relationship TargetMode="External" Type="image" Target="file:///private/test"/></Relationships>'})])assert.throws(()=>validateDocx(file));
  assert.doesNotThrow(()=>validateDocx(docxFixture('DDE is ordinary text',{'word/_rels/document.xml.rels':'<Relationships><Relationship TargetMode="External" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://example.org"/></Relationships>'})));
  const bomb=docxFixture();const central=bomb.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));bomb.writeUInt32LE(150*1024*1024,central+24);assert.throws(()=>validateDocx(bomb));
});

test('failed or cancelled conversion never publishes a partial source/PDF pair and cleans temporary work',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tafelraum-word-failure-'));let input;
  try{
    await assert.rejects(importOfficeDocument(root,'Test.docx',request(docxFixture()),{convert:async file=>{input=file;throw Error('conversion failure');}}),/conversion failure/);
    assert.deepEqual(await readdir(root),[]);await assert.rejects(access(input));
    const controller=new AbortController();await assert.rejects(importOfficeDocument(root,'Test.docx',request(docxFixture()),{signal:controller.signal,convert:async()=>{controller.abort();return pdf;}}));assert.deepEqual(await readdir(root),[]);
  }finally{await rm(root,{recursive:true,force:true});}
});

test('all archive uploads share one PDF import path, preserve originals, deduplicate and recover after conversion failure',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'tafelraum-word-archive-'));await initializeEmptyArchive(root);
  let conversions=0,fail=false;
  const middleware=createArchiveMiddleware(root,{convertOffice:async()=>{conversions++;if(fail)throw Error('Word-Konvertierung fehlgeschlagen.');return pdf;}});
  const server=createServer((req,res)=>void middleware(req,res,()=>{res.writeHead(404);res.end();}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api/archive/lessons/lesson-start/materials`;
  const send=(name,bytes)=>fetch(`${base}/file?${new URLSearchParams({name})}`,{method:'PUT',body:bytes,headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}});
  try{
    const source=docxFixture();const first=await send('Arbeitsblatt.docx',source);assert.equal(first.status,201);const saved=await first.json();assert.equal(saved.material.kind,'pdf');assert.match(saved.material.path,/Arbeitsblatt – Word\/Arbeitsblatt.pdf$/);
    assert.ok((await readFile(path.join(root,saved.archiveMaterialPath.replace(/\.pdf$/,'.docx')))).equals(source));
    const list=await(await fetch(base)).json();assert.equal(list.materials.length,1);assert.equal(list.materials[0].mimeType,'application/pdf');
    const file=await fetch(`${base}/file?${new URLSearchParams({path:saved.material.path})}`);assert.equal(file.headers.get('content-type'),'application/pdf');assert.ok(Buffer.from(await file.arrayBuffer()).equals(pdf));
    const repeat=await send('Arbeitsblatt.docx',source);assert.equal(repeat.status,200);assert.equal((await repeat.json()).archiveMaterialPath,saved.archiveMaterialPath);assert.equal(conversions,1);
    const other=await send('Arbeitsblatt.docx',docxFixture('Different text'));assert.equal(other.status,201);assert.notEqual((await other.json()).archiveMaterialPath,saved.archiveMaterialPath);
    fail=true;assert.equal((await send('Kaputt.docx',docxFixture())).status,422);assert.equal((await(await fetch(base)).json()).materials.length,2);
    fail=false;assert.equal((await send('Kaputt.docx',docxFixture())).status,201);assert.equal((await(await fetch(base)).json()).materials.length,3);
    assert.equal((await send('falsch.docx',Buffer.from('not a zip'))).status,422);
  }finally{await new Promise(resolve=>server.close(resolve));await rm(root,{recursive:true,force:true});}
});

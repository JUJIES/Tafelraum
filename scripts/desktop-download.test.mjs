import test from 'node:test';import assert from 'node:assert/strict';import{mkdtemp,writeFile,rm,readFile}from'node:fs/promises';import{tmpdir}from'node:os';import path from'node:path';import{createHash}from'node:crypto';
import{downloadIdentity}from'./package-desktop-download.mjs';import{verifyDownload}from'./verify-desktop-download.mjs';
test('edition identities separate full/MDM and commit-bound public packages',()=>{
 assert.equal(downloadIdentity('personal','0.1.92').filename,'Tafelraum-MDM-0.1.92-macOS-arm64.zip');
 assert.equal(downloadIdentity('public','0.1.88','a'.repeat(40)).channel,'public');
 assert.throws(()=>downloadIdentity('public','0.1.88'));
 assert.throws(()=>downloadIdentity('public','../bad','a'.repeat(40)));
 assert.throws(()=>downloadIdentity('other','1.2.3'));
});
test('download validation binds profile, version, ZIP bytes and guide before upload',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'tafelraum-download-check-'));
 try{
 const identity=downloadIdentity('personal','0.1.92'),zip=Buffer.from('synthetic app bytes'),guide='KOLLEGEN / MDM';
 const hash=b=>createHash('sha256').update(b).digest('hex');
 const d={...identity,bytes:zip.length,sha256:hash(zip),instructionsSha256:hash(guide)};
 await writeFile(path.join(root,identity.filename),zip);await writeFile(path.join(root,identity.instructions),guide);await writeFile(path.join(root,'download.json'),JSON.stringify(d));
 assert.equal((await verifyDownload(root,'mdm','0.1.92')).version,'0.1.92');
 await assert.rejects(verifyDownload(root,'public','0.1.92'));
 await assert.rejects(verifyDownload(root,'mdm','0.1.91'));
 await writeFile(path.join(root,identity.instructions),'PUBLIC EDITION');await assert.rejects(verifyDownload(root,'mdm','0.1.92'),/Guide differs/);
 await writeFile(path.join(root,identity.instructions),guide);await writeFile(path.join(root,identity.filename),'tampered');await assert.rejects(verifyDownload(root,'mdm','0.1.92'));
 }finally{await rm(root,{recursive:true,force:true});}
});
test('public installation guide is an explicit export adapter, not the MDM recipe',async()=>{
 const {publicAdapters}=await import('./public-distribution.mjs');
 assert.equal(publicAdapters['distribution/INSTALLATIONSANLEITUNG.txt'],'INSTALLATIONSANLEITUNG.txt');
 const base=new URL('../prototypes/surface-shell-a-b/distribution/',import.meta.url);
 const publicGuide=await readFile(new URL('public/INSTALLATIONSANLEITUNG.txt',base),'utf8');
 assert.match(publicGuide,/PUBLIC EDITION/);assert.doesNotMatch(publicGuide,/xattr -dr/);
});

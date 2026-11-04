import test from 'node:test';
import assert from 'node:assert/strict';
import {validateReleaseSet,verifyPublicReleaseSet,validateWindowsBuildReceipt,publicPlatforms} from './public-release-set.mjs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import path from 'node:path';
const expected={version:'1.2.3',sourceCommit:'a'.repeat(40)};
test('official Windows receipt rejects QA identity and another source',()=>{
  const receipt={schemaVersion:1,profile:'public',channel:'public',identifier:'app.jujies.tafelraum.public',port:49318,platform:'windows-x86_64',...expected,installerSha256:'b'.repeat(64),installerBytes:100,nodeVersion:'v24.22.2',nodeSha256:'c'.repeat(64)};
  const pin={version:'v24.22.2',nodeSha256:'c'.repeat(64)};
  validateWindowsBuildReceipt(receipt,expected,pin);
  for(const patch of [{channel:'qa-installer'},{identifier:'app.jujies.tafelraum.public.qa.windows'},
    {sourceCommit:'d'.repeat(40)},{version:'1.2.2'},{installerBytes:0},{nodeSha256:'unknown'}]){
    assert.throws(()=>validateWindowsBuildReceipt({...receipt,...patch},expected,pin));
  }
  assert.throws(()=>validateWindowsBuildReceipt({...receipt,nodeVersion:'v22.18.0'},expected,pin));
});
function fixture(){
  const base='https://github.com/JUJIES/Tafelraum/releases/download/v1.2.3/';
  const downloads=publicPlatforms.map(platform=>{
    const win=platform==='windows-x86_64';
    const filename=win?'Tafelraum-Public-1.2.3-Windows-x64-setup.exe':'Tafelraum-Public-1.2.3-macOS-arm64.zip';
    return {schemaVersion:1,profile:'public',channel:'public',updateChannel:'public',...expected,platform,filename,url:base+filename,bytes:10,sha256:'b'.repeat(64),instructions:win?'WINDOWS-INSTALLATION.txt':'INSTALLATIONSANLEITUNG.txt',instructionsSha256:'c'.repeat(64),updater:{filename:win?filename:'Tafelraum-Public.app.tar.gz',bytes:10,sha256:'b'.repeat(64),signature:'test-signature'}};
  });
  const latest={...expected,edition:'public',platforms:Object.fromEntries(downloads.map(d=>[d.platform,{url:base+d.updater.filename,signature:d.updater.signature}]))};
  return {latest,downloads};
}
test('a public release binds both platform packages to one source and version',()=>{
  assert.deepEqual(validateReleaseSet(fixture(),expected).platforms,publicPlatforms);
});

test('artifact and guide bytes are checked rather than trusting the manifests',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'public-release-set-'));
  const data=fixture(),content=Buffer.from('synthetic test artifact');
  const hash=createHash('sha256').update(content).digest('hex');
  try{
    for(const d of data.downloads){
      d.sha256=hash;d.bytes=content.length;d.instructionsSha256=hash;
      d.updater.sha256=hash;d.updater.bytes=content.length;
      for(const name of [d.filename,d.instructions,d.updater.filename])await writeFile(path.join(dir,name),content);
      await writeFile(path.join(dir,d.updater.filename+'.sig'),d.updater.signature);
    }
    await writeFile(path.join(dir,'download.json'),JSON.stringify(data.downloads[0]));
    await writeFile(path.join(dir,'windows-download.json'),JSON.stringify(data.downloads[1]));
    await writeFile(path.join(dir,'latest.json'),JSON.stringify(data.latest));
    await verifyPublicReleaseSet(dir,expected);
    await writeFile(path.join(dir,data.downloads[1].filename),'tampered');
    await assert.rejects(verifyPublicReleaseSet(dir,expected));
    await writeFile(path.join(dir,data.downloads[1].filename),content);
    await writeFile(path.join(dir,data.downloads[1].instructions),'wrong guide');
    await assert.rejects(verifyPublicReleaseSet(dir,expected),/guide differs/);
  }finally{await rm(dir,{recursive:true,force:true});}
});
test('partial releases, mixed versions/sources and edition or signature drift fail closed',()=>{
  for(const change of [
    s=>delete s.latest.platforms['darwin-aarch64'],
    s=>s.downloads.pop(),
    s=>s.downloads[1].sourceCommit='d'.repeat(40),
    s=>s.downloads[1].version='1.2.4',
    s=>s.downloads[1].updateChannel='colleagues',
    s=>s.latest.platforms['windows-x86_64'].signature='other',
    s=>s.latest.platforms['windows-x86_64'].url='https://example.com/update.exe',
    s=>s.downloads[1].instructions='../secret',
    s=>s.downloads[1].updater.sha256='e'.repeat(64)
  ]){const s=fixture();change(s);assert.throws(()=>validateReleaseSet(s,expected));}
});

// One public source/version, platform-specific artifacts. Never publish a partial set.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const publicPlatforms = ['darwin-aarch64', 'windows-x86_64'];
const safeName = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
export function validateWindowsBuildReceipt(receipt,{version,sourceCommit},runtimePin){
  for(const [key,value] of Object.entries({schemaVersion:1,profile:'public',channel:'public',
    identifier:'app.jujies.tafelraum.public',port:49318,platform:'windows-x86_64',version,sourceCommit})){
    assert.equal(receipt[key],value,'Windows build receipt mismatch: '+key);
  }
  assert.match(receipt.installerSha256,/^[a-f0-9]{64}$/);
  assert.ok(Number.isSafeInteger(receipt.installerBytes)&&receipt.installerBytes>0);
  assert.match(receipt.nodeVersion,/^v?\d+\.\d+\.\d+$/);
  assert.match(receipt.nodeSha256,/^[a-f0-9]{64}$/);
  assert.equal(receipt.nodeVersion,runtimePin.version,'Windows runtime version differs from source pin');
  assert.equal(receipt.nodeSha256,runtimePin.nodeSha256,'Windows runtime binary differs from source pin');
  return receipt;
}
export function validateReleaseSet({latest,downloads}, {version,sourceCommit}) {
  assert.match(version,/^\d+\.\d+\.\d+$/);
  assert.match(sourceCommit,/^[a-f0-9]{40}$/);
  assert.equal(latest.version,version);
  assert.equal(latest.sourceCommit,sourceCommit);
  assert.equal(latest.edition,'public');
  assert.deepEqual(Object.keys(latest.platforms).sort(),[...publicPlatforms].sort(),'Every supported public platform must be present');
  assert.deepEqual(downloads.map(d=>d.platform).sort(),[...publicPlatforms].sort());
  const names = new Set();
  for (const d of downloads) {
    assert.equal(d.schemaVersion,1);
    assert.equal(d.profile,'public');
    assert.equal(d.channel,'public');
    assert.equal(d.updateChannel,'public');
    assert.equal(d.version,version);
    assert.equal(d.sourceCommit,sourceCommit,'Mixed public source commits');
    for (const name of [d.filename,d.instructions]) {
      assert.ok(safeName(name),'Unsafe artifact name');
      assert.ok(!names.has(name),'Platform artifacts must have distinct names');
      names.add(name);
    }
    assert.match(d.sha256,/^[a-f0-9]{64}$/);
    assert.match(d.instructionsSha256,/^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(d.bytes)&&d.bytes>0);
    assert.ok(safeName(d.updater.filename));
    assert.match(d.updater.sha256,/^[a-f0-9]{64}$/);
    assert.ok(Number.isSafeInteger(d.updater.bytes)&&d.updater.bytes>0);
    assert.ok(typeof d.updater.signature==='string'&&d.updater.signature.trim().length>0);
    const base=`https://github.com/JUJIES/Tafelraum/releases/download/v${version}/`;
    assert.equal(d.url,base+d.filename);
    assert.deepEqual(latest.platforms[d.platform],{url:base+d.updater.filename,signature:d.updater.signature});
    if(d.platform==='windows-x86_64') {
      assert.equal(d.filename,`Tafelraum-Public-${version}-Windows-x64-setup.exe`);
      assert.equal(d.instructions,'WINDOWS-INSTALLATION.txt');
      assert.equal(d.updater.filename,d.filename);
      assert.equal(d.updater.sha256,d.sha256);
      assert.equal(d.updater.bytes,d.bytes);
    } else {
      assert.equal(d.filename,`Tafelraum-Public-${version}-macOS-arm64.zip`);
      assert.equal(d.instructions,'INSTALLATIONSANLEITUNG.txt');
      assert.equal(d.updater.filename,'Tafelraum-Public.app.tar.gz');
    }
  }
  return {version,sourceCommit,platforms:[...publicPlatforms]};
}

export async function verifyPublicReleaseSet(directory,expected) {
  const json=async file=>JSON.parse(await readFile(path.join(directory,file),'utf8'));
  const latest=await json('latest.json');
  const downloads=await Promise.all(['download.json','windows-download.json'].map(json));
  const result=validateReleaseSet({latest,downloads},expected);
  const hash=async filename=>{
    const h=createHash('sha256');
    for await(const chunk of createReadStream(path.join(directory,filename)))h.update(chunk);
    return h.digest('hex');
  };
  for(const d of downloads){
    for(const item of [d,d.updater]){
      assert.equal((await stat(path.join(directory,item.filename))).size,item.bytes);
      assert.equal(await hash(item.filename),item.sha256,'Artifact bytes differ: '+item.filename);
    }
    assert.equal(await hash(d.instructions),d.instructionsSha256,'Installation guide differs');
    assert.equal((await readFile(path.join(directory,d.updater.filename+'.sig'),'utf8')).trim(),d.updater.signature);
  }
  // Structural/hash checks complement cryptographic updater verification, not replace it.
  return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [directory,version,sourceCommit]=process.argv.slice(2);
  assert.ok(directory&&version&&sourceCommit,'RELEASE_DIRECTORY VERSION SOURCE_COMMIT');
  console.log(JSON.stringify(await verifyPublicReleaseSet(directory,{version,sourceCommit})));
}

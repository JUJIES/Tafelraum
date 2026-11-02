import assert from 'node:assert/strict';import{readFile,stat}from'node:fs/promises';import{createReadStream}from'node:fs';import{createHash}from'node:crypto';import path from'node:path';import{fileURLToPath}from'node:url';
import{downloadIdentity}from'./package-desktop-download.mjs';
export async function verifyDownload(directory,channel,version){
 const d=JSON.parse(await readFile(path.join(directory,'download.json'),'utf8'));
 assert.ok(channel==='mdm'||channel==='public');const identity=downloadIdentity(channel==='mdm'?'personal':'public',version,d.sourceCommit);
 for(const [k,v]of Object.entries(identity))assert.equal(d[k],v,'Download identity mismatch: '+k);
 assert.match(d.sha256,/^[a-f0-9]{64}$/);assert.match(d.instructionsSha256,/^[a-f0-9]{64}$/);
 const file=path.join(directory,d.filename);assert.equal((await stat(file)).size,d.bytes);
 const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);assert.equal(hash.digest('hex'),d.sha256,'ZIP bytes differ');
 assert.equal(createHash('sha256').update(await readFile(path.join(directory,d.instructions))).digest('hex'),d.instructionsSha256,'Guide differs');
 if(d.updater){
  assert.equal(channel,'public');assert.equal(d.updateChannel,'public');
  assert.equal(d.url,'https://github.com/JUJIES/Tafelraum/releases/download/v'+version+'/'+d.filename);
  assert.equal(d.updater.filename,'Tafelraum-Public.app.tar.gz');
  const archive=path.join(directory,d.updater.filename),updateHash=createHash('sha256');
  assert.equal((await stat(archive)).size,d.updater.bytes);
  for await(const chunk of createReadStream(archive))updateHash.update(chunk);
  assert.equal(updateHash.digest('hex'),d.updater.sha256,'Updater archive differs');
  assert.equal((await readFile(archive+'.sig','utf8')).trim(),d.updater.signature);
  const latest=JSON.parse(await readFile(path.join(directory,'latest.json'),'utf8'));
  assert.equal(latest.version,version);assert.equal(latest.sourceCommit,d.sourceCommit);assert.equal(latest.edition,'public');
  assert.equal(latest.platforms['darwin-aarch64'].url,'https://github.com/JUJIES/Tafelraum/releases/download/v'+version+'/'+d.updater.filename);
  assert.equal(latest.platforms['darwin-aarch64'].signature,d.updater.signature);
 }
 return d;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [directory,channel,version]=process.argv.slice(2);console.log(JSON.stringify(await verifyDownload(directory,channel,version)));
}

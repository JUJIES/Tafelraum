import assert from 'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';import path from'node:path';import{fileURLToPath}from'node:url';
import{verifyDownload}from'./verify-desktop-download.mjs';
export async function verifyPublishedDownload(channel,directory){
 const policy=JSON.parse(await readFile(new URL('./downloads/release-policy.json',import.meta.url),'utf8')).channels[channel];assert.ok(policy);
 const local=JSON.parse(await readFile(path.join(directory,'download.json'),'utf8'));await verifyDownload(directory,channel,local.version);
 const latest=await fetch(policy.latestManifest+'?check='+Date.now(),{cache:'no-store'});assert.ok(latest.ok);assert.equal((await latest.json()).version,local.version);
 const manifestURL=policy.versionedManifest.replace('{version}',local.version);
 const manifest=await fetch(manifestURL,{cache:'no-store'});assert.ok(manifest.ok);assert.deepEqual(await manifest.json(),local);
 const url=channel==='public'?'https://github.com/JUJIES/Tafelraum/releases/download/v'+local.version+'/'+local.filename:new URL(local.filename,manifestURL).href;
 if(local.url)assert.equal(local.url,url);
 const response=await fetch(url);assert.ok(response.ok,'Published ZIP unavailable');
 const hash=createHash('sha256');let bytes=0;for await(const chunk of response.body){hash.update(chunk);bytes+=chunk.length;}
 assert.equal(bytes,local.bytes);assert.equal(hash.digest('hex'),local.sha256,'Public ZIP bytes differ');
 const guide=await fetch(new URL(local.instructions,manifestURL));assert.ok(guide.ok);
 assert.equal(createHash('sha256').update(Buffer.from(await guide.arrayBuffer())).digest('hex'),local.instructionsSha256);
 const page=await fetch(policy.downloadPage);assert.ok(page.ok);
 const proof={channel,profile:local.profile,version:local.version,sourceCommit:local.sourceCommit??null,sha256:local.sha256,download:policy.downloadPage,artifact:url,bytes,verifiedAt:new Date().toISOString()};
 await writeFile(path.join(directory,'download-publication-proof.json'),JSON.stringify(proof,null,2)+'\n');return proof;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const[channel,directory]=process.argv.slice(2);console.log(JSON.stringify(await verifyPublishedDownload(channel,directory),null,2));}

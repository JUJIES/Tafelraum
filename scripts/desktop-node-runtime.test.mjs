import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {prepareMacNode,assertMacRuntimeCompatibility} from './prepare-macos-node.mjs';
test('runtime OS requirements cannot silently exceed the app minimum',()=>{
  assertMacRuntimeCompatibility('11.0','12.0');
  assertMacRuntimeCompatibility('12.0.1','12.0.1');
  assert.throws(()=>assertMacRuntimeCompatibility('13.5','12.0'));
  assert.throws(()=>assertMacRuntimeCompatibility('12.0.1','12.0'));
});
test('Mac runtime pin and original licence evidence agree',async()=>{
  const spec=JSON.parse(await readFile(new URL('./desktop-node-runtime.json',import.meta.url),'utf8'));
  const provenance=JSON.parse(await readFile(new URL('../prototypes/surface-shell-a-b/runtime-licenses/node/provenance.json',import.meta.url),'utf8'));
  const license=await readFile(new URL('../prototypes/surface-shell-a-b/runtime-licenses/node/LICENSE',import.meta.url));
  assert.equal(spec.platforms['darwin-arm64'].version,provenance.version);
  assert.equal(spec.platforms['darwin-arm64'].licenseSha256,provenance.sha256);
  assert.equal(createHash('sha256').update(license).digest('hex'),provenance.sha256);
});
test('tampered Mac cache is rejected before extraction or execution',{skip:process.platform!=='darwin'||process.arch!=='arm64'},async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'tafelraum-node-'));
  try{
    const spec=JSON.parse(await readFile(new URL('./desktop-node-runtime.json',import.meta.url),'utf8'));
    const pin=spec.platforms['darwin-arm64'],folder=path.join(root,pin.version,'darwin-arm64');
    await mkdir(folder,{recursive:true});await writeFile(path.join(folder,pin.filename),'tampered');
    await assert.rejects(prepareMacNode(root),/Cached Node archive changed/);
  }finally{await rm(root,{recursive:true,force:true});}
});

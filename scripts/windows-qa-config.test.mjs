import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {desktopReleaseIdentity} from './desktop-release-config.mjs';
const app=new URL('../prototypes/surface-shell-a-b/',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,app),'utf8'));
const catalog=await read('distribution/desktop-channels.json');
const qa=await read('src-tauri/tauri.windows-qa.conf.json');
qa.version='0.1.91';
test('Windows QA is isolated and cannot inherit an official updater',()=>{
 const identity=desktopReleaseIdentity('public',qa,catalog);
 assert.equal(identity.channel,'qa');assert.equal(identity.port,49319);
 assert(!Object.values(catalog).some(l=>l.identifier===identity.identifier||l.port===identity.port));
 for(const mutate of [
  c=>c.plugins.updater={endpoints:[catalog.public.endpoint],pubkey:catalog.public.publicKey},
  c=>c.identifier=catalog.public.identifier,
  c=>c.bundle.createUpdaterArtifacts=true,
  c=>c.bundle.active=true,
  c=>c.plugins['tafelraum-qa'].port=49318
 ]){const invalid=structuredClone(qa);mutate(invalid);assert.throws(()=>desktopReleaseIdentity('public',invalid,catalog));}
 assert.throws(()=>desktopReleaseIdentity('personal',qa,catalog));
 assert.deepEqual(qa.app.security.capabilities[0].remote.urls,['http://127.0.0.1:49319/*']);
});

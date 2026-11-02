import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {desktopReleaseIdentity} from './desktop-release-config.mjs';
const catalog = JSON.parse(await readFile(new URL('../prototypes/surface-shell-a-b/distribution/desktop-channels.json',import.meta.url),'utf8'));
const config = profile => ({identifier:catalog[profile].identifier,version:'1.2.3',bundle:{createUpdaterArtifacts:true},plugins:{updater:{endpoints:[catalog[profile].endpoint],pubkey:catalog[profile].publicKey}}});
test('manual builds and two official channels retain distinct identities and ports',()=>{
 for(const profile of ['personal','public']) {
  const c=config(profile);
  assert.equal(desktopReleaseIdentity(profile,c,catalog).channel,catalog[profile].channel);
  delete c.plugins.updater;c.bundle.createUpdaterArtifacts=false;
  assert.equal(desktopReleaseIdentity(profile,c,catalog).channel,'manual');
 }
 assert.notEqual(catalog.personal.identifier,catalog.public.identifier);
 assert.notEqual(catalog.personal.port,catalog.public.port);
 assert.notEqual(catalog.personal.publicKey,catalog.public.publicKey);
});
test('cross-channel endpoints, keys, app identities and incomplete official builds fail closed',()=>{
 for(const profile of ['personal','public']) {
  const other=profile==='personal'?'public':'personal';
  for(const field of ['endpoint','publicKey','identifier']) {
   const c=config(profile);
   if(field==='endpoint')c.plugins.updater.endpoints=[catalog[other].endpoint];
   if(field==='publicKey')c.plugins.updater.pubkey=catalog[other].publicKey;
   if(field==='identifier')c.identifier=catalog[other].identifier;
   assert.throws(()=>desktopReleaseIdentity(profile,c,catalog));
  }
  const c=config(profile);c.bundle.createUpdaterArtifacts=false;
  assert.throws(()=>desktopReleaseIdentity(profile,c,catalog));
 }
});

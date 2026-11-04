import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {readDesktopRelease,desktopReleaseIdentity} from './desktop-release-config.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const qa=JSON.parse(await readFile(new URL('../prototypes/surface-shell-a-b/src-tauri/tauri.macos-qa.conf.json',import.meta.url),'utf8'));
test('Mac QA uses its own origin and cannot inherit public delivery',async()=>{
  const result=await readDesktopRelease(root,qa);
  assert.equal(result.channel,'qa-macos');assert.equal(result.port,49321);
  assert.deepEqual(qa.app.security.capabilities[0].remote.urls,['http://127.0.0.1:49321/*']);
  for(const change of [c=>c.plugins.updater={},c=>c.bundle.createUpdaterArtifacts=true,
    c=>c.identifier='app.jujies.tafelraum.public',c=>c.plugins['tafelraum-qa'].port=49318]){
    const c=structuredClone(qa);change(c);assert.throws(()=>desktopReleaseIdentity('public',c,{}));
  }
  assert.throws(()=>desktopReleaseIdentity('personal',qa,{}));
});

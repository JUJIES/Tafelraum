// Product profile and desktop delivery are independent; official channels are fixed.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function desktopReleaseIdentity(profile, config, catalog) {
  const lane = catalog[profile];
  assert.ok(lane, 'Unknown source profile');
  assert.equal(config.identifier, lane.identifier, 'App identity belongs to another edition');
  const updater = config.plugins?.updater;
  if (updater) {
    assert.deepEqual(updater.endpoints, [lane.endpoint], 'Updater endpoint belongs to another channel');
    assert.equal(updater.pubkey, lane.publicKey, 'Updater key belongs to another channel');
    assert.equal(config.bundle.createUpdaterArtifacts, true, 'Official builds require update artifacts');
  } else {
    assert.equal(config.bundle.createUpdaterArtifacts, false, 'Manual builds must not claim an updater');
  }
  return {schemaVersion:1, profile, channel:updater ? lane.channel : 'manual',
    identifier:lane.identifier, port:lane.port, version:config.version,
    ...(updater ? {endpoint:lane.endpoint,publicKey:lane.publicKey} : {})};
}

export async function readDesktopRelease(root, override = process.env.TAURI_CONFIG) {
  const app = path.join(root,'prototypes/surface-shell-a-b');
  const read = async file => JSON.parse(await readFile(path.join(app,file),'utf8'));
  const profile = (await read('distribution.json')).profile;
  const catalog = await read('distribution/desktop-channels.json');
  const config = await read('src-tauri/tauri.conf.json');
  if (override) {
    // Tauri passes its CLI --config override as JSON to the resource build.
    const patch = typeof override === 'string' ? JSON.parse(override) : override;
    if (patch.version) config.version = patch.version;
    if (patch.identifier) config.identifier = patch.identifier;
    if (patch.productName) config.productName = patch.productName;
    config.bundle = {...config.bundle,...patch.bundle};
    config.plugins = {...config.plugins,...patch.plugins};
  }
  return desktopReleaseIdentity(profile, config, catalog);
}

export async function writeDesktopRelease(root, output) {
  const identity = await readDesktopRelease(root);
  let commit = null;
  try { commit = execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch {}
  await writeFile(output, JSON.stringify({...identity,sourceCommit:commit},null,2)+'\n');
  return identity;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('../',import.meta.url));
  const output = process.argv[2];
  if (output) console.log(JSON.stringify(await writeDesktopRelease(root,output)));
  else console.log(JSON.stringify(await readDesktopRelease(root)));
}

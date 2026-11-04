// Product profile and desktop delivery are independent; official channels are fixed.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function desktopReleaseIdentity(profile, config, catalog) {
  if (config.identifier === 'app.jujies.tafelraum.public.qa.windows.update') {
    assert.equal(profile, 'public');
    assert.deepEqual(config.plugins?.['tafelraum-qa'], {platform:'windows',port:49321,package:'nsis',update:'loopback'});
    const updater = config.plugins?.updater;
    assert.deepEqual(updater?.endpoints, ['http://127.0.0.1:49322/latest.json']);
    assert.equal(updater.dangerousInsecureTransportProtocol, true);
    assert.equal(updater.windows?.installMode, 'passive');
    assert.ok(typeof updater.pubkey === 'string' && updater.pubkey.length > 100);
    assert.ok(!Object.values(catalog).some(lane => lane.publicKey === updater.pubkey), 'Local QA requires a disposable key');
    assert.equal(config.bundle.active, true);
    assert.deepEqual(config.bundle.targets, ['nsis']);
    assert.equal(config.bundle.createUpdaterArtifacts, true);
    assert.equal(config.bundle.windows?.nsis?.installMode, 'currentUser');
    assert.equal(config.bundle.windows?.nsis?.installerHooks, 'windows/installer-qa-hooks.nsh');
    assert.equal(config.mainBinaryName, 'Tafelraum-Update-QA');
    return {schemaVersion:1,profile,channel:'qa-update',identifier:config.identifier,port:49321,version:config.version};
  }
  if(config.identifier==='app.jujies.tafelraum.public.qa.macos'){
    assert.equal(profile,'public');
    assert.deepEqual(config.plugins?.['tafelraum-qa'],{platform:'macos',port:49321});
    assert.ok(!config.plugins?.updater);
    assert.equal(config.bundle.active,true);
    assert.equal(config.bundle.createUpdaterArtifacts,false);
    assert.deepEqual(config.bundle.targets,['app']);
    return {schemaVersion:1,profile,channel:'qa-macos',identifier:config.identifier,port:49321,version:config.version};
  }
  if (config.identifier === 'app.jujies.tafelraum.public.qa.windows.installer') {
    assert.equal(profile, 'public');
    assert.deepEqual(config.plugins?.['tafelraum-qa'], {platform:'windows', port:49320, package:'nsis'});
    assert.ok(!config.plugins?.updater, 'Installer QA must not configure an updater');
    assert.equal(config.bundle.active, true);
    assert.deepEqual(config.bundle.targets, ['nsis']);
    assert.equal(config.bundle.createUpdaterArtifacts, false);
    assert.equal(config.bundle.windows?.nsis?.installMode, 'currentUser');
    assert.equal(config.bundle.windows?.nsis?.installerHooks, 'windows/installer-qa-hooks.nsh');
    assert.equal(config.mainBinaryName, 'Tafelraum-Installer-QA');
    return {schemaVersion:1, profile, channel:'qa-installer', identifier:config.identifier, port:49320, version:config.version};
  }
  if (config.identifier === 'app.jujies.tafelraum.public.qa.windows') {
    assert.equal(profile, 'public', 'QA requires public source');
    assert.deepEqual(config.plugins?.['tafelraum-qa'], {platform:'windows', port:49319}, 'Invalid QA isolation');
    assert.ok(!config.plugins?.updater, 'QA must not configure an updater');
    assert.equal(config.bundle.createUpdaterArtifacts, false);
    assert.equal(config.bundle.active, false, 'QA is a portable test, not an installer');
    return {schemaVersion:1, profile, channel:'qa', identifier:config.identifier, port:49319, version:config.version};
  }
  assert.ok(!config.plugins?.['tafelraum-qa'], 'QA metadata requires QA identity');
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
  const patches = [];
  if (process.platform === 'win32') patches.push(await read('src-tauri/tauri.windows.conf.json'));
  if (override) patches.push(typeof override === 'string' ? JSON.parse(override) : override);
  for (const patch of patches) {
    // Tauri passes its CLI --config override as JSON to the resource build.
    if (patch.version) config.version = patch.version;
    if (patch.identifier) config.identifier = patch.identifier;
    if (patch.productName) config.productName = patch.productName;
    if (patch.mainBinaryName) config.mainBinaryName = patch.mainBinaryName;
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

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {desktopReleaseIdentity, readDesktopRelease} from './desktop-release-config.mjs';
const root = new URL('../', import.meta.url);
const app = new URL('prototypes/surface-shell-a-b/', root);
const read = async name => JSON.parse(await readFile(new URL(name, app), 'utf8'));
const config = await read('src-tauri/tauri.windows-installer-qa.conf.json');
const catalog = await read('distribution/desktop-channels.json');
test('local update QA is restricted to its disposable loopback lane', async () => {
  const config = await read('src-tauri/tauri.windows-update-qa.conf.json');
  assert.equal((await readDesktopRelease(fileURLToPath(root), config)).channel, 'qa-update');
  for (const mutate of [
    c => c.plugins.updater.endpoints = ['https://example.com/latest.json'],
    c => c.plugins.updater.pubkey = catalog.public.publicKey,
    c => c.plugins.updater.pubkey = catalog.personal.publicKey,
    c => c.plugins.updater.dangerousInsecureTransportProtocol = false,
    c => c.plugins['tafelraum-qa'].port = 49320,
    c => c.bundle.createUpdaterArtifacts = false,
    c => c.bundle.windows.nsis.installMode = 'perMachine',
    c => c.bundle.windows.nsis.installerHooks = null,
  ]) {
    const bad = structuredClone(config); mutate(bad);
    assert.throws(() => desktopReleaseIdentity('public', bad, catalog));
  }
});
test('installer QA remains isolated from portable QA and official delivery', async () => {
  const release = await readDesktopRelease(fileURLToPath(root), config);
  assert.equal(release.channel, 'qa-installer');
  assert.equal(release.port, 49320);
  assert.deepEqual(config.app.security.capabilities[0].remote.urls, ['http://127.0.0.1:49320/*']);
  assert.deepEqual(config.bundle.resources, {'../installer-qa-resources/':'desktop-resources/',
    '../windows-resources/':null,'../desktop-resources/':null});
  for (const mutate of [
    c => c.identifier = catalog.public.identifier,
    c => c.plugins.updater = {},
    c => c.plugins['tafelraum-qa'].port = 49319,
    c => c.bundle.active = false,
    c => c.bundle.createUpdaterArtifacts = true,
    c => c.bundle.targets = ['msi'],
    c => c.bundle.windows.nsis.installMode = 'perMachine',
    c => c.bundle.windows.nsis.installerHooks = null,
    c => c.mainBinaryName = 'tafelraum',
  ]) {
    const invalid = structuredClone(config);
    mutate(invalid);
    assert.throws(() => desktopReleaseIdentity('public', invalid, catalog));
  }
  assert.throws(() => desktopReleaseIdentity('personal', config, catalog));
  const hooks = await readFile(new URL('src-tauri/windows/installer-qa-hooks.nsh', app), 'utf8');
  assert(hooks.includes('!macroundef CheckIfAppIsRunning'));
  assert(hooks.includes('FindProcessCurrentUser'));
  assert(hooks.includes('StrCpy $DeleteAppDataCheckboxState 0'));
  assert(!hooks.includes('KillProcess'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, access, symlink, rm, realpath } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pruneBuildArtifacts } from './prune-build-artifacts.mjs';
import { snapshotBuildSource } from './snapshot-build-source.mjs';
import { execFileSync } from 'node:child_process';

async function fixture(t) {
  const repository = await realpath(await mkdtemp(path.join(os.tmpdir(), 'tafelraum-build-storage-')));
  t.after(() => rm(repository, { recursive: true, force: true }));
  const file = async (relative, content = 'keep') => {
    const target = path.join(repository, relative);
    await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, content); return target;
  };
  const appBackups = path.join(repository, 'app-backups'), installedApp = path.join(repository, 'installed.app');
  const apps = new Map([[installedApp, { id: 'app.jujies.tafelraum', version: '0.1.10' }]]);
  const app = async (name, version, id = 'app.jujies.tafelraum') => {
    const directory = path.join(appBackups, name);
    await file(path.relative(repository, path.join(directory, 'Contents/Info.plist')));
    apps.set(directory, { id, version }); return directory;
  };
  const release = async version => {
    await file(`prototypes/surface-shell-a-b/release-output/tafelraum/${version}/latest.json`, JSON.stringify({ version }));
    return file(`prototypes/surface-shell-a-b/release-output/tafelraum/${version}/Tafelraum.app.tar.gz`);
  };
  const options = { repository, appBackups, installedApp, inspect: async directory => {
    if (!apps.has(directory)) throw Error('unbekannt'); return apps.get(directory);
  }, validate: async () => {}, getActivePaths: async () => [] };
  return { repository, file, app, release, options };
}
const exists = async file => access(file).then(() => true, () => false);

test('preview/apply keeps two distinct rollback versions, installed/public releases and all archive/source evidence', async t => {
  const f = await fixture(t);
  const old = await f.app('Tafelraum-0.1.7-before.app', '0.1.7');
  const duplicate = await f.app('Tafelraum-0.1.9-z-duplicate.app', '0.1.9');
  const newest = await f.app('Tafelraum-0.1.9-a-current.app', '0.1.9');
  const second = await f.app('Tafelraum-0.1.8-before.app', '0.1.8');
  await f.app('Tafelraum-0.1.6-foreign.app', '0.1.6', 'other.app');
  for (const version of ['0.1.7', '0.1.8', '0.1.9', '0.1.10', '0.1.11', '0.1.12']) await f.release(version);
  await f.file('output/release-0.1.8/public-latest.json', '{"version":"0.1.8"}');
  await f.file('output/old/source/prototypes/surface-shell-a-b/src-tauri/Cargo.toml');
  const target = await f.file('output/old/source/prototypes/surface-shell-a-b/src-tauri/target/debug/cache');
  const evidence = await f.file('output/old/source/prototypes/surface-shell-a-b/src/main.ts');
  const archive = await f.file('data/unterrichtsarchiv/target/precious');
  const backup = await f.file('output/student-notes-install-backup/unterrichtsarchiv/target/precious');
  const outside = await f.file('outside/target/precious');
  await symlink(path.dirname(outside), path.join(f.repository, 'output/linked-target'));
  const preview = await pruneBuildArtifacts(f.options);
  assert.equal(preview.applied, false); assert.equal(await exists(old), true);
  const result = await pruneBuildArtifacts({ ...f.options, apply: true });
  assert.equal(result.removed.some(item => item.path === old), true);
  assert.equal(await exists(old), false);
  assert.equal(await exists(newest) || await exists(duplicate), true);
  assert.equal(await exists(newest) && await exists(duplicate), false);
  assert.equal(await exists(second), true); assert.equal(await exists(target), false);
  for (const file of [evidence, archive, backup, outside]) assert.equal(await exists(file), true);
  for (const version of ['0.1.8', '0.1.10', '0.1.11', '0.1.12']) {
    assert.equal(await exists(path.join(f.repository, `prototypes/surface-shell-a-b/release-output/tafelraum/${version}`)), true);
  }
  assert.equal((await pruneBuildArtifacts({ ...f.options, apply: true })).removed.length, 0);
});

test('active cwd/command, explicit pins and newly started work are protected; process inspection errors stop deletion', async t => {
  const f = await fixture(t);
  const roots = ['active', 'command', 'pinned', 'late'];
  for (const root of roots) {
    await f.file(`output/${root}/src-tauri/Cargo.toml`);
    await f.file(`output/${root}/src-tauri/target/cache`);
  }
  const active = path.join(f.repository, 'output/active'), command = path.join(f.repository, 'output/command');
  const pinned = path.join(f.repository, 'output/pinned'), late = path.join(f.repository, 'output/late');
  let calls = 0;
  const result = await pruneBuildArtifacts({ ...f.options, apply: true, protect: [pinned], getActivePaths: async () => {
    calls++; return [active, `node ${command}/build.mjs`, ...(calls > 1 ? [late] : [])];
  } });
  assert.equal(result.removed.length, 0);
  for (const root of roots) assert.equal(await exists(path.join(f.repository, `output/${root}/src-tauri/target/cache`)), true);
  await assert.rejects(pruneBuildArtifacts({ ...f.options, apply: true, getActivePaths: async () => { throw Error('lsof failed'); } }), /lsof failed/);
  assert.equal(await exists(path.join(f.repository, 'output/.build-storage/lock')), false);
});

test('standalone test apps are bounded across different QA folders and identifiers', async t => {
  const f = await fixture(t);
  const apps = [];
  for (const version of ['0.1.1', '0.1.2', '0.1.3', '0.1.4']) {
    const directory = path.join(f.repository, `output/test-${version}/Tafelraum Test.app`);
    await f.file(path.relative(f.repository, path.join(directory, 'Contents/Info.plist')));
    apps.push(directory);
  }
  const metadata = new Map(apps.map((directory, index) => [directory, { id: `app.jujies.tafelraum.qa-${index}`, version: `0.1.${index + 1}` }]));
  const inspect = async directory => metadata.get(directory) ?? f.options.inspect(directory);
  await pruneBuildArtifacts({ ...f.options, inspect, apply: true, protect: [apps[0]] });
  assert.equal(await exists(apps[0]), true);
  assert.equal(await exists(apps[1]), false);
  assert.equal(await exists(apps[2]), true);
  assert.equal(await exists(apps[3]), true);
});

test('invalid surviving app aborts before deletion; unknown releases and symlink ancestors stay intact', async t => {
  const f = await fixture(t);
  const old = await f.app('Tafelraum-0.1.1-before.app', '0.1.1');
  await f.app('Tafelraum-0.1.2-before.app', '0.1.2'); await f.app('Tafelraum-0.1.3-before.app', '0.1.3');
  await assert.rejects(pruneBuildArtifacts({ ...f.options, apply: true, validate: async () => { throw Error('bad signature'); } }), /bad signature/);
  assert.equal(await exists(old), true);
  await f.release('0.1.1'); await f.release('0.1.2'); await f.release('0.1.3');
  await f.file('prototypes/surface-shell-a-b/release-output/tafelraum/0.1.1/unknown.txt');
  const preview = await pruneBuildArtifacts(f.options);
  assert.equal(preview.removed.some(item => item.reason.includes('Distributionspaket')), false);
});

test('snapshot uses current tracked/untracked source, omits ignored generated data, and refuses overwrite/symlink destinations', async t => {
  const f = await fixture(t);
  execFileSync('git', ['init', '-q', f.repository]);
  await f.file('.gitignore', 'output/\ndata/\nnode_modules/\ntarget/\nlocal-data/\ntest-materials/\n');
  await f.file('tracked.mjs', 'before');
  execFileSync('git', ['add', '.gitignore', 'tracked.mjs'], { cwd: f.repository });
  await f.file('tracked.mjs', 'current'); await f.file('new.mjs', 'untracked');
  const demo = 'prototypes/surface-shell-a-b/src/assets/demo/transport-set.png';
  await f.file(demo, 'versioned demo');
  await f.file('test-materials/means-of-transport/assets/transport_set.png', 'private old corpus');
  await f.file('test-materials/live-canvas-html/index.html', 'optional local fixture');
  await f.file('data/unterrichtsarchiv/archive.json');
  await f.file('prototypes/surface-shell-a-b/src-tauri/target/huge');
  await f.file('prototypes/surface-shell-a-b/node_modules/dependency');
  const destination = path.join(f.repository, 'output/build/source');
  await snapshotBuildSource(f.repository, destination);
  assert.equal(await readFile(path.join(destination, 'tracked.mjs'), 'utf8'), 'current');
  assert.equal(await readFile(path.join(destination, 'new.mjs'), 'utf8'), 'untracked');
  assert.equal(await readFile(path.join(destination, demo), 'utf8'), 'versioned demo');
  assert.equal(await exists(path.join(destination, 'test-materials/means-of-transport/assets/transport_set.png')), false);
  assert.equal(await exists(path.join(destination, 'test-materials/live-canvas-html/index.html')), true);
  assert.equal(await exists(path.join(destination, 'data')), false);
  assert.equal(await exists(path.join(destination, 'prototypes/surface-shell-a-b/src-tauri/target')), false);
  assert.equal(await exists(path.join(destination, 'prototypes/surface-shell-a-b/node_modules/dependency')), true);
  const checkout = path.join(f.repository, 'output/build/checkout');
  await snapshotBuildSource(f.repository, checkout, { includeLocalFixtures: false });
  assert.equal(await readFile(path.join(checkout, demo), 'utf8'), 'versioned demo');
  assert.equal(await exists(path.join(checkout, 'test-materials')), false);
  await assert.rejects(snapshotBuildSource(f.repository, destination), { code: 'EEXIST' });
  await symlink(path.join(f.repository, 'outside'), path.join(f.repository, 'output/link'));
  await mkdir(path.join(f.repository, 'outside'));
  await assert.rejects(snapshotBuildSource(f.repository, path.join(f.repository, 'output/link/source')), /verlinkten/);
});

import { execFile } from 'node:child_process';
import { lstat, mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const versionPattern = /^\d+\.\d+\.\d+$/;
const appId = 'app.jujies.tafelraum';
const within = (root, file) => file === root || file.startsWith(root + path.sep);
const versionOrder = (a, b) => {
  const left = a.split('.').map(Number), right = b.split('.').map(Number);
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
};
async function info(file) {
  try { return await lstat(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
async function entries(directory) {
  try { return await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; return []; }
}

// Frozen sources live below output/. Always operate on their containing Git repo.
export async function findRepository(start) {
  for (let directory = path.resolve(start); ; directory = path.dirname(directory)) {
    if (await info(path.join(directory, '.git'))) return directory;
    if (directory === path.dirname(directory)) throw new Error('Kein Repository gefunden.');
  }
}

async function inspectApp(directory) {
  const { stdout } = await run('/usr/bin/plutil', ['-convert', 'json', '-o', '-', path.join(directory, 'Contents/Info.plist')]);
  const plist = JSON.parse(stdout);
  if (!versionPattern.test(plist.CFBundleShortVersionString)) throw new Error(`Ungültige Appversion: ${directory}`);
  return { id: plist.CFBundleIdentifier, version: plist.CFBundleShortVersionString };
}
async function validateApp(directory) {
  await run('/usr/bin/codesign', ['--verify', '--deep', '--strict', directory], { maxBuffer: 1024 * 1024 });
}

export async function activePaths() {
  // cwd catches cargo/npm launched through relative paths; txt catches open apps.
  // Failure aborts cleanup instead of treating an unknown process state as idle.
  const { stdout } = await run('/usr/sbin/lsof', ['-n', '-d', 'cwd,txt', '-F', 'n'], { maxBuffer: 32 * 1024 * 1024 });
  const commands = await run('/bin/ps', ['-axo', 'command='], { maxBuffer: 8 * 1024 * 1024 });
  return [...stdout.split('\n').filter(line => line.startsWith('n/')).map(line => line.slice(1)), ...commands.stdout.split('\n')];
}

const skipNames = new Set(['.git', 'node_modules', 'local-data', 'data', 'material', 'archive', 'test-archive', 'test-materials', 'unterrichtsarchiv', 'unterrichtsarchiv-backups']);
const releaseFiles = version => new Set([`Tafelraum-${version}.zip`, 'Tafelraum.app.tar.gz', 'Tafelraum.app.tar.gz.sig', 'latest.json', 'SHA256SUMS.txt']);

export async function pruneBuildArtifacts({ repository, appBackups, installedApp, apply = false, protect = [],
  getActivePaths = activePaths, inspect = inspectApp, validate = validateApp } = {}) {
  repository = await realpath(repository);
  const output = path.join(repository, 'output');
  appBackups ??= path.join(os.homedir(), 'Library/Application Support/Tafelraum Release/app-backups');
  if (!installedApp) {
    for (const candidate of [path.join(os.homedir(), 'Desktop/Tafelraum.app'), path.join(os.homedir(), 'Applications/Tafelraum.app'), '/Applications/Tafelraum.app']) {
      if ((await info(path.join(candidate, 'Contents/Info.plist')))?.isFile()) { installedApp = candidate; break; }
    }
    // A fresh development checkout must still be able to build its first app.
    if (!installedApp) return { applied: false, kept: [], removed: [], skipped: [{ path: repository, reason: 'keine installierte App; Bereinigung ausgelassen' }] };
  }
  const stateDirectory = path.join(output, '.build-storage');
  await mkdir(stateDirectory, { recursive: true });
  const lock = path.join(stateDirectory, 'lock');
  await mkdir(lock);
  try {
    const installed = await inspect(installedApp);
    if (installed.id !== appId) throw new Error('Installierte App hat eine unbekannte Kennung.');
    const running = await getActivePaths();
    const protectedPaths = protect.map(value => path.resolve(value));
    // Windows command lines may use either slash spelling (and any case).
    const commandPath = value => process.platform === 'win32' ? value.replaceAll('\\', '/').toLowerCase() : value;
    const isBusy = (root, paths = running) => paths.some(file => commandPath(file) === commandPath(root) || commandPath(file).includes(commandPath(root) + '/'))
      || protectedPaths.some(file => within(root, file) || within(file, root));
    const candidates = [], kept = [], skipped = [], apps = [], releaseGroups = [];
    const published = new Set();
    // Receipts are evidence of publication, not the version of a local build.
    for (const entry of await entries(output)) {
      if (!entry.isDirectory() || !/^release-\d+\.\d+\.\d+$/.test(entry.name)) continue;
      const receipt = path.join(output, entry.name, 'public-latest.json');
      if (!(await info(receipt))?.isFile()) continue;
      const manifest = JSON.parse(await readFile(receipt, 'utf8'));
      if (versionPattern.test(manifest.version)) published.add(manifest.version);
    }
    const latestPublished = [...published].sort(versionOrder).at(-1);
    const add = async (file, reason, guard = file) => {
      const stat = await info(file);
      if (!stat?.isDirectory() || stat.isSymbolicLink()) return;
      if (isBusy(guard)) { skipped.push({ path: file, reason: 'laufend/geschützt' }); return; }
      candidates.push({ path: file, reason, guard, device: stat.dev, inode: stat.ino, modified: stat.mtimeMs });
    };
    const collectApp = async (directory, backup = false) => {
      try {
        const metadata = await inspect(directory);
        if (backup ? metadata.id !== appId : !/^app\.jujies\.tafelraum(?:\.|$)/.test(metadata.id)) return;
        apps.push({ path: directory, backup, ...metadata, modified: (await lstat(directory)).mtimeMs });
      } catch (error) { skipped.push({ path: directory, reason: `App nicht erkannt: ${error.message}` }); }
    };
    for (const entry of await entries(appBackups)) {
      if (entry.isDirectory() && /^Tafelraum-\d+\.\d+\.\d+.*\.app$/.test(entry.name)) {
        await collectApp(path.join(appBackups, entry.name), true);
      }
    }
    async function walk(directory, depth = 0) {
      if (depth > 10) return;
      for (const entry of await entries(directory)) {
        if (!entry.isDirectory() || entry.isSymbolicLink() || skipNames.has(entry.name) || entry.name.startsWith('.')) continue;
        const file = path.join(directory, entry.name);
        if (entry.name.endsWith('.app')) { await collectApp(file); continue; }
        if (entry.name === 'target' && path.basename(directory) === 'src-tauri' && (await info(path.join(directory, 'Cargo.toml')))?.isFile()) {
          await add(file, 'erzeugter nativer Test-/Snapshot-Build', path.dirname(directory)); continue;
        }
        if (entry.name === 'desktop-resources' && (await info(path.join(directory, 'src-tauri/Cargo.toml')))?.isFile()) {
          await add(file, 'erzeugte Snapshot-Ressourcen', directory); continue;
        }
        if (entry.name === 'release-output') { releaseGroups.push(path.join(file, 'tafelraum')); continue; }
        await walk(file, depth + 1);
      }
    }
    await walk(output);
    releaseGroups.push(path.join(repository, 'prototypes/surface-shell-a-b/release-output/tafelraum'));
    const appGroups = new Map();
    for (const app of apps) {
      // QA output folders/IDs change per experiment. A per-folder quota would
      // still accumulate one full app for every historical experiment.
      const key = app.backup ? 'rollback-apps' : 'standalone-test-apps';
      if (!appGroups.has(key)) appGroups.set(key, []);
      appGroups.get(key).push(app);
    }
    const validators = new Set();
    for (const group of appGroups.values()) {
      group.sort((a, b) => versionOrder(b.version, a.version) || b.modified - a.modified || a.path.localeCompare(b.path));
      // Keep two distinct rollback versions; duplicate copies consume no slot.
      const versions = [...new Set(group.map(app => app.version))].slice(0, 2);
      const survivors = new Set();
      for (const version of versions) survivors.add(group.find(app => app.version === version).path);
      const hasOldCopies = group.some(app => !survivors.has(app.path));
      for (const app of group) {
        if (survivors.has(app.path)) { kept.push(app.path); if (hasOldCopies) validators.add(app.path); }
        else await add(app.path, app.backup ? 'alte App-Rückfallkopie' : 'alte native Test-App');
      }
    }
    const releases = new Map();
    for (const directory of releaseGroups) {
      releases.set(directory, (await entries(directory)).filter(entry => entry.isDirectory() && versionPattern.test(entry.name)).map(entry => entry.name));
    }
    const newestVersions = [...new Set([...releases.values()].flat())].sort(versionOrder).reverse().slice(0, 2);
    const retained = new Set([...newestVersions, installed.version, latestPublished]);
    for (const [directory, versions] of releases) {
      // No publication evidence means the public rollback package is unknown.
      if (!latestPublished) { skipped.push({ path: directory, reason: 'kein Publikationsbeleg' }); continue; }
      for (const version of versions) {
        const file = path.join(directory, version);
        if (retained.has(version)) { kept.push(file); continue; }
        const children = await entries(file);
        if (!children.length || children.some(entry => !entry.isFile() || !releaseFiles(version).has(entry.name))) {
          skipped.push({ path: file, reason: 'unbekannter Releaseinhalt' }); continue;
        }
        const manifest = JSON.parse(await readFile(path.join(file, 'latest.json'), 'utf8'));
        if (manifest.version !== version) throw new Error(`Releaseversion widerspricht dem Ordner: ${file}`);
        await add(file, 'altes lokales Distributionspaket', directory.slice(0, -'/release-output/tafelraum'.length));
      }
    }
    // A parent candidate already covers its children; never follow symlinks.
    const removed = candidates.filter(candidate => !candidates.some(parent => parent !== candidate && within(parent.path, candidate.path)));
    if (apply && removed.length) {
      await validate(installedApp);
      for (const file of validators) await validate(file);
      for (const candidate of removed) {
        const current = await lstat(candidate.path);
        if (current.isSymbolicLink() || current.dev !== candidate.device || current.ino !== candidate.inode || current.mtimeMs !== candidate.modified
          || await realpath(candidate.path) !== candidate.path) throw new Error(`Bereinigungsziel wurde verändert: ${candidate.path}`);
        if (isBusy(candidate.guard, await getActivePaths())) {
          candidate.skipped = true; skipped.push({ path: candidate.path, reason: 'inzwischen gestartet' }); continue;
        }
        await rm(candidate.path, { recursive: true });
      }
    }
    const report = { applied: apply, installedVersion: installed.version, latestPublished, kept, skipped,
      removed: removed.filter(candidate => !candidate.skipped).map(({ path, reason }) => ({ path, reason })) };
    if (apply) await writeFile(path.join(stateDirectory, `cleanup-${new Date().toISOString().replaceAll(':', '-')}.json`), JSON.stringify(report, null, 2) + '\n');
    return report;
  } finally { await rm(lock, { recursive: true }); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/prune-build-artifacts.mjs [--apply] [--protect PFAD] (sonst Vorschau; zwei App-/Releaseversionen, publizierten/installierten Stand schützen)');
  } else {
    const protect = [];
    for (let index = 0; index < args.length; index++) {
      if (args[index] === '--apply') continue;
      if (args[index] !== '--protect' || !args[index + 1] || args[index + 1].startsWith('--')) throw new Error('Unbekanntes Argument oder fehlender Schutzpfad.');
      protect.push(args[++index]);
    }
    const repository = await findRepository(path.dirname(fileURLToPath(import.meta.url)));
    console.log(JSON.stringify(await pruneBuildArtifacts({ repository, apply: args.includes('--apply'), protect }), null, 2));
  }
}

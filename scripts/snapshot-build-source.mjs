import { execFile } from 'node:child_process';
import { copyFile, lstat, mkdir, realpath, symlink, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { findRepository } from './prune-build-artifacts.mjs';

const run = promisify(execFile);

// Copy the actual working source, including untracked non-ignored source files.
// Git's ignore contract excludes archives, output, targets and bundled runtimes.
export async function snapshotBuildSource(repository, destination, { includeLocalFixtures = true } = {}) {
  repository = await realpath(repository);
  destination = path.resolve(destination);
  const output = path.join(repository, 'output');
  if (!destination.startsWith(output + path.sep) || destination === output) throw new Error('Buildquelle muss unter output/ liegen.');
  for (let ancestor = path.dirname(destination); ancestor !== repository; ancestor = path.dirname(ancestor)) {
    try {
      if (await realpath(ancestor) !== ancestor) throw new Error('Keine verlinkten Ausgabeordner.');
      break;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await mkdir(path.dirname(destination), { recursive: true });
  if (await realpath(path.dirname(destination)) !== path.dirname(destination)) throw new Error('Keine verlinkten Ausgabeordner.');
  await mkdir(destination); // Never overwrite an existing frozen source.
  const { stdout } = await run('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: repository, maxBuffer: 16 * 1024 * 1024 });
  let files = 0;
  async function copySource(relative) {
    const source = path.join(repository, relative), target = path.join(destination, relative);
    let stat;
    try { stat = await lstat(source); } catch (error) { if (error.code === 'ENOENT') return; throw error; }
    if (!stat.isFile() || await realpath(source) !== source) throw new Error(`Buildquelle enthält keinen regulären Quellpfad: ${relative}`);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
    files++;
  }
  for (const relative of new Set(stdout.split('\0').filter(Boolean))) {
    const parts = relative.split('/');
    if (['output', 'data', 'local-data'].includes(parts[0]) || parts.some(part => ['.git', 'node_modules', 'target', 'desktop-resources', 'release-output', 'dist', 'dist-live'].includes(part))) continue;
    await copySource(relative);
  }
  // Optional local browser-QA packages; never a build dependency.
  async function copyFixture(relative) {
    let children;
    try { children = await readdir(path.join(repository, relative), { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of children) {
      const child = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await copyFixture(child); else await copySource(child);
    }
  }
  if (includeLocalFixtures) await copyFixture('test-materials/live-canvas-html');
  // Reuse dependencies and only the pinned office build cache, never copy them.
  for (const relative of ['prototypes/surface-shell-a-b/node_modules', 'services/live-canvas/node_modules', 'local-data/office-runtime']) {
    const source = path.join(repository, relative);
    try { await lstat(source); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    const target = path.join(destination, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await symlink(source, target, 'dir');
  }
  return { destination, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error('node scripts/snapshot-build-source.mjs output/<auftrag>/source');
  const repository = await findRepository(path.dirname(fileURLToPath(import.meta.url)));
  console.log(JSON.stringify(await snapshotBuildSource(repository, process.argv[2]), null, 2));
}

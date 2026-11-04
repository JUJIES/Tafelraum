// Both desktop packagers stage the same web build, local server and agent kit.
import {copyFile, cp, mkdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeDesktopRelease} from './desktop-release-config.mjs';
import {prepareAgentKit} from './prepare-agent-kit.mjs';

const repository = fileURLToPath(new URL('../', import.meta.url));
const app = path.join(repository, 'prototypes/surface-shell-a-b');
if (process.argv.length !== 3) throw new Error('Expected a fresh resource directory');
const resources = path.resolve(process.argv[2]);
await mkdir(resources); // Refuse to merge a partial or previous package.
const server = path.join(resources, 'server');
await mkdir(server);
await mkdir(path.join(resources, 'runtime'));
await writeDesktopRelease(repository, path.join(server, 'desktop-release.json'));
await prepareAgentKit(repository, path.join(resources, 'agent-kit'));
await cp(path.join(app, 'dist'), path.join(resources, 'web'), {recursive:true});

const files = [
  'distribution.json', 'desktop-server.mjs', 'agent-kit-server.mjs',
  'canvas-agent-server.mjs', 'canvas-agent-protocol.mjs', 'teaching-agent-protocol.mjs',
  'live-canvas-provisioning.mjs', 'archive-server.mjs', 'student-notes-server.mjs',
  'student-notes-store.mjs', 'office-import.mjs', 'material-removal.mjs',
  'interactive-html-state-bridge.mjs', 'interactive-html-playback.mjs',
  'interactive-material.mjs', 'interactive-html-sentence-check.mjs',
  'sentence-check-contract.mjs', 'ai-settings-extension.mjs',
  'mobile-capture-receiver.mjs', 'document-image-server.mjs', 'office-import/runtime.json',
  'document-image/worker.py', 'document-image/mbd.py',
  'document-image/perspective.py', 'document-image/LICENSE.DocRes',
];
const distribution = JSON.parse(await readFile(path.join(app, 'distribution.json'), 'utf8'));
if (distribution.profile === 'personal') {
  files.push('sentence-assessment-core.mjs', 'sentence-check-tasks.mjs',
    'personal-ai-key.mjs', 'personal-ai-settings.mjs');
}
for (const relative of files) {
  const destination = path.join(server, relative);
  await mkdir(path.dirname(destination), {recursive:true});
  await copyFile(path.join(app, relative), destination);
}
await copyFile(path.join(repository, 'shared/mobile-capture/protocol.mjs'),
  path.join(server, 'mobile-capture-protocol.mjs'));

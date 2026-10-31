// Start a public checkout with its own lesson archive on loopback.
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initializeEmptyArchive } from './desktop-server.mjs';
import { createServer } from 'vite';

export async function startLocal(port = 5173) {
  const app = fileURLToPath(new URL('.', import.meta.url));
  const archive = resolve(app, '../../local-data/public-lessons');
  await initializeEmptyArchive(archive);
  process.env.TAFELRAUM_ARCHIVE_ROOT_URL = pathToFileURL(archive).href;
  process.chdir(app);
  const server = await createServer({ root: app, server: { host: '127.0.0.1', port } });
  await server.listen();
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const server = await startLocal();
  console.log('Lesson archive:', fileURLToPath(process.env.TAFELRAUM_ARCHIVE_ROOT_URL));
  server.printUrls();
}

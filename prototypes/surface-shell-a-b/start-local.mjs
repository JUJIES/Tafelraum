// Start a public checkout with its own lesson archive on loopback.
import { fileURLToPath } from 'node:url';
import { initializeEmptyArchive } from './desktop-server.mjs';
import { createServer } from 'vite';

const app = fileURLToPath(new URL('.', import.meta.url));
const archive = new URL('../../local-data/public-lessons/', import.meta.url);
await initializeEmptyArchive(fileURLToPath(archive));
process.env.TAFELRAUM_ARCHIVE_ROOT_URL = archive.href;
process.chdir(app);
const server = await createServer({ root: app, server: { host: '127.0.0.1', port: 5173 } });
await server.listen();
console.log('Lesson archive:', fileURLToPath(archive));
server.printUrls();

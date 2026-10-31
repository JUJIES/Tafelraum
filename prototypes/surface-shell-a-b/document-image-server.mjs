import { spawn } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const worker = fileURLToPath(new URL('./document-image/worker.py', import.meta.url));
const LIMIT = 24_000_000;
function json(response, status, data) {
  if (response.destroyed || response.writableEnded) return;
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(JSON.stringify(data));
}

export function createDocumentImageProcessor({ configPath }) {
  let child = null;
  let reserved = false;
  let closed = false;
  const stop = () => {
    if (!child) return;
    const running = child;
    running.kill('SIGTERM');
    const timer = setTimeout(() => { if (child === running) running.kill('SIGKILL'); }, 1500);
    timer.unref();
    running.once('close', () => clearTimeout(timer));
  };
  const config = async () => {
    try {
      const value = JSON.parse(await readFile(configPath, 'utf8'));
      for (const name of ['python', 'repo', 'weights', 'mbdWeights']) {
        if (typeof value[name] !== 'string' || !path.isAbsolute(value[name])) return null;
        await access(value[name]);
      }
      return value;
    } catch { return null; }
  };
  return {
    close() { closed = true; stop(); },
    async middleware(request, response, next) {
      const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
      if (!pathname.startsWith('/api/document-image/')) return next();
      const host = request.headers.host ?? '';
      const origin = request.headers.origin;
      if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)
        || (origin && origin !== `http://${host}`)
        || ['cross-site', 'same-site'].includes(request.headers['sec-fetch-site'])) {
        json(response, 403, { error: 'Zugriff nicht erlaubt.' }); return;
      }
      if (pathname === '/api/document-image/status' && request.method === 'GET') {
        json(response, 200, { configured: Boolean(await config()) && !closed }); return;
      }
      const perspective = pathname === '/api/document-image/perspective';
      if ((!perspective && pathname !== '/api/document-image/process') || request.method !== 'POST') {
        json(response, 404, { error: 'Unbekannter Bildpfad.' }); return;
      }
      if (request.headers['x-tafelraum-document-image'] !== '1' || request.headers['content-type'] !== 'application/json') {
        json(response, 403, { error: 'Zugriff nicht erlaubt.' }); return;
      }
      if (reserved || closed) { json(response, 409, { error: 'Ein Bild wird bereits verarbeitet. Bitte kurz warten.' }); return; }
      reserved = true;
      let handedOff = false;
      try {
        const settings = await config();
        if (!settings) { json(response, 503, { error: 'Die lokale Bildverbesserung ist nicht eingerichtet.' }); return; }
        const chunks = []; let bytes = 0;
        for await (const chunk of request) {
          bytes += chunk.length;
          if (bytes > (perspective ? 80_000_000 : LIMIT)) { json(response, 413, { error: 'Das Foto ist für diesen Verarbeitungsschritt zu groß. Bitte eine kleinere Aufnahme verwenden.' }); return; }
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks);
        const parsed = JSON.parse(body);
        if (typeof parsed.dataURL !== 'string') throw new Error('invalid input');
        if (perspective) parsed.operation = 'perspective';
        else if (parsed.operation !== undefined) throw new Error('invalid operation');
        if (response.destroyed || closed) return;
        child = spawn(settings.python, [worker, configPath], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
        handedOff = true;
        const running = child;
        const output = []; let size = 0; let failed = false;
        const timeout = setTimeout(() => { failed = true; stop(); json(response, 504, { error: 'Die Verarbeitung hat zu lange gedauert. Bitte erneut versuchen.' }); }, 120_000);
        timeout.unref();
        const cancel = () => { if (!response.writableEnded) stop(); };
        response.once('close', cancel);
        running.stdout.on('data', chunk => {
          size += chunk.length;
          if (size > (perspective ? 180_000_000 : 100_000_000)) { failed = true; stop(); }
          else output.push(chunk);
        });
        // Drain diagnostics, never expose local paths or retain image data in logs.
        running.stderr.resume();
        running.stdin.on('error', () => {});
        running.once('error', () => { failed = true; });
        running.once('close', code => {
          clearTimeout(timeout); response.off('close', cancel);
          child = null; reserved = false;
          if (failed || code !== 0) { json(response, 500, { error: perspective ? 'Der Ausschnitt konnte nicht entzerrt werden. Bitte die vier Ecken prüfen.' : 'DocRes konnte das Bild nicht verbessern. Bitte die lokale Einrichtung prüfen.' }); return; }
          try {
            const result = JSON.parse(Buffer.concat(output));
            if (!result.dataURL?.startsWith('data:image/png;base64,') || !Number.isInteger(result.width) || !Number.isInteger(result.height)) throw new Error('invalid output');
            if (perspective && !result.originalDataURL?.startsWith('data:image/png;base64,')) throw new Error('missing original rendition');
            json(response, 200, result);
          } catch { json(response, 500, { error: 'Das Ergebnis konnte nicht gelesen werden.' }); }
        });
        running.stdin.end(perspective ? JSON.stringify(parsed) : body);
      } catch { json(response, 400, { error: 'Die Bilddaten konnten nicht gelesen werden.' }); }
      finally { if (!handedOff) reserved = false; }
    },
  };
}

export function documentImagePlugin({ configPath }) {
  const install = server => {
    const processor = createDocumentImageProcessor({ configPath });
    server.middlewares.use((req, res, next) => void processor.middleware(req, res, next));
    server.httpServer?.once('close', () => processor.close());
  };
  return { name: 'tafelraum-document-image', configureServer: install, configurePreviewServer: install };
}

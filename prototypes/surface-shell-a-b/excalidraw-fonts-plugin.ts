import type { Plugin } from 'vite';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fontsRoot = fileURLToPath(new URL('./node_modules/@excalidraw/excalidraw/dist/prod/fonts/', import.meta.url));
async function fontFiles() {
  return (await readdir(fontsRoot, { recursive: true, withFileTypes: true }))
    .filter(entry => entry.isFile() && entry.name.endsWith('.woff2'))
    .map(entry => path.relative(fontsRoot, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'));
}

/** Same pinned files for teacher, Room and viewer; no required font CDN. */
export function localExcalidrawFonts(): Plugin {
  return {
    name: 'tafelraum-local-excalidraw-fonts',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [{ tag: 'script', injectTo: 'head-prepend', children: 'window.EXCALIDRAW_ASSET_PATH = new URL("/", window.location.href).href;' }],
    },
    async configureServer(server) {
      const files = new Set(await fontFiles());
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://local').pathname;
        if (!pathname.startsWith('/fonts/')) return next();
        let file: string;
        try { file = decodeURIComponent(pathname.slice('/fonts/'.length)); }
        catch { response.statusCode = 400; response.end(); return; }
        if (!files.has(file)) return next();
        if (request.method !== 'GET' && request.method !== 'HEAD') { response.statusCode = 405; response.end(); return; }
        void readFile(path.join(fontsRoot, file)).then(bytes => {
          response.setHeader('Content-Type', 'font/woff2');
          response.setHeader('Content-Length', bytes.length);
          response.setHeader('X-Content-Type-Options', 'nosniff');
          response.end(request.method === 'HEAD' ? undefined : bytes);
        }).catch(next);
      });
    },
    async generateBundle() {
      for (const file of await fontFiles()) this.emitFile({ type: 'asset', fileName: `fonts/${file}`, source: await readFile(path.join(fontsRoot, file)) });
    },
  };
}

// Start a public checkout with its own lesson archive on loopback.
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { initializeEmptyArchive, createDesktopServer } from './desktop-server.mjs';

const app = fileURLToPath(new URL('.', import.meta.url));
const archive = resolve(app, '../../local-data/public-lessons');

export async function startLocal(port = 5173) {
  // The source-use path shares the packaged app's server, APIs and archive.
  // npm start builds first; this function serves that prepared bundle.
  const httpServer = await createDesktopServer({archiveRoot:archive,webRoot:resolve(app,'dist'),port});
  const origin = `http://127.0.0.1:${httpServer.address().port}/`;
  return {
    httpServer,
    resolvedUrls:{local:[origin]},
    printUrls(){console.log('Local:',origin);},
    close(){return new Promise((resolve,reject)=>httpServer.close(error=>error?reject(error):resolve()));},
  };
}

export async function startDevelopmentLocal(port = 5173) {
  await initializeEmptyArchive(archive);
  process.env.TAFELRAUM_ARCHIVE_ROOT_URL = pathToFileURL(archive).href;
  process.chdir(app);
  const {createServer} = await import('vite');
  const server = await createServer({ root: app, server: { host: '127.0.0.1', port } });
  await server.listen();
  return server;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const args=process.argv.slice(2);
  if(args.some(arg=>arg!=='--dev'))throw new Error('Supported option: --dev');
  const server = await (args.includes('--dev')?startDevelopmentLocal():startLocal());
  console.log('Lesson archive:',archive);
  server.printUrls();
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{void server.close().then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});});
}

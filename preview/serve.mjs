// Serve only the compiled public preview and pre-rendered example responses.
// No archive middleware, uploads, directory listing, API credentials or visitor state.
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.argv[2] || 'output/public-preview');
const port=Number(process.argv[3] || 5987);
const dist=path.join(root,'dist'), files=new Map();
async function index(dir){
  for(const item of await readdir(dir,{withFileTypes:true})){
    if(item.name.startsWith('.'))continue;
    const file=path.join(dir,item.name);
    if(item.isDirectory())await index(file);
    else if(item.isFile())files.set('/'+path.relative(dist,file).split(path.sep).join('/'),file);
  }
}
await index(dist);
const routes=new Map(Object.entries(JSON.parse(await readFile(path.join(root,'routes.json'),'utf8'))));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.wasm':'application/wasm','.json':'application/json','.webmanifest':'application/manifest+json','.jpg':'image/jpeg','.txt':'text/plain'};
const pagePolicy="default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob:; frame-src 'self' blob: https://www.youtube-nocookie.com/embed/hyf5JF_VxwM; worker-src 'self' blob:; media-src 'self' blob: data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";
createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return}
  let url;try{url=decodeURIComponent(new URL(req.url,'http://preview.invalid').pathname)}catch{res.writeHead(400);res.end();return}
  const route=routes.get(url),file=files.get(url==='/'?'/index.html':url);
  if(!route&&!file){res.writeHead(404);res.end();return}
  const type=route?.type || types[path.extname(file)] || 'application/octet-stream';
  if(type.startsWith('text/html'))res.setHeader('Content-Security-Policy',route?"sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'":pagePolicy);
  res.writeHead(200,{'Content-Type':type});
  if(req.method==='HEAD'){res.end();return}
  if(route){res.end(route.body);return}
  createReadStream(file).on('error',()=>res.destroy()).pipe(res);
}).listen(port,'127.0.0.1',()=>console.log('Static preview listening on loopback port '+port));

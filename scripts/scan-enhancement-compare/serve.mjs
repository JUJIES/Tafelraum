// Static loopback comparison only. No archive access, upload or directory listing.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.resolve(process.argv[2] ?? '');
if (!root.startsWith(repository + '/output/')) throw new Error('Expected an existing comparison under output/.');
const report = JSON.parse(await readFile(path.join(root,'comparison.json'),'utf8'));
const ids = report.variants?.map(item=>item.id).join(',');
if (report.format !== 'tafelraum-scan-comparison-v1' || !['a,b,c','a,b,c,d'].includes(ids)) throw new Error('Invalid comparison.');
const allowed = new Map([['/','index.html'],['/index.html','index.html'],['/viewer.css','viewer.css'],['/viewer.js','viewer.js'],['/comparison.json','comparison.json'],['/images/original.png','images/original.png'],...report.variants.map(({id})=>[`/images/${id}.png`,`images/${id}.png`])]);
const server = createServer(async(request,response)=>{
  response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');
  response.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  response.setHeader('Referrer-Policy','no-referrer');
  const file=allowed.get(request.url);
  if (!['127.0.0.1','localhost'].includes((request.headers.host??'').split(':')[0]) || request.headers['sec-fetch-site']==='cross-site' || !['GET','HEAD'].includes(request.method) || !file) {response.writeHead(404);response.end();return;}
  try {
    const bytes=await readFile(path.join(root,file));
    const mime=file.endsWith('.png')?'image/png':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.json')?'application/json':'text/html';
    response.writeHead(200,{'Content-Type':mime+'; charset=utf-8','Content-Length':bytes.length});response.end(request.method==='HEAD'?undefined:bytes);
  } catch {response.writeHead(404);response.end();}
});
server.listen(0,'127.0.0.1',()=>console.log(`Comparison: http://127.0.0.1:${server.address().port}/`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));

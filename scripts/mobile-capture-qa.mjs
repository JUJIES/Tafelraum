#!/usr/bin/env node
// Neutral browser QA. Never opens or writes the productive archive.
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDesktopServer} from '../prototypes/surface-shell-a-b/desktop-server.mjs';
import {createCaptureRelay} from '../services/mobile-capture/server.mjs';
import {newSecret} from '../shared/mobile-capture/protocol.mjs';

const dataOption=process.argv.indexOf('--data-dir');
if(dataOption>=0&&!process.argv[dataOption+1])throw new Error('Missing isolated pilot directory.');
const persistent=dataOption>=0;
const root=persistent?path.resolve(process.argv[dataOption+1]):await mkdtemp(path.join(tmpdir(),'tafelraum-capture-qa-'));
if(persistent){
  // Persistent manual-test archives must stay under the ignored pilot root.
  const allowed=fileURLToPath(new URL('../local-data/mobile-capture-pilot/',import.meta.url));
  if(root!==path.resolve(allowed))throw new Error('Use local-data/mobile-capture-pilot as the isolated manual-test directory.');
  await mkdir(root,{recursive:true,mode:0o700});
}
const configOption=process.argv.indexOf('--capture-config');
let relay;
let captureConfigPath;
if(configOption>=0){
  if(!process.argv[configOption+1])throw new Error('Missing private config path.');
  captureConfigPath=path.resolve(process.argv[configOption+1]);
}else{
  const adminKey=newSecret();
  relay=createCaptureRelay({adminKey,publicUrl:'http://127.0.0.1:0'});await relay.listen(0);
  captureConfigPath=path.join(root,'capture.json');
  await writeFile(captureConfigPath,JSON.stringify({baseUrl:relay.publicUrl,adminKey}),{mode:0o600});
}
const portOption=process.argv.indexOf('--port');
const port=portOption<0?0:Number(process.argv[portOption+1]);
const desktop=await createDesktopServer({
  archiveRoot:path.join(root,'archive'),notesRoot:path.join(root,'notes'),
  webRoot:fileURLToPath(new URL('../prototypes/surface-shell-a-b/dist/',import.meta.url)),
  captureConfigPath,port,
});
const desktopUrl=`http://127.0.0.1:${desktop.address().port}`;
// Separate loopback-only handoff for a second desktop browser tab. Avoids
// printing the temporary QR capability/key in test logs. Never shipped.
const handoff=createServer(async(request,response)=>{
  if(request.url!=='/mobile'){response.writeHead(404);response.end();return;}
  try{
    const status=await(await fetch(`${desktopUrl}/api/mobile-capture/status`)).json();
    if(!status.session){response.writeHead(409);response.end('Start the neutral QA receiver first.');return;}
    response.writeHead(302,{Location:status.session.inviteUrl,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});response.end();
  }catch{response.writeHead(503);response.end('QA receiver unavailable.');}
});
await new Promise(resolve=>handoff.listen(0,'127.0.0.1',resolve));
process.stdout.write(`Neutral capture QA: ${desktopUrl}\n`);
process.stdout.write(`Second-browser handoff: http://127.0.0.1:${handoff.address().port}/mobile\n`);
process.stdout.write(relay?'Local relay: QR only works in a browser on this Mac.\n':'Configured HTTPS relay: ready for an actual phone test.\n');
if(persistent)process.stdout.write('Manual pilot: received files persist in local-data/mobile-capture-pilot/archive.\n');
const close=async()=>{
  await new Promise(resolve=>handoff.close(resolve));
  await new Promise(resolve=>desktop.close(resolve));
  if(relay)await relay.close();
  if(!persistent)await rm(root,{recursive:true,force:true});process.exit(0);
};
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());

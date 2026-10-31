#!/usr/bin/env node
// Build dependency only: the shipped converter never uses this checkout or PATH.
import {readFile,writeFile,mkdir,access,rename,rm,mkdtemp} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));
const spec=JSON.parse(await readFile(new URL('../prototypes/surface-shell-a-b/office-import/runtime.json',import.meta.url)));
const arch=process.argv[2]??process.arch;
if(process.platform!=='darwin'||!spec.mac[arch])throw Error('Supported build hosts: macOS arm64/x64.');
const entry=spec.mac[arch],cache=path.join(root,'local-data/office-runtime',spec.version,arch);
const app=path.join(cache,'LibreOffice.app');
try{await access(path.join(app,'Contents/MacOS/soffice'));
 const check=spawnSync('/usr/bin/codesign',['--verify','--deep','--strict',app],{encoding:'utf8'});
 if(check.status!==0)throw Error('Cached LibreOffice signature verification failed.');
 const machine=spawnSync('/usr/bin/lipo',[path.join(app,'Contents/MacOS/soffice'),'-verify_arch',arch==='arm64'?'arm64':'x86_64']);
 if(machine.status!==0)throw Error('Cached LibreOffice architecture mismatch.');
 console.log(app);process.exit(0);
}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(cache,{recursive:true});
function run(cmd,args){const result=spawnSync(cmd,args,{encoding:'utf8',maxBuffer:1024*1024});if(result.status!==0)throw Error(`${cmd} failed: ${result.stderr}`);return result.stdout;}
const image=path.join(cache,entry.file);
try{await access(image);}catch{run('/usr/bin/curl',['--fail','--location','--retry','2','--max-time','600','--output',image+'.download',`https://download.documentfoundation.org/libreoffice/stable/${spec.version}/mac/${entry.directory}/${entry.file}`]);await rename(image+'.download',image);}
const hash=createHash('sha256');for await(const chunk of createReadStream(image))hash.update(chunk);
if(hash.digest('hex')!==entry.sha256)throw Error('LibreOffice download checksum mismatch.');
const mount=await mkdtemp(path.join(os.tmpdir(),'tafelraum-office-mount-'));
try{
 run('/usr/bin/hdiutil',['attach','-readonly','-nobrowse','-mountpoint',mount,image]);
 run('/usr/bin/ditto',[path.join(mount,'LibreOffice.app'),app+'.staging']);
 run('/usr/bin/codesign',['--verify','--deep','--strict',app+'.staging']);
 await rename(app+'.staging',app);
 await writeFile(path.join(cache,'provenance.json'),JSON.stringify({version:spec.version,sha256:entry.sha256,source:spec.source,download:`https://download.documentfoundation.org/libreoffice/stable/${spec.version}/mac/${entry.directory}/${entry.file}`},null,2));
}finally{run('/usr/bin/hdiutil',['detach',mount]);await rm(mount,{recursive:true,force:true});}
console.log(app);

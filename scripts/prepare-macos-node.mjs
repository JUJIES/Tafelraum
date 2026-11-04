// Build dependency only; never select a packaged runtime from the developer's PATH.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rename,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const digest=data=>createHash('sha256').update(data).digest('hex');
export function assertMacRuntimeCompatibility(runtimeMinimum,appMinimum){
  const parts=value=>{assert.match(value,/^\d+\.\d+(?:\.\d+)?$/);return value.split('.').map(Number);};
  const runtime=parts(runtimeMinimum),app=parts(appMinimum);
  for(let i=0;i<3;i++){
    if((runtime[i]??0)<(app[i]??0))return;
    assert.ok((runtime[i]??0)<=(app[i]??0),'Bundled Node requires a newer macOS than the app declares');
  }
}
export async function prepareMacNode(cacheRoot=path.join(root,'local-data/node-runtime')){
  assert.equal(process.platform,'darwin');assert.equal(process.arch,'arm64','Public Mac target is Apple Silicon');
  const spec=JSON.parse(await readFile(new URL('./desktop-node-runtime.json',import.meta.url),'utf8'));
  assert.equal(spec.schemaVersion,1);
  const target=spec.platforms['darwin-arm64'];
  const cache=path.join(cacheRoot,target.version,'darwin-arm64');await mkdir(cache,{recursive:true});
  const installed=path.join(cache,'distribution'),archive=path.join(cache,target.filename);
  const verify=async folder=>{
    const binary=path.join(folder,target.binary);
    assert.equal(digest(await readFile(binary)),target.nodeSha256,'Cached Mac Node binary changed');
    assert.equal(digest(await readFile(path.join(folder,'LICENSE'))),target.licenseSha256,'Cached Node licence changed');
    assert.equal(execFileSync(binary,['--version'],{encoding:'utf8'}).trim(),target.version);
    const build=execFileSync('/usr/bin/xcrun',['vtool','-show-build',binary],{encoding:'utf8'});
    const minimum=build.match(/\bminos\s+(\d+\.\d+(?:\.\d+)?)/)?.[1];
    const config=JSON.parse(await readFile(path.join(root,'prototypes/surface-shell-a-b/src-tauri/tauri.conf.json'),'utf8'));
    assertMacRuntimeCompatibility(minimum,config.bundle.macOS.minimumSystemVersion);
    return binary;
  };
  try{return await verify(installed);}catch(error){if(error.code!=='ENOENT')throw error;}
  try{await readFile(archive);}catch(error){
    if(error.code!=='ENOENT')throw error;
    const response=await fetch(`https://nodejs.org/dist/${target.version}/${target.filename}`);
    assert.ok(response.ok,'Official Node download unavailable');
    const bytes=Buffer.from(await response.arrayBuffer());
    assert.equal(digest(bytes),target.sha256,'Official Node archive checksum mismatch');
    await writeFile(archive,bytes,{flag:'wx'});
  }
  assert.equal(digest(await readFile(archive)),target.sha256,'Cached Node archive changed');
  const temporary=await mkdtemp(path.join(cache,'.extract-'));
  try{
    execFileSync('/usr/bin/tar',['-xzf',archive,'-C',temporary]);
    const extracted=path.join(temporary,target.directory);await verify(extracted);
    await rename(extracted,installed);
  }finally{await rm(temporary,{recursive:true,force:true});}
  return verify(installed);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(await prepareMacNode());

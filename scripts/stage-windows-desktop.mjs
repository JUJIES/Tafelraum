// Windows adapter: one pinned runtime and a fresh web build for every package.
import assert from 'node:assert/strict';
import {copyFile,mkdir,mkdtemp,readFile,realpath,rename,rm,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import runtimePins from './desktop-node-runtime.json' with {type:'json'};
const pin=runtimePins.platforms['win32-x64'];
export const pinnedNode={...pin,archive:pin.filename,archiveSha256:pin.sha256,
  url:`https://nodejs.org/dist/${pin.version}/${pin.filename}`,
  checksumsUrl:`https://nodejs.org/dist/${pin.version}/SHASUMS256.txt`};
import {readDesktopRelease} from './desktop-release-config.mjs';

export async function verifyWindowsRuntimeFile(filename, expected) {
  const actual=createHash('sha256').update(await readFile(filename)).digest('hex');
  assert.equal(actual,expected,`Windows runtime checksum mismatch: ${filename}`);
  return actual;
}

export async function prepareWindowsDesktop({channel,identifier,resourceDirectory}) {
  assert.equal(process.platform,'win32');
  const repository=fileURLToPath(new URL('../',import.meta.url));
  const app=path.join(repository,'prototypes/surface-shell-a-b');
  const release=await readDesktopRelease(repository);
  assert.equal(release.channel,channel);
  assert.equal(release.identifier,identifier);
  const allowed=new Set(['desktop-resources','installer-qa-resources','update-qa-resources','windows-resources']);
  assert(allowed.has(resourceDirectory));
  const cache=path.resolve(process.env.TAFELRAUM_WINDOWS_NODE_CACHE??path.join(tmpdir(),'tafelraum-windows-node',pinnedNode.version));
  await mkdir(cache,{recursive:true});
  const archive=path.join(cache,pinnedNode.archive);
  try { await readFile(archive); }
  catch(error) {
    if(error.code!=='ENOENT')throw error;
    const response=await fetch(pinnedNode.url,{redirect:'error',signal:AbortSignal.timeout(120000)});
    assert(response.ok,`Node download failed: ${response.status}`);
    const bytes=Buffer.from(await response.arrayBuffer());
    assert.equal(createHash('sha256').update(bytes).digest('hex'),pinnedNode.archiveSha256);
    await writeFile(archive,bytes,{flag:'wx'});
  }
  // Check the official archive before extracting or running anything from it.
  await verifyWindowsRuntimeFile(archive,pinnedNode.archiveSha256);
  const unpack=await mkdtemp(path.join(cache,'verified-'));
  execFileSync(path.join(process.env.SystemRoot,'System32','tar.exe'),['-xf',archive,'-C',unpack]);
  const runtime=path.join(unpack,`node-${pinnedNode.version}-win-x64`);
  const node=path.join(runtime,'node.exe'),license=path.join(runtime,'LICENSE');
  await verifyWindowsRuntimeFile(node,pinnedNode.nodeSha256);
  await verifyWindowsRuntimeFile(license,pinnedNode.licenseSha256);
  const env={...process.env,PATH:runtime+path.delimiter+process.env.PATH};
  execFileSync(node,[path.join(runtime,'node_modules/npm/bin/npm-cli.js'),'run','build'],{cwd:app,env,stdio:'inherit'});
  const staging=path.join(app,'.windows-stage-'+randomUUID());
  execFileSync(node,[path.join(repository,'scripts/stage-desktop-common.mjs'),staging],{env,stdio:'inherit'});
  await copyFile(node,path.join(staging,'runtime/node.exe'));
  await mkdir(path.join(staging,'runtime/licenses'),{recursive:true});
  await copyFile(license,path.join(staging,'runtime/licenses/NODE-LICENSE'));
  await writeFile(path.join(staging,'runtime/windows-runtime.json'),JSON.stringify({...pinnedNode,
    office:false,reason:'Bundled DOCX conversion requires macOS; existing platform guard remains enforced.'},null,2)+'\n');
  const resources=path.join(app,resourceDirectory);
  try {
    const existing=await realpath(resources);
    assert.equal(path.normalize(existing),path.normalize(resources),'Refuse redirected resource directory');
    const marker=JSON.parse(await readFile(path.join(resources,'server/desktop-release.json'),'utf8'));
    assert.equal(marker.identifier,identifier,'Preserve resources from another delivery identity');
    // Only replace this adapter's known generated directory inside this app.
    assert.equal(path.dirname(existing),await realpath(app));
    await rm(existing,{recursive:true});
  } catch(error) { if(error.code!=='ENOENT')throw error; }
  await rename(staging,resources);
  console.log(`Windows resources staged: ${release.channel} ${release.version}; verified ${pinnedNode.version}; DOCX unavailable.`);
}

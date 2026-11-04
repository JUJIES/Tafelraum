// Run after an official unsigned Windows build; signing happens on the maintainer host.
import assert from 'node:assert/strict';
import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkPublicVersions} from './check-public-versions.mjs';
import {validateWindowsBuildReceipt} from './public-release-set.mjs';

assert.equal(process.platform,'win32','Windows build host required');
const [installer,output]=process.argv.slice(2);
assert.ok(installer&&output,'NSIS_INSTALLER NEW_OUTPUT_DIRECTORY');
const root=fileURLToPath(new URL('../',import.meta.url)),app=path.join(root,'prototypes/surface-shell-a-b');
const run=(bin,args)=>execFileSync(bin,args,{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const sourceCommit=run('git',['-C',root,'rev-parse','HEAD']),version=await checkPublicVersions(root);
const changes=run('git',['-C',root,'status','--porcelain','--untracked-files=normal']).split('\n').filter(Boolean);
assert.ok(changes.every(line=>/^(?: M|\?\?) prototypes\/surface-shell-a-b\/src-tauri\/gen\/schemas\/[^/]+\.json$/.test(line)), 'Source changed during Windows build');
const delivery=JSON.parse(await readFile(path.join(app,'windows-resources/server/desktop-release.json'),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const binary=await readFile(installer),node=path.join(app,'windows-resources/runtime/node.exe');
const receipt={schemaVersion:1,profile:delivery.profile,channel:delivery.channel,identifier:delivery.identifier,
  port:delivery.port,platform:'windows-x86_64',version,sourceCommit,
  installerSha256:hash(binary),installerBytes:binary.length,nodeVersion:run(node,['--version']),nodeSha256:hash(await readFile(node)),
  signing:'Unsigned Windows installer; Tauri updater signature is applied on the signing host.',
  limitations:['No Authenticode certificate','DOCX conversion unavailable','Native acceptance and real update tests recorded separately']};
assert.equal(delivery.version,version);assert.equal(delivery.sourceCommit,sourceCommit);
const pins=JSON.parse(await readFile(path.join(root,'scripts/desktop-node-runtime.json'),'utf8'));
validateWindowsBuildReceipt(receipt,{version,sourceCommit},pins.platforms['win32-x64']);
assert.equal(binary.subarray(0,2).toString(),'MZ');
await mkdir(path.dirname(path.resolve(output)),{recursive:true});
await mkdir(output); // Refuse replacing an earlier candidate.
await copyFile(installer,path.join(output,`Tafelraum-Public-${version}-Windows-x64-setup.exe`));
await copyFile(path.join(app,'distribution/public/WINDOWS-INSTALLATION.txt'),path.join(output,'WINDOWS-INSTALLATION.txt'));
await writeFile(path.join(output,'windows-build.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));

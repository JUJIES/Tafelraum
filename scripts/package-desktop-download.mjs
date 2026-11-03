// Shared manual-download packaging for colleagues and public source releases.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readDesktopRelease} from './desktop-release-config.mjs';

export function downloadIdentity(profile,version,sourceCommit){
 assert.match(version,/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/);
 assert.ok(profile==='personal'||profile==='public');
 if(profile==='public')assert.match(sourceCommit??'',/^[a-f0-9]{40}$/,'Public downloads require their exact Git source commit');
 const channel=profile==='personal'?'mdm':'public';
 return {schemaVersion:1,channel,profile,version,platform:'darwin-aarch64',
   filename:'Tafelraum-'+(channel==='mdm'?'MDM':'Public')+'-'+version+'-macOS-arm64.zip',
   instructions:'INSTALLATIONSANLEITUNG.txt',...(sourceCommit?{sourceCommit}:{})};
}
export async function packageDownload(root,{bundle,output,version,sourceCommit,instructions}){
 const app=path.join(root,'prototypes/surface-shell-a-b');
 const profile=JSON.parse(await readFile(path.join(app,'distribution.json'),'utf8'));
 const identity=downloadIdentity(profile.profile,version,sourceCommit);
 const embedded=JSON.parse(await readFile(path.join(bundle,'Contents/Resources/desktop-resources/server/distribution.json'),'utf8'));
 assert.deepEqual(embedded,profile,'Bundle and source distribution profiles differ');
 const plist=path.join(bundle,'Contents/Info.plist');
 const actual=execFileSync('/usr/libexec/PlistBuddy',['-c','Print :CFBundleShortVersionString',plist],{encoding:'utf8'}).trim();
 assert.equal(actual,version,'Wrong app version');
 execFileSync('lipo',[path.join(bundle,'Contents/MacOS/tafelraum'),'-verify_arch','arm64']);
 execFileSync('codesign',['--verify','--deep','--strict',bundle]);
 if(identity.channel==='public'){
   assert.equal(profile.officialUpdates,false);
   const commit=execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
   assert.equal(commit,sourceCommit,'Public source commit differs');
   assert.equal(execFileSync('git',['-C',root,'status','--porcelain','--untracked-files=normal'],{encoding:'utf8'}).trim(),'','Commit public changes before packaging');
 }
 const releaseFile=path.join(bundle,'Contents/Resources/desktop-resources/server/desktop-release.json');
 let delivery=null;
 try { delivery=JSON.parse(await readFile(releaseFile,'utf8')); } catch(error) { if(error.code!=='ENOENT')throw error; }
 if(delivery) {
   const override=delivery.channel==='public' ? JSON.parse(await readFile(path.join(app,'src-tauri/tauri.public-release.conf.json'),'utf8')) : null;
   const expected=await readDesktopRelease(root,override);
   for(const [key,value] of Object.entries(expected))assert.deepEqual(delivery[key],value,'Embedded delivery mismatch: '+key);
   if(identity.channel==='public')assert.equal(delivery.sourceCommit,sourceCommit,'App was built from another source commit');
 }
 const bundleName=identity.channel==='public'&&delivery ? 'Tafelraum Public.app' : 'Tafelraum.app';
 const guide=await readFile(instructions??path.join(app,'distribution/INSTALLATIONSANLEITUNG.txt'),'utf8');
 assert.ok(guide.includes(identity.channel==='mdm'?'KOLLEGEN / MDM':'PUBLIC EDITION'),'Wrong edition instructions');
 output=path.resolve(output);await mkdir(output,{recursive:true});
 const zip=path.join(output,identity.filename);
 // Refuse before entering cleanup: never delete a pre-existing artifact.
 const {access}=await import('node:fs/promises');
 await assert.rejects(access(zip),{code:'ENOENT'});
 const stage=await mkdtemp(path.join(tmpdir(),'tafelraum-download-'));
 try{
  execFileSync('ditto',[bundle,path.join(stage,bundleName)]);
  await writeFile(path.join(stage,identity.instructions),guide);
  // Finder applies quarantine on download. Build-machine xattrs/resource forks
  // are not app contents and need not be duplicated into __MACOSX entries.
  execFileSync('ditto',['-c','-k','--norsrc','--noextattr','--noacl','--zlibCompressionLevel','9','.',zip],{cwd:stage});
  const listing=execFileSync('unzip',['-Z1',zip],{encoding:'utf8',maxBuffer:16*1024*1024});
  assert.ok(listing.split('\n').includes(identity.instructions));
  assert.doesNotMatch(listing,/Contents\/Resources\/desktop-resources\/(unterrichtsarchiv|personal-notes|live-canvas\.json|mobile-capture\.json|document-image\.json)|(?:^|\/)notes\.json$|\.(pkl|safetensors)$/im);
  const verified=path.join(stage,'verify');await mkdir(verified);
  execFileSync('ditto',['-x','-k',zip,verified]);
  execFileSync('codesign',['--verify','--deep','--strict',path.join(verified,bundleName)]);
  const hash=createHash('sha256');let bytes=0;
  for await(const chunk of createReadStream(zip)){hash.update(chunk);bytes+=chunk.length;}
  const manifest={...identity,...(delivery?{bundleName,updateChannel:delivery.channel}:{}),sha256:hash.digest('hex'),bytes,instructionsSha256:createHash('sha256').update(guide).digest('hex')};
  await writeFile(path.join(output,identity.instructions),guide,{flag:'wx'});
  await writeFile(path.join(output,'download.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  return manifest;
 }catch(error){await rm(zip,{force:true});throw error;}
 finally{await rm(stage,{recursive:true,force:true});}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [bundle,output,version,sourceCommit,instructions]=process.argv.slice(2);
 assert.ok(bundle&&output&&version,'BUNDLE OUTPUT VERSION [PUBLIC_SOURCE_COMMIT]');
 const root=fileURLToPath(new URL('../',import.meta.url));
 console.log(JSON.stringify(await packageDownload(root,{bundle,output,version,sourceCommit,instructions}),null,2));
}

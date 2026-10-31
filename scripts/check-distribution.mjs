import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {personalOnlyFiles,publicAdapters} from './public-distribution.mjs';
export async function checkDistribution(repository){
 const root=path.join(repository,'prototypes/surface-shell-a-b');
 const profile=JSON.parse(await readFile(path.join(root,'distribution.json'),'utf8'));
 assert.equal(profile.schemaVersion,1);assert.ok(['personal','public'].includes(profile.profile));
 const personal=profile.profile==='personal';
 assert.equal(profile.officialUpdates,personal);assert.equal(profile.remoteCanvas,personal);
 const config=JSON.parse(await readFile(path.join(root,'src-tauri/tauri.conf.json'),'utf8'));
 assert.equal(Boolean(config.plugins?.updater?.endpoints?.length),personal);
 assert.equal(config.bundle.createUpdaterArtifacts,personal);
 if(personal){
  for(const file of personalOnlyFiles)await access(path.join(root,file));
  await access(path.join(repository,'services/live-canvas/package.json'));
  assert.ok(profile.embeddedApps.length>0);
 }else{
  assert.deepEqual(profile.embeddedApps,[]);assert.equal(config.plugins?.updater,undefined);
  for(const file of [...personalOnlyFiles.map(file=>path.join(root,file)),path.join(repository,'services/live-canvas'),path.join(root,'viewer'),path.join(root,'public/apps/lerndeck.svg')]){
   await assert.rejects(access(file),{code:'ENOENT'},'Personal component present in public source');
  }
  for(const [target,source] of Object.entries(publicAdapters))assert.deepEqual(await readFile(path.join(root,target)),await readFile(path.join(root,'distribution/public',source)),'Public adapter drift: '+target);
 }
 return {profile:profile.profile,remoteCanvas:profile.remoteCanvas,officialUpdates:profile.officialUpdates};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const expected=process.argv.slice(2);
 assert.ok(expected.length===0||(expected.length===1&&['personal','public'].includes(expected[0])),'Erwartet: [personal|public]');
 const result=await checkDistribution(fileURLToPath(new URL('../',import.meta.url)));
 if(expected.length)assert.equal(result.profile,expected[0],'Falsches Quellprofil für diesen Vorgang');
 console.log(JSON.stringify(result));
}

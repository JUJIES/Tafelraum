// Explicit, reviewable distribution adapters. Operates only on a new export.
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,rm,access} from 'node:fs/promises';
import path from 'node:path';
const app='prototypes/surface-shell-a-b';
export const publicAdapters=Object.freeze({
 'distribution.json':'distribution.json',
 'distribution/INSTALLATIONSANLEITUNG.txt':'INSTALLATIONSANLEITUNG.txt',
 'src/DistributionSettings.tsx':'DistributionSettings.tsx',
 'ai-settings-extension.mjs':'ai-settings-extension.mjs',
 'live-canvas-provisioning.mjs':'live-canvas-provisioning.mjs',
 'interactive-html-sentence-check.mjs':'interactive-html-sentence-check.mjs',
 'src/canvas/interactive-html-sentence-check.ts':'interactive-html-sentence-check.ts',
});
export const personalOnlyFiles=Object.freeze([
 'src/AiConnectionSettings.tsx','personal-ai-key.mjs','personal-ai-settings.mjs',
 'sentence-assessment-core.mjs','sentence-check-tasks.mjs',
 'personal-ai-key.test.mjs','personal-ai-settings-plugin.test.mjs','sentence-assessment-direct.test.mjs',
 'interactive-html-sentence-check.test.mjs','interactive-html-sentence-route.test.mjs','src/canvas/interactive-html-sentence-check.test.ts',
 'scripts/publish-update.sh','scripts/build-mac-release.sh','scripts/write-update-manifest.mjs','src/live/live-host.test.ts','live-canvas-plugin.test.ts',
]);
export async function selectPublicDistribution(destination){
 const base=path.join(destination,app);
 try{await access(path.join(base,'distribution.json'));}catch(error){if(error.code==='ENOENT')return null;throw error;}
 const profile=JSON.parse(await readFile(path.join(base,'distribution/public/distribution.json'),'utf8'));
 assert.deepEqual(profile,{schemaVersion:1,profile:'public',officialUpdates:false,embeddedApps:[],remoteCanvas:false},'Unsafe public distribution profile');
 const replaced=[],omitted=[];
 for(const [target,source] of Object.entries(publicAdapters)){
  await copyFile(path.join(base,'distribution/public',source),path.join(base,target));replaced.push(app+'/'+target);
 }
 for(const file of personalOnlyFiles){await rm(path.join(base,file),{force:true});omitted.push(app+'/'+file);}
 for(const file of ['scripts/lerndeck-embed-browser-test.mjs','scripts/lerndeck-room-browser-test.mjs','scripts/lerndeck-selection-browser-test.mjs','scripts/prepare-language-bites-test.mjs','scripts/prepare-language-bites-native-test.mjs','scripts/deploy-live-canvas.mjs','scripts/deploy-live-canvas.ps1','scripts/live-canvas-browser-check.mjs',
  'scripts/deploy-mobile-capture.mjs','scripts/deploy-mobile-capture.ps1','scripts/live-canvas-deployment.md','scripts/live-canvas-smoke.mjs','scripts/live-canvas-meeting-smoke.mjs']){
  await rm(path.join(destination,file),{force:true});omitted.push(file);
 }
 const editJson=async(file,change)=>{const data=JSON.parse(await readFile(path.join(base,file),'utf8'));change(data);await writeFile(path.join(base,file),JSON.stringify(data,null,2)+'\n');replaced.push(app+'/'+file);};
 await editJson('src-tauri/tauri.conf.json',config=>{
  config.identifier="app.jujies.tafelraum.public";
  config.productName="Tafelraum Public";
  delete config.plugins?.updater;
  config.bundle.createUpdaterArtifacts=false;
 });
 await editJson('src-tauri/capabilities/default.json',config=>{
  config.remote.urls=config.remote.urls.map(url=>url.replace(':49317/',':49318/'));
 });
 // Every removed personal test has a public absence test in distribution.test.mjs.
 await editJson('package.json',pkg=>{
  for(const name of ['test','test:live']) pkg.scripts[name]=pkg.scripts[name].split(' ').filter(token=>!personalOnlyFiles.includes(token)).join(' ');
  for(const name of ['build:live','prebuild:live','postbuild:live','release:mac']) delete pkg.scripts[name];
 });
 for(const file of ['services/live-canvas',app+'/viewer',app+'/vite.live.config.ts',app+'/public/apps/lerndeck.svg']){
  await rm(path.join(destination,file),{recursive:true,force:true});omitted.push(file);
 }
 await editJson('public/licenses/tafelraum/provenance.json',manifest=>{
  manifest.assets=manifest.assets.filter(asset=>asset.source!==app+'/public/apps/lerndeck.svg');
 });
 await copyFile(path.join(base,'distribution/public/RELEASE.md'),path.join(base,'RELEASE.md'));
 replaced.push(app+'/RELEASE.md');
 return {profile:'public',replaced,omitted};
}

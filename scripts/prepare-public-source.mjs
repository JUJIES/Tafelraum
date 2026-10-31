// Local review candidate only. No Git initialization, remote, commit or upload.
import {readFile,writeFile,readdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {selectPublicDistribution} from './public-distribution.mjs';
import {selectPublicDocs} from './public-source-docs.mjs';
import {snapshotBuildSource} from './snapshot-build-source.mjs';

export async function preparePublicSource(repository, destination) {
 destination=path.resolve(destination);
// Existing snapshot helper enforces output/, no overwrite and no linked ancestors.
await snapshotBuildSource(repository,destination,{includeLocalFixtures:false});
const excluded=[
 'prototypes/surface-shell-a-b/node_modules','services/live-canvas/node_modules','local-data',
 'scripts/dev.mjs','scripts/install-classroom-package.sh','scripts/check-delivery.mjs','scripts/prepare-git-tree.mjs','scripts/delivery-identity.test.mjs',
 'scripts/start-tafelraum.sh','scripts/install-tafelraum-desktop-app.sh','scripts/tafelraum-desktop.applescript',
];
for(const relative of excluded) await rm(path.join(destination,relative),{recursive:true,force:true});
const distributionProfile=await selectPublicDistribution(destination);
excluded.push(...(distributionProfile?.omitted??[]));
const documentationProfile=await selectPublicDocs(destination,{distributionOmissions:distributionProfile?.omitted??[]});
excluded.push(...documentationProfile.omitted);
const manifest=[], blockers=[];
async function inspect(relative='') {
 for(const entry of await readdir(path.join(destination,relative),{withFileTypes:true})) {
  const name=relative ? `${relative}/${entry.name}` : entry.name;
  if(entry.isSymbolicLink()) {blockers.push({path:name,reason:'symlink'});continue;}
  if(entry.isDirectory()) {await inspect(name);continue;}
  const bytes=await readFile(path.join(destination,name));
  if(/(?:^|\/)(?:\.git|__pycache__|\.ssh)(?:\/|$)|\.(?:py[cod]|key|pem|p12|pfx)$|(?:^|\/)\.env(?:\.|$)/i.test(name)) blockers.push({path:name,reason:'private/generated file type'});
  if(name.startsWith('docs/design/mockups/') && /\.png$/i.test(name)) blockers.push({path:name,reason:'unapproved historical image'});
  // Cover ordinary home paths and Windows file URLs; synthetic test homes stay usable.
  const personalHome = /(?:[/](?:Users|home)[/]|[a-z]:[\\/]+Users[\\/]+)(?!test[\\/])[^\\/\r\n"'<>]+[\\/]/i;
  if(personalHome.test(bytes.toString('utf8'))) blockers.push({path:name,reason:'machine-specific user path'});
  manifest.push({path:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
}
await inspect();
const report={status:blockers.length?'blocked':'local-review-candidate',excluded,blockers,distributionProfile,documentationProfile,files:manifest,
 remaining:['Review project license scope and asset provenance','Review independent third-party redistribution conditions','Review public documentation scope and production service references','Final secret scan and approval before upload'],
 warning:'Existing repository history is not included or sanitized. This directory is not a publication approval.'};
await writeFile(destination+'.manifest.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
if(blockers.length) throw Error(`Exportprüfung blockiert (${blockers.length} Fundstellen). Details im Manifest; keine Freigabe.`);
return report;
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 if(process.argv.length===3 && process.argv[2]==='--help') {
  console.log('node scripts/prepare-public-source.mjs output/<task>/source\nCreates a new local source copy and sibling manifest under output/. No overwrite, Git changes, commit, remote or upload. Does not grant publication approval.');
  process.exit(0);
 }
 if(process.argv.length!==3) throw Error('node scripts/prepare-public-source.mjs output/<auftrag>/source');
 const report=await preparePublicSource(fileURLToPath(new URL('../',import.meta.url)),process.argv[2]);
 console.log(`Lokaler Prüfkandidat: ${path.resolve(process.argv[2])}; ${report.files.length} Dateien. Keine Historie oder Dependencies. Drittbedingungen/Uploadfreigabe offen.`);
}

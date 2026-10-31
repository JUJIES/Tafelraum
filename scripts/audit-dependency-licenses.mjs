// Read-only metadata inventory. No compatibility decisions, downloads or license changes.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {hasRemoteDistribution} from './distribution-projects.mjs';

async function documents(directory) {
 let entries;
 try {entries=await readdir(directory,{withFileTypes:true});}
 catch(error) {if(error.code==='ENOENT') return [];throw error;}
 const result=[];
 for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))) {
  if(!entry.isFile() || !/^(?:licen[sc]e|copying|notice)(?:[._-]|$)/i.test(entry.name)) continue;
  const bytes=await readFile(path.join(directory,entry.name));
  result.push({name:entry.name,sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length});
 }
 return result;
}

export async function auditDependencyLicenses(repository,cargoMetadata) {
 const npm=[];
 for(const project of ['prototypes/surface-shell-a-b',...(await hasRemoteDistribution(repository)?['services/live-canvas']:[])]) {
  const lock=JSON.parse(await readFile(path.join(repository,project,'package-lock.json'),'utf8'));
  for(const [location,pkg] of Object.entries(lock.packages).sort(([a],[b])=>a.localeCompare(b))) {
   if(!location) continue;
   const directory=path.join(repository,project,location);
   let installed;
   try {installed=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));}
   catch(error) {if(error.code!=='ENOENT') throw error;}
   const matches=installed?.version===pkg.version;
   npm.push({project,location,name:pkg.name ?? location.split('node_modules/').at(-1),version:pkg.version,
    license:pkg.license ?? (matches ? installed.license : null) ?? null,
    developmentOnly:pkg.dev===true,optional:pkg.optional===true,
    installedVersionMatches:matches,documents:matches ? await documents(directory) : []});
  }
 }
 const cargo=[];
 for(const pkg of cargoMetadata.packages.filter(pkg=>pkg.source).sort((a,b)=>a.id.localeCompare(b.id))) {
  cargo.push({name:pkg.name,version:pkg.version,license:pkg.license ?? null,
   sourceType:pkg.source.startsWith('registry+')?'registry':'git-or-other',
   declaredLicenseFile:pkg.license_file ? path.basename(pkg.license_file) : null,
   documents:await documents(path.dirname(pkg.manifest_path))});
 }
 const all=[...npm,...cargo];
 return {format:'tafelraum-license-inventory',schemaVersion:1,
  warning:'Metadata and document evidence only. Not a license compatibility or redistribution approval. All lockfile targets, not a shipped-binary contents list.',
  summary:{npm:npm.length,cargo:cargo.length,missingLicenseExpressions:all.filter(p=>!p.license).length,
   withoutLocalLicenseDocuments:all.filter(p=>!p.documents.length).length},npm,cargo};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 if(process.argv.length===3 && process.argv[2]==='--help') {
  console.log('node scripts/audit-dependency-licenses.mjs <cargo-metadata.json> <report.json>\nReads local npm/Cargo metadata and original license texts. Writes one new report; never overwrites, downloads or decides compatibility.');
  process.exit(0);
 }
 if(process.argv.length!==4) throw Error('node scripts/audit-dependency-licenses.mjs <cargo-metadata.json> <report.json>');
 const repository=fileURLToPath(new URL('../',import.meta.url));
 const report=await auditDependencyLicenses(repository,JSON.parse(await readFile(process.argv[2],'utf8')));
 await writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify(report.summary));
}

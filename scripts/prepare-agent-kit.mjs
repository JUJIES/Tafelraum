// A closed selection of the existing local pipeline; never copy archive/global skills.
import {readFile,writeFile,mkdir,rm,rename,mkdtemp,lstat,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import referenceFiles from '../docs/agent-references/files.json' with {type:'json'};

export const agentKitFormat='tafelraum-agent-kit-v1';
export const agentKitFiles=[
 ...['README.md','LAYOUT.md','PROVENANCE.md','overview.png','files.json',...referenceFiles].map(name=>'docs/agent-references/'+name),
 'LICENSE',
 'scripts/tafelraum-unterricht.mjs','scripts/tafelraum-canvas-agent.mjs',
 'scripts/check-interactive-material.mjs','scripts/install-interactive-material.mjs',
 'scripts/create-archive-backup.mjs','scripts/verify-archive-backup.mjs','scripts/prune-archive-backups.mjs',
 'scripts/archive-tar.mjs',
 ...['teaching-agent-protocol.mjs','canvas-agent-protocol.mjs','interactive-material.mjs','sentence-check-contract.mjs','interactive-html-playback.mjs'].map(name=>'prototypes/surface-shell-a-b/'+name),
 ...['tafelraum-unterricht-organisieren','tafelraum-canvas-vorbereiten','tafelraum-unterrichtsmaterial','tafelraum-interactive-html'].map(name=>'.agents/skills/'+name+'/SKILL.md'),
 '.agents/skills/tafelraum-canvas-vorbereiten/references/layout.md',
 '.agents/skills/tafelraum-interactive-html/shared-pages.css',
 'docs/design/00_UI_UX_STYLEGUIDE.md','docs/design/05_INTERACTIVE_HTML_MATERIAL_UI_BRIEF.md',
 'docs/implementation/02_VERTRAG_INTERAKTIVE_MATERIALPROJEKTION.md',
 'docs/implementation/04_INTERAKTIVE_HTML_MATERIALIEN.md',
 'docs/implementation/03_BACKUP_UND_WIEDERHERSTELLUNG_LOKAL.md',
 'docs/implementation/45_CANVAS_AGENT.md','docs/implementation/47_TEACHING_AGENT.md',
 'docs/unterricht/00_ARBEITSWEISE_UNTERRICHT.md',
 'docs/agent-examples/README.md',
 ...['starter-worksheet','starter-interactive'].flatMap(name=>['manifest.json','index.html'].map(file=>'docs/agent-examples/'+name+'/'+file)),
];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function collectAgentKit(repository){
 const root=await realpath(repository),files=new Map();
 const selection=[...agentKitFiles.map(name=>[name,name]),['README.md','docs/agent-kit/START.md'],['AGENTS.md','docs/agent-kit/AGENTS.md']];
 for(const [target,source] of selection){
  const filename=path.join(root,source),resolved=await realpath(filename);
  if(!(await lstat(filename)).isFile()||!resolved.startsWith(root+path.sep))throw Error('Agentenpaket: unsichere Quelldatei '+source);
  files.set(target,await readFile(filename));
 }
 const metadata=JSON.parse(await readFile(path.join(root,'prototypes/surface-shell-a-b/package.json'),'utf8'));
 files.set('prototypes/surface-shell-a-b/package.json',Buffer.from(JSON.stringify({name:'@tafelraum/agent-kit-runtime',version:metadata.version,type:'module'})+'\n'));
 // Keep the complete canonical text. Mark optional developer references absent
 // from this bounded user kit instead of pulling in private/history documents.
 for(const [name,bytes] of files)if(name.endsWith('.md')&&name!=='LICENSE'){
  const parts=bytes.toString('utf8').split(/(```[\s\S]*?```)/g);
  for(let i=0;i<parts.length;i+=2)parts[i]=parts[i].replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,(link,label,href)=>{
   const raw=href.split('#')[0];if(!raw||/^[a-z][a-z0-9+.-]*:/i.test(raw))return link;
   const target=path.posix.normalize(path.posix.join(path.posix.dirname(name),decodeURIComponent(raw)));
   return files.has(target)||[...files.keys()].some(file=>file.startsWith(target.replace(/\/$/,'')+'/'))?link:label+' (Vertiefung im Quellrepository)';
  });
  files.set(name,Buffer.from(parts.join('')));
 }
 const entries=[...files].map(([name,bytes])=>({path:name,bytes:bytes.length,sha256:digest(bytes)}));
 const manifest={format:agentKitFormat,appVersion:metadata.version,revision:digest(JSON.stringify(entries)),entry:'README.md',files:entries};
 files.set('agent-kit.json',Buffer.from(JSON.stringify(manifest,null,2)+'\n'));
 return {files,manifest};
}
export async function prepareAgentKit(repository,destination){
 const {files,manifest}=await collectAgentKit(repository);
 const target=path.resolve(destination);await mkdir(path.dirname(target),{recursive:true});
 try{const stat=await lstat(target);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Agentenpaketziel ist kein erzeugter Ordner.');
  const old=JSON.parse(await readFile(path.join(target,'agent-kit.json'),'utf8'));
  if(old.format!==agentKitFormat)throw Error('Agentenpaketziel ist kein erzeugter Ordner.');
 }catch(error){if(error.code!=='ENOENT')throw error;
  // An existing folder without our marker must never be erased.
  try{await lstat(target);throw Error('Vorhandenen Ordner ohne Agentenpaket-Marker erhalten.');}catch(check){if(check.code!=='ENOENT')throw check;}
 }
 const staging=await mkdtemp(path.join(path.dirname(target),'.agent-kit-'));
 try{
  for(const [relative,bytes] of files){const output=path.join(staging,relative);await mkdir(path.dirname(output),{recursive:true});await writeFile(output,bytes,{flag:'wx'});}
  await rm(target,{recursive:true,force:true});await rename(staging,target);
 }finally{await rm(staging,{recursive:true,force:true});}
 return {root:target,...manifest};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==3)throw Error('node scripts/prepare-agent-kit.mjs AUSGABEORDNER');
 const result=await prepareAgentKit(fileURLToPath(new URL('../',import.meta.url)),process.argv[2]);
 console.log(result.root);
}

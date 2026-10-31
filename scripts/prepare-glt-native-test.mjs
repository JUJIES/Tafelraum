// Reproducible isolated QA workspace, following the existing native QA pattern.
// Production identifier, source port, installed app and archive remain untouched.
import {cp,mkdir,readFile,writeFile,lstat,realpath,symlink} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const app=path.join(root,'prototypes/surface-shell-a-b');
const output=path.join(root,'output/glt-html-integration/native-test');
const workspace=path.join(output,'qa-workspace');
const native=path.join(workspace,'src-tauri');
const archive=path.join(root,'output/glt-html-integration/test-archive');
const identifier='app.jujies.tafelraum.qa-glt-html';
const profile=path.join(os.homedir(),'Library/Application Support',identifier);
const marker=path.join(output,'isolation.json');
const catalog=JSON.parse(await readFile(path.join(archive,'archive.json'),'utf8'));
if(catalog.testPurpose!=='glt-html-integration'||catalog.catalog.lessons.some(lesson=>!lesson.id.startsWith('test-glt-')))
  throw new Error('Nur das getrennte gLT-Testarchiv ist erlaubt.');
try {
  const previous=JSON.parse(await readFile(marker,'utf8'));
  if(previous.identifier!==identifier||previous.archive!==archive)throw new Error('Abweichendes QA-Ziel.');
}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(native,{recursive:true});
for(const file of ['src','icons','capabilities','Cargo.toml','Cargo.lock','build.rs'])
  await cp(path.join(app,'src-tauri',file),path.join(native,file),{recursive:true});
// Guarded mechanical changes to this generated QA copy, never canonical Rust.
const rustPath=path.join(native,'src/lib.rs');let rust=await readFile(rustPath,'utf8');
for(const [from,to] of [
  ['const LOCAL_PORT: u16 = 49_317;','const LOCAL_PORT: u16 = 49_627;'],
  ['let base = "http://127.0.0.1:49317";','let base = "http://127.0.0.1:49627";'],
]){
  if(rust.split(from).length!==2)throw new Error('Native Portstellen haben sich geändert; QA-Abbildung prüfen.');
  rust=rust.replace(from,to);
}
await writeFile(rustPath,rust);
const config=JSON.parse(await readFile(path.join(app,'src-tauri/tauri.conf.json'),'utf8'));
config.productName='Tafelraum gLT Test';config.identifier=identifier;
config.build.beforeBuildCommand='';config.build.frontendDist=path.join(app,'desktop-shell');
config.app.windows[0].title='Tafelraum gLT Test · nur Testarchiv';
config.bundle.createUpdaterArtifacts=false;
config.bundle.resources={[path.join(app,'desktop-resources')+'/']:'desktop-resources/'};
await writeFile(path.join(native,'tauri.conf.json'),JSON.stringify(config,null,2)+'\n');
const permissionPath=path.join(native,'capabilities/default.json');
const permissions=JSON.parse(await readFile(permissionPath,'utf8'));
permissions.remote.urls=['http://127.0.0.1:49627/*'];
await writeFile(permissionPath,JSON.stringify(permissions,null,2)+'\n');
await mkdir(profile,{recursive:true});
const link=path.join(profile,'unterrichtsarchiv');
try {
  const metadata=await lstat(link);
  if(!metadata.isSymbolicLink()||await realpath(link)!==await realpath(archive))throw new Error('QA-Profil enthält einen anderen Archivbestand.');
}catch(error){if(error.code!=='ENOENT')throw error;await symlink(archive,link,'dir');}
await writeFile(marker,JSON.stringify({identifier,archive,profile,workspace,port:49627,productName:config.productName,
  notes:'Separate QA app/profile/port; generated copy differs only by guarded loopback-port substitutions. No production archive or app mutation.'},null,2)+'\n');
console.log(JSON.stringify({workspace,profile,archive,port:49627},null,2));

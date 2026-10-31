// Original web notices and exact font evidence; no license compatibility decision.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function safeRelative(file) {
 assert.equal(typeof file,'string','Invalid notice path');
 assert.ok(file && !file.includes('\\') && !file.startsWith('/') && !file.split('/').some(part=>!part || part==='.' || part==='..'),'Unsafe notice path');
 return file;
}
async function fontFiles(root,relative='') {
 const result=[];
 for(const entry of await readdir(path.join(root,relative),{withFileTypes:true})) {
  const file=relative ? relative+'/'+entry.name : entry.name;
  if(entry.isDirectory()) result.push(...await fontFiles(root,file));
  else if(entry.isFile() && entry.name.endsWith('.woff2')) result.push(file);
 }
 return result.sort();
}

export async function checkWebLicenseNotices(appRoot,{built=null}={}) {
 assert.ok(built===null || built==='app' || built==='live','Expected built target app or live');
 const root=path.join(appRoot,'public/licenses');
 const bytes=await readFile(path.join(root,'web-provenance.json'));
 const manifest=JSON.parse(bytes);
 assert.equal(manifest.schemaVersion,1,'Unknown web notice manifest');
 for(const name of ['@excalidraw/excalidraw','@fluentui/svg-icons']) {
  const pkg=JSON.parse(await readFile(path.join(appRoot,'node_modules',name,'package.json'),'utf8'));
  assert.equal(manifest.packages[name],pkg.version,`${name} changed: review and refresh notice evidence`);
 }
 const listed=manifest.files.map(row=>safeRelative(row.file));
 assert.equal(new Set(listed).size,listed.length,'Duplicate notice');
 assert.ok(listed.includes('excalidraw/LICENSE') && listed.includes('fluent-system-icons/LICENSE'),'Missing package notice');
 const fontRoot=path.join(appRoot,'node_modules/@excalidraw/excalidraw/dist/prod/fonts');
 const actualFonts=await fontFiles(fontRoot);
 assert.deepEqual(manifest.fonts.map(row=>safeRelative(row.file)).sort(),actualFonts,'Font evidence is incomplete');
 const families=[...new Set(actualFonts.map(file=>file.split('/')[0]))].sort();
 assert.deepEqual(manifest.families.map(row=>row.name).sort(),families,'Font family evidence is incomplete');
 for(const family of manifest.families) {
  assert.ok(family.noticeFiles.length>0,`Missing font notice: ${family.name}`);
  for(const file of family.noticeFiles) assert.ok(file.startsWith(`excalidraw/fonts/${family.name}/`) && listed.includes(file),`Unassigned font notice: ${family.name}`);
 }
 for(const row of manifest.fonts) assert.equal(hash(await readFile(path.join(fontRoot,row.file))),row.sha256,`Font changed: ${row.file}`);
 for(const row of manifest.files) assert.equal(hash(await readFile(path.join(root,row.file))),row.sha256,`Notice changed: ${row.file}`);
 for(const family of manifest.families.filter(row=>row.name==='Liberation')) {
  const evidenceFile=safeRelative(family.sourceEvidenceFile);
  assert.ok(family.noticeFiles.includes(evidenceFile),'Missing Liberation source evidence');
  const evidence=JSON.parse(await readFile(path.join(root,evidenceFile),'utf8'));
  const font=manifest.fonts.find(row=>row.file===evidence.font.file);
  assert.ok(font && font.file.startsWith('Liberation/') && font.sha256===evidence.font.sha256,'Liberation source evidence belongs to another font');
  for(const source of [evidence.sourceArchive,evidence.debianPatch,evidence.descriptor]) {
   const file=path.posix.join(path.posix.dirname(evidenceFile),safeRelative(source.file));
   assert.ok(family.noticeFiles.includes(file) && manifest.files.some(row=>row.file===file && row.sha256===source.sha256),'Liberation source evidence belongs to another source package');
  }
  assert.deepEqual(evidence.comparison.outlineDifferences,[],'Liberation outlines do not match');
  assert.deepEqual(evidence.comparison.hintProgramDifferences,[],'Liberation hinting does not match');
  assert.ok(evidence.comparison.cmapEqual && evidence.comparison.metricsEqual,'Liberation characters/metrics do not match');
 }
 let bundledFonts=0;
 if(built) {
  const destination=path.join(appRoot,built==='app'?'dist':'dist-live');
  assert.deepEqual(await readFile(path.join(destination,'licenses/web-provenance.json')),bytes,'Built web notice manifest differs');
  for(const row of manifest.files) assert.equal(hash(await readFile(path.join(destination,'licenses',row.file))),row.sha256,`Built notice missing/changed: ${row.file}`);
  const known=new Set(manifest.fonts.map(row=>row.sha256));
  for(const file of await fontFiles(destination)) {
   assert.ok(known.has(hash(await readFile(path.join(destination,file)))),`Bundled font lacks evidence: ${file}`);
   bundledFonts++;
  }
  for(const row of manifest.fonts) assert.equal(hash(await readFile(path.join(destination,'fonts',row.file))),row.sha256,`Canvas font missing/changed: ${row.file}`);
 }
 return {notices:listed.length,families:families.length,fonts:actualFonts.length,bundledFonts,built};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const args=process.argv.slice(2);
 if(args.length===1 && args[0]==='--help') {
  console.log('node scripts/check-web-license-notices.mjs [--built app|live]\nChecks pinned web package/font evidence and unchanged notices, optionally in the actual build. Read-only; no license approval.');
  process.exit(0);
 }
 if(args.length && !(args.length===2 && args[0]==='--built' && ['app','live'].includes(args[1]))) throw Error('Expected --built app|live, --help or no arguments');
 console.log(JSON.stringify(await checkWebLicenseNotices(fileURLToPath(new URL('../prototypes/surface-shell-a-b',import.meta.url)),{built:args[1]??null})));
}

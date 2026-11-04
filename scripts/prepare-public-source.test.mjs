import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access,realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {preparePublicSource} from './prepare-public-source.mjs';

async function fixture(t) {
 const repository=await realpath(await mkdtemp(path.join(tmpdir(),'tafelraum-public-source-')));
 t.after(()=>rm(repository,{recursive:true,force:true}));
 execFileSync('git',['init','-q'],{cwd:repository});
 const file=async(name,body='fixture')=>{await mkdir(path.dirname(path.join(repository,name)),{recursive:true});await writeFile(path.join(repository,name),body);};
 await file('.gitignore','output/\nlocal-data/\nnode_modules/\n');
 await file('README.md','Public candidate fixture');
 return {repository,file,destination:path.join(repository,'output/review/source')};
}

test('public candidate preserves source bytes, omits machine launchers/dependencies/history, and never overwrites',async t=>{
 const f=await fixture(t);
 await f.file('src/example.ts','export const answer = 42;');
 await f.file('scripts/start-tafelraum.sh','local launcher');
 await f.file('prototypes/surface-shell-a-b/node_modules/keep','original dependency');
 const report=await preparePublicSource(f.repository,f.destination);
 assert.equal(report.status,'local-review-candidate');
 assert.equal(await readFile(path.join(f.destination,'src/example.ts'),'utf8'),'export const answer = 42;');
 for(const name of ['.git','local-data','scripts/start-tafelraum.sh','prototypes/surface-shell-a-b/node_modules']) await assert.rejects(access(path.join(f.destination,name)));
 assert.equal(await readFile(path.join(f.repository,'prototypes/surface-shell-a-b/node_modules/keep'),'utf8'),'original dependency');
 assert.ok(report.remaining.some(item=>/license|redistribution/i.test(item)));
 await assert.rejects(preparePublicSource(f.repository,f.destination),{code:'EEXIST'});
});

test('public candidate blocks risky tracked files even when ignore rules would hide new ones',async t=>{
 const f=await fixture(t);
 await f.file('.gitignore','output/\n*.pem\n');
 await f.file('accidental.pem','synthetic, no private key');
 execFileSync('git',['add','-f','accidental.pem'],{cwd:f.repository});
 await f.file('docs/design/mockups/old.png','synthetic, no actual image');
 await assert.rejects(preparePublicSource(f.repository,f.destination),/Exportprüfung blockiert/);
 const report=JSON.parse(await readFile(f.destination+'.manifest.json','utf8'));
 assert.equal(report.status,'blocked');
 assert.ok(report.blockers.some(row=>row.path==='accidental.pem'));
 assert.ok(report.blockers.some(row=>row.path==='docs/design/mockups/old.png'));
});

for (const [platform, home] of [
 ['macOS', ['', 'Users', 'private-fixture', 'document.pdf'].join('/')],
 ['Linux', ['', 'home', 'private-fixture', 'document.pdf'].join('/')],
 ['Windows', ['C:', 'Users', 'private-fixture', 'document.pdf'].join('\\')],
 ['macOS profile with spaces', ['', 'Users', 'private fixture', 'document.pdf'].join('/')],
 ['Windows profile with spaces', ['C:', 'Users', 'private fixture', 'document.pdf'].join('\\')],
 ['Windows file URL', 'file:///' + ['C:', 'Users', 'private-fixture', 'document.pdf'].join('/')],
]) {
 test(`public candidate rejects ${platform} personal paths without copying values into its manifest`,async t=>{
  const f=await fixture(t);
  await f.file('docs/path.md',home);
  await assert.rejects(preparePublicSource(f.repository,f.destination),/Exportprüfung blockiert/);
  const text=await readFile(f.destination+'.manifest.json','utf8');
  const report=JSON.parse(text);
  assert.ok(report.blockers.some(row=>row.path==='docs/path.md' && row.reason==='machine-specific user path'));
  assert.ok(!text.includes(home));
 });
}

test('reviewed public docs replace only the export; private examples are omitted and code bytes stay unchanged',async t=>{
 const f=await fixture(t);
 await f.file('public-source.json',JSON.stringify({schemaVersion:1,omit:['docs/private-lessons'],replace:{'docs/history.md':'docs/public/summary.md'}}));
 await f.file('docs/history.md','Private local installation history');
 await f.file('docs/public/summary.md','Public technical contract');
 await f.file('docs/private-lessons/example.md','Private case contents');
 await f.file('docs/guide.md','[local case](private-lessons/example.md) and [source](../src/app.ts)');
 await f.file('src/app.ts','export const stable = true;');
 const report=await preparePublicSource(f.repository,f.destination);
 assert.equal(await readFile(path.join(f.destination,'docs/history.md'),'utf8'),'Public technical contract');
 assert.equal(await readFile(path.join(f.repository,'docs/history.md'),'utf8'),'Private local installation history');
 await assert.rejects(access(path.join(f.destination,'docs/private-lessons')));
 assert.match(await readFile(path.join(f.destination,'docs/guide.md'),'utf8'),/lokaler Beleg/);
 assert.match(await readFile(path.join(f.destination,'docs/guide.md'),'utf8'),/\[source\]\(\.\.\/src\/app.ts\)/);
 assert.equal(await readFile(path.join(f.destination,'src/app.ts'),'utf8'),'export const stable = true;');
 assert.equal(report.documentationProfile.localEvidenceLinks.length,1);
});

test('public documentation policy cannot replace application code or escape its reviewed template directory',async t=>{
 const f=await fixture(t);
 await f.file('docs/public/template.md','reviewed text');
 await f.file('public-source.json',JSON.stringify({schemaVersion:1,omit:[],replace:{'src/app.ts':'docs/public/template.md'}}));
 await assert.rejects(preparePublicSource(f.repository,f.destination),/Unsafe public documentation path/);
});

test('public documentation selection never rewrites original license and notice Markdown',async t=>{
 const f=await fixture(t);
 await f.file('public-source.json',JSON.stringify({schemaVersion:1,omit:[],replace:{}}));
 const original='Original third-party copyright\n[Source](../output/original-source.txt)';
 await f.file('docs/NOTICE.md',original);
 await f.file('prototypes/surface-shell-a-b/public/licenses/vendor/README.md',original);
 await f.file('docs/guide.md','[Local evidence](../output/test.json)');
 await preparePublicSource(f.repository,f.destination);
 for(const file of ['docs/NOTICE.md','prototypes/surface-shell-a-b/public/licenses/vendor/README.md']) {
  assert.equal(await readFile(path.join(f.destination,file),'utf8'),original);
 }
 assert.match(await readFile(path.join(f.destination,'docs/guide.md'),'utf8'),/lokaler Beleg/);
});

test('public distribution removes personal implementations and Remote service; local source stays byte-identical',async t=>{
 const f=await fixture(t),app='prototypes/surface-shell-a-b';
 const {publicAdapters,personalOnlyFiles}=await import('./public-distribution.mjs');
 for(const [target,source] of Object.entries(publicAdapters)){
  await f.file(app+'/'+target,'personal adapter');
  await f.file(app+'/distribution/public/'+source,await readFile(new URL('../'+app+'/distribution/public/'+source,import.meta.url),'utf8'));
 }
 for(const file of personalOnlyFiles)await f.file(app+'/'+file,'personal implementation');
 await f.file(app+'/distribution/public/RELEASE.md','public build guide');
 await f.file('services/live-canvas/package.json','private service fixture');
 await f.file(app+'/viewer/index.html','private participant fixture');
 await f.file(app+'/public/apps/lerndeck.svg','synthetic icon');
 await f.file(app+'/src-tauri/tauri.conf.json',JSON.stringify({plugins:{updater:{endpoints:['https://private-fixture.invalid/latest.json'],pubkey:'synthetic-public-key'}},bundle:{createUpdaterArtifacts:true}}));
 await f.file(app+'/src-tauri/capabilities/default.json',JSON.stringify({remote:{urls:['http://127.0.0.1:49317/*','http://127.0.0.1:5173/*']}}));
 await f.file(app+'/public/licenses/tafelraum/provenance.json',JSON.stringify({assets:[{source:app+'/public/apps/lerndeck.svg'},{source:'core.svg'}]}));
 await f.file(app+'/package.json',JSON.stringify({scripts:{test:'node --test distribution.test.mjs personal-ai-key.test.mjs', 'test:live':'node --test src/live/live-host.test.ts core.test.ts','build:live':'private-viewer-build'}}));
 for(const file of ['distribution/desktop-channels.json','src-tauri/tauri.public-release.conf.json','src-tauri/tauri.windows.conf.json'])await f.file(app+'/'+file,await readFile(new URL('../'+app+'/'+file,import.meta.url),'utf8'));
 const report=await preparePublicSource(f.repository,f.destination);
 const read=async file=>JSON.parse(await readFile(path.join(f.destination,app,file),'utf8'));
 assert.deepEqual(await read('distribution.json'),{schemaVersion:1,profile:'public',officialUpdates:false,embeddedApps:[],remoteCanvas:false});
 assert.equal((await read('src-tauri/tauri.conf.json')).plugins.updater,undefined);
 assert.equal((await read('src-tauri/tauri.conf.json')).bundle.createUpdaterArtifacts,false);
 assert.equal((await read('package.json')).scripts.test,'node --test distribution.test.mjs');
 assert.equal((await read('package.json')).scripts['test:live'],'node --test core.test.ts');
 assert.equal((await read('package.json')).scripts['build:live'],undefined);
 assert.deepEqual((await read('public/licenses/tafelraum/provenance.json')).assets,[{source:'core.svg'}]);
 for(const file of personalOnlyFiles)await assert.rejects(access(path.join(f.destination,app,file)),{code:'ENOENT'});
 await assert.rejects(access(path.join(f.destination,'services/live-canvas')),{code:'ENOENT'});
 assert.equal(await readFile(path.join(f.repository,app,'personal-ai-key.mjs'),'utf8'),'personal implementation');
 assert.equal(await readFile(path.join(f.repository,app,'distribution.json'),'utf8'),'personal adapter');
 assert.equal(report.distributionProfile.profile,'public');
 const {checkDistribution}=await import('./check-distribution.mjs');
 assert.equal((await checkDistribution(f.destination)).profile,'public');
 await writeFile(path.join(f.destination,app,'personal-ai-key.mjs'),'accidental private implementation');
 await assert.rejects(checkDistribution(f.destination),/Personal component present/);
});

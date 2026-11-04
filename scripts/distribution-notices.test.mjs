import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,cp,rm,copyFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkWebLicenseNotices} from './check-web-license-notices.mjs';
import {prepareRuntimeNotices} from './prepare-runtime-notices.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
 const root=await mkdtemp(path.join(tmpdir(),'tafelraum-notices-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const file=async(relative,body)=>{
  const target=path.join(root,relative);await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,typeof body==='string'?body:JSON.stringify(body));
 };
 return {root,file};
}
async function webFixture(t) {
 const f=await fixture(t);
 const notices=['excalidraw/LICENSE','fluent-system-icons/LICENSE','excalidraw/fonts/Assistant/OFL.txt'];
 const manifest={schemaVersion:1,packages:{'@excalidraw/excalidraw':'1.0.0','@fluentui/svg-icons':'2.0.0'},
  files:notices.map(file=>({file,sha256:hash('Original '+file)})),
  families:[{name:'Assistant',noticeFiles:[notices[2]]}],fonts:[{file:'Assistant/regular.woff2',sha256:hash('original font')}]};
 for(const [name,version] of Object.entries(manifest.packages)) await f.file('node_modules/'+name+'/package.json',{version});
 for(const file of notices) await f.file('public/licenses/'+file,'Original '+file);
 await f.file('public/licenses/web-provenance.json',manifest);
 await f.file('node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/regular.woff2','original font');
 for(const destination of ['dist','dist-live']) {
  await cp(path.join(f.root,'public/licenses'),path.join(f.root,destination,'licenses'),{recursive:true});
  await f.file(destination+'/fonts/Assistant/regular.woff2','original font');
 }
 return {...f,manifest};
}

test('web notices reach both builds; deleted participant text fails even with correct source evidence',async t=>{
 const f=await webFixture(t);
 assert.equal((await checkWebLicenseNotices(f.root)).families,1);
 for(const built of ['app','live']) assert.equal((await checkWebLicenseNotices(f.root,{built})).bundledFonts,1);
 await rm(path.join(f.root,'dist-live/licenses/excalidraw/fonts/Assistant/OFL.txt'));
 await assert.rejects(checkWebLicenseNotices(f.root,{built:'live'}),{code:'ENOENT'});
});

test('font/package changes cannot reuse older notice evidence or an unrelated family notice',async t=>{
 const f=await webFixture(t);
 await f.file('node_modules/@excalidraw/excalidraw/package.json',{version:'1.0.1'});
 await assert.rejects(checkWebLicenseNotices(f.root),/changed: review/);
 await f.file('node_modules/@excalidraw/excalidraw/package.json',{version:'1.0.0'});
 await f.file('node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/new.woff2','new font');
 await assert.rejects(checkWebLicenseNotices(f.root),/Font evidence is incomplete/);
 await rm(path.join(f.root,'node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/new.woff2'));
 f.manifest.families[0].noticeFiles=['excalidraw/LICENSE'];
 await f.file('public/licenses/web-provenance.json',f.manifest);
 await assert.rejects(checkWebLicenseNotices(f.root),/Unassigned font notice/);
});

test('changed original fonts, altered notices and unrecorded bundled fonts are rejected',async t=>{
 const f=await webFixture(t);
 await f.file('node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/regular.woff2','changed font');
 await assert.rejects(checkWebLicenseNotices(f.root),/Font changed/);
 await f.file('node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant/regular.woff2','original font');
 await f.file('public/licenses/excalidraw/LICENSE','changed notice');
 await assert.rejects(checkWebLicenseNotices(f.root),/Notice changed/);
 await f.file('public/licenses/excalidraw/LICENSE','Original excalidraw/LICENSE');
 await f.file('dist/assets/unknown.woff2','unrecorded font');
 await assert.rejects(checkWebLicenseNotices(f.root,{built:'app'}),/Bundled font lacks evidence/);
});

test('Liberation source evidence must match both the exact font and the offered source files',async t=>{
 const f=await webFixture(t);
 await rm(path.join(f.root,'node_modules/@excalidraw/excalidraw/dist/prod/fonts/Assistant'),{recursive:true});
 const font={file:'Liberation/regular.woff2',sha256:hash('original font')};
 await f.file('node_modules/@excalidraw/excalidraw/dist/prod/fonts/'+font.file,'original font');
 f.manifest.fonts=[font];
 const prefix='excalidraw/fonts/Liberation/';
 f.manifest.files[2]={file:prefix+'License.txt',sha256:hash('synthetic notice')};
 await f.file('public/licenses/'+prefix+'License.txt','synthetic notice');
 const evidence={font,comparison:{outlineDifferences:[],hintProgramDifferences:[],cmapEqual:true,metricsEqual:true}};
 for(const [key,file] of [['sourceArchive','original.tar.gz'],['debianPatch','patch.diff.gz'],['descriptor','package.dsc']]) {
  evidence[key]={file,sha256:hash(file)};
  await f.file('public/licenses/'+prefix+'source/'+file,file);
  f.manifest.files.push({file:prefix+'source/'+file,sha256:hash(file)});
 }
 const proofFile=prefix+'source/SOURCE_EVIDENCE.json';
 const proofRow={file:proofFile,sha256:''};f.manifest.files.push(proofRow);
 f.manifest.families=[{name:'Liberation',noticeFiles:f.manifest.files.filter(row=>row.file.startsWith(prefix)).map(row=>row.file),sourceEvidenceFile:proofFile}];
 const save=async()=>{
  proofRow.sha256=hash(JSON.stringify(evidence));
  await f.file('public/licenses/'+proofFile,evidence);
  await f.file('public/licenses/web-provenance.json',f.manifest);
 };
 await save();await checkWebLicenseNotices(f.root);
 evidence.font={...font,sha256:hash('another font')};await save();
 await assert.rejects(checkWebLicenseNotices(f.root),/belongs to another font/);
 evidence.font=font;evidence.sourceArchive.sha256=hash('another source package');await save();
 await assert.rejects(checkWebLicenseNotices(f.root),/belongs to another source package/);
});

async function runtimeFixture(t) {
 const f=await fixture(t),resources=path.join(f.root,'generated-resources');
 await f.file('runtime-licenses/node/LICENSE','complete original Node license');
 await f.file('runtime-licenses/node/provenance.json',{version:process.version,sha256:hash('complete original Node license')});
 await f.file('office-import/runtime.json',{version:'1.0.0'});
 const files=['Resources/LICENSE','Resources/LICENSE.html','Resources/NOTICE'].map(file=>({path:file,sha256:hash('Original '+file)}));
 await f.file('runtime-licenses/libreoffice/provenance.json',{version:'1.0.0',files});
 for(const row of files) await f.file('generated-resources/runtime/libreoffice/LibreOffice.app/Contents/'+row.path,'Original '+row.path);
 await copyFile(process.execPath,path.join(resources,'runtime',process.platform==='win32'?'node.exe':'node'));
 return {...f,resources};
}

test('runtime preparation copies the complete Node license and retains original Office notices',async t=>{
 const f=await runtimeFixture(t);
 const result=await prepareRuntimeNotices(f.root,f.resources);
 assert.equal(result.node,process.version);
 assert.equal(await readFile(path.join(f.resources,'runtime/licenses/NODE-LICENSE'),'utf8'),'complete original Node license');
 assert.equal(result.officeNotices,3);
});

test('runtime version mismatch or missing Office notice stops before preparing license output',async t=>{
 const f=await runtimeFixture(t);
 await f.file('runtime-licenses/node/provenance.json',{version:'v0.0.0',sha256:hash('complete original Node license')});
 await assert.rejects(prepareRuntimeNotices(f.root,f.resources),/Node changed/);
 await assert.rejects(access(path.join(f.resources,'runtime/licenses')),{code:'ENOENT'});
 await f.file('runtime-licenses/node/provenance.json',{version:process.version,sha256:hash('complete original Node license')});
 await rm(path.join(f.resources,'runtime/libreoffice/LibreOffice.app/Contents/Resources/NOTICE'));
 await assert.rejects(prepareRuntimeNotices(f.root,f.resources),{code:'ENOENT'});
 await assert.rejects(access(path.join(f.resources,'runtime/licenses')),{code:'ENOENT'});
});

test('teacher build must contain the complete local runtime font set, not only CSS font subsets',async t=>{
 const f=await webFixture(t);
 assert.equal((await checkWebLicenseNotices(f.root,{built:'app'})).bundledFonts,1);
 await rm(path.join(f.root,'dist/fonts/Assistant/regular.woff2'));
 await assert.rejects(checkWebLicenseNotices(f.root,{built:'app'}),{code:'ENOENT'});
});

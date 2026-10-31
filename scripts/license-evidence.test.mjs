import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {auditDependencyLicenses} from './audit-dependency-licenses.mjs';
import {checkSourceDistribution} from './check-source-distribution.mjs';
import {checkPdfLicenseNotices} from './check-pdf-license-notices.mjs';

async function fixture(t) {
 const root=await mkdtemp(path.join(tmpdir(),'tafelraum-license-evidence-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const file=async(name,body)=>{await mkdir(path.dirname(path.join(root,name)),{recursive:true});await writeFile(path.join(root,name),typeof body==='string'?body:JSON.stringify(body));};
 return {root,file};
}

test('inventory retains missing license expressions and version mismatches without leaking cache paths',async t=>{
 const f=await fixture(t);
 for(const project of ['prototypes/surface-shell-a-b','services/live-canvas']) await f.file(project+'/package-lock.json',{packages:{'':{},'node_modules/example':{version:'1.0',license:'MIT'},'node_modules/unknown':{version:'2.0',optional:true}}});
 await f.file('prototypes/surface-shell-a-b/node_modules/example/package.json',{version:'1.0'});
 await f.file('prototypes/surface-shell-a-b/node_modules/example/LICENSE','Synthetic license evidence');
 await f.file('prototypes/surface-shell-a-b/node_modules/unknown/package.json',{version:'3.0',license:'DO-NOT-USE'});
 await f.file('cache/crate/Cargo.toml','synthetic metadata');
 await f.file('cache/crate/LICENSE','Synthetic crate license');
 const metadata={packages:[{name:'example-crate',id:'registry-example',version:'1.0',source:'registry+https://example.invalid',license:'MPL-2.0',manifest_path:path.join(f.root,'cache/crate/Cargo.toml')},{name:'own',source:null}]};
 const report=await auditDependencyLicenses(f.root,metadata);
 assert.equal(report.summary.npm,4);assert.equal(report.summary.cargo,1);
 assert.equal(report.summary.missingLicenseExpressions,2);
 assert.equal(report.npm.find(row=>row.name==='example').documents.length,1);
 assert.equal(report.npm.find(row=>row.name==='unknown').installedVersionMatches,false);
 assert.equal(report.cargo[0].documents.length,1);
 assert.ok(!JSON.stringify(report).includes(f.root));
 assert.ok(!JSON.stringify(report).includes('DO-NOT-USE'));
 assert.deepEqual(await auditDependencyLicenses(f.root,metadata),report);
});

async function pdfFixture(t) {
 const f=await fixture(t);
 await f.file('node_modules/pdfjs-dist/package.json',{version:'1.0.0'});
 const files=[];
 for(const source of ['LICENSE','wasm/LICENSE_PART']) {
  const text='Synthetic '+source;
  await f.file('node_modules/pdfjs-dist/'+source,text);
  await f.file('public/licenses/pdfjs-dist/'+path.basename(source),text);
  files.push({source,file:path.basename(source),sha256:createHash('sha256').update(text).digest('hex')});
 }
 await f.file('public/licenses/pdfjs-dist/provenance.json',{package:'pdfjs-dist',version:'1.0.0',files});
 return f;
}

test('notice guard checks source and built copies and rejects changed/missing notices',async t=>{
 const f=await pdfFixture(t);
 assert.equal((await checkPdfLicenseNotices(f.root)).files,2);
 await cp(path.join(f.root,'public'),path.join(f.root,'dist'),{recursive:true});
 assert.equal((await checkPdfLicenseNotices(f.root,{built:true})).files,2);
 await f.file('dist/licenses/pdfjs-dist/LICENSE','altered');
 await assert.rejects(checkPdfLicenseNotices(f.root,{built:true}),/changed shipped notice/);
 await rm(path.join(f.root,'public/licenses/pdfjs-dist/LICENSE_PART'));
 await assert.rejects(checkPdfLicenseNotices(f.root),{code:'ENOENT'});
});

test('notice guard fails on dependency upgrade or incomplete manifest before distribution',async t=>{
 const f=await pdfFixture(t);
 await f.file('node_modules/pdfjs-dist/package.json',{version:'2.0.0'});
 await assert.rejects(checkPdfLicenseNotices(f.root),/version changed/);
 await f.file('node_modules/pdfjs-dist/package.json',{version:'1.0.0'});
 const name=path.join(f.root,'public/licenses/pdfjs-dist/provenance.json');
 const manifest=JSON.parse(await readFile(name,'utf8'));manifest.files.pop();await writeFile(name,JSON.stringify(manifest));
 await assert.rejects(checkPdfLicenseNotices(f.root),/Incomplete/);
});

for (const script of ['audit-dependency-licenses.mjs','check-pdf-license-notices.mjs','prepare-public-source.mjs','check-web-license-notices.mjs','prepare-runtime-notices.mjs','check-project-license.mjs','check-source-distribution.mjs']) {
 test(`${script} explains CLI usage without performing work`,async t=>{
  const f=await fixture(t);
  const output=execFileSync(process.execPath,[fileURLToPath(new URL(script,import.meta.url)),'--help'],{cwd:f.root,encoding:'utf8'});
  assert.match(output,new RegExp(script.replaceAll('.','\\.')));
  assert.match(output,/node scripts\//);
  const {readdir}=await import('node:fs/promises');
  assert.deepEqual(await readdir(f.root),[],'help must not write reports, snapshots or configuration');
 });
}


test('source-distribution evidence rejects changed original files without modifying them',async t=>{
 const f=await fixture(t);const text='Synthetic original notice';
 await f.file('vendor/NOTICE',text);
 await f.file('third-party/source-distribution.json',{schemaVersion:1,groups:[{id:'fixture',files:[{file:'vendor/NOTICE',sha256:createHash('sha256').update(text).digest('hex')}]}]});
 assert.equal((await checkSourceDistribution(f.root)).files,1);
 await f.file('vendor/NOTICE','unreviewed change');
 await assert.rejects(checkSourceDistribution(f.root),/Source-distribution file changed/);
 assert.equal(await readFile(path.join(f.root,'vendor/NOTICE'),'utf8'),'unreviewed change');
});

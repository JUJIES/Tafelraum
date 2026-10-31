import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {checkProjectLicense} from './check-project-license.mjs';

async function fixture(t) {
 const root=await mkdtemp(path.join(tmpdir(),'tafelraum-project-license-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const file=async(name,body)=>{
  const target=path.join(root,name);await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,typeof body==='string'?body:JSON.stringify(body));
 };
 const app='prototypes/surface-shell-a-b',publicRoot=app+'/public/licenses/tafelraum';
 const license='Synthetic MIT License with Commons Clause License Condition v1.0\nLicensor: Fixture\nthe License does not grant to you, the right to Sell the Software.';
 await file('LICENSE',license);await file(publicRoot+'/LICENSE',license);
 for(const project of [app,'services/live-canvas','services/mobile-capture']) await file(project+'/package.json',{license:'SEE LICENSE IN ../../LICENSE'});
 await file(app+'/src-tauri/Cargo.toml','[package]\nlicense-file = "../../../LICENSE"\n');
 await file('assets/icon.svg','synthetic icon');
 const digest=text=>createHash('sha256').update(text).digest('hex');
 await file(publicRoot+'/provenance.json',{schemaVersion:1,licenseName:'MIT with Commons Clause 1.0',licensor:'Fixture',
  license:{source:'LICENSE',file:'LICENSE',sha256:digest(license)},
  assets:[{source:'assets/icon.svg',sha256:digest('synthetic icon'),provenance:'owner-attested-imagegen'}]});
 for(const build of ['dist','dist-live']) await cp(path.join(root,app,'public'),path.join(root,app,build),{recursive:true});
 return {root,file,app,publicRoot};
}

test('combined project license reaches both web builds and changed root text invalidates its evidence',async t=>{
 const f=await fixture(t);
 assert.equal((await checkProjectLicense(f.root)).assets,1);
 for(const built of ['app','live']) assert.equal((await checkProjectLicense(f.root,{built})).built,built);
 await f.file('LICENSE','MIT only');
 await assert.rejects(checkProjectLicense(f.root),/Project license evidence changed/);
});

test('missing distributed conditions and plain-MIT package metadata cannot silently pass',async t=>{
 const f=await fixture(t);
 await rm(path.join(f.root,f.app,'dist-live/licenses/tafelraum/LICENSE'));
 await assert.rejects(checkProjectLicense(f.root,{built:'live'}),{code:'ENOENT'});
 await f.file('services/live-canvas/package.json',{license:'MIT'});
 await assert.rejects(checkProjectLicense(f.root),/Misleading project license metadata/);
});

test('a replaced project asset cannot keep the previous provenance record',async t=>{
 const f=await fixture(t);
 await f.file('assets/icon.svg','unreviewed replacement');
 await assert.rejects(checkProjectLicense(f.root),/Project asset changed/);
});

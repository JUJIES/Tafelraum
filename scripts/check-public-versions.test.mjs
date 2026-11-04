import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePublicVersions,checkPublicVersions} from './check-public-versions.mjs';
import {fileURLToPath} from 'node:url';
const fixture=()=>({pkg:{version:'1.2.3'},lock:{version:'1.2.3',packages:{'':{version:'1.2.3'}}},
  tauri:{version:'1.2.3'},cargo:'[package]\nname = "tafelraum"\nversion = "1.2.3"',
  cargoLock:'[[package]]\nname = "other"\nversion = "2.0.0"\n[[package]]\nname = "tafelraum"\nversion = "1.2.3"',notes:{'1.2.3':['Change']}});
test('source versions and notes are aligned',async()=>{
  assert.equal(validatePublicVersions(fixture()),'1.2.3');
  await checkPublicVersions(fileURLToPath(new URL('../',import.meta.url)));
});
test('each version surface and missing notes are independently rejected',()=>{
  for(const change of [f=>f.lock.version='1.2.2',f=>f.lock.packages[''].version='1.2.2',
    f=>f.tauri.version='1.2.2',f=>f.cargo=f.cargo.replace('1.2.3','1.2.2'),
    f=>f.cargoLock=f.cargoLock.replace('1.2.3','1.2.2'),f=>delete f.notes['1.2.3']]){
    const f=fixture();change(f);assert.throws(()=>validatePublicVersions(f));
  }
});

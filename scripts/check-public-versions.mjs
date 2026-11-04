import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function validatePublicVersions({pkg,lock,tauri,cargo,cargoLock,notes}) {
  const version=pkg.version;
  assert.match(version,/^\d+\.\d+\.\d+$/);
  assert.equal(lock.version,version,'npm lock root version drift');
  assert.equal(lock.packages[''].version,version,'npm lock package version drift');
  assert.equal(tauri.version,version,'Tauri version drift');
  const ownCargoVersion=cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
  assert.equal(ownCargoVersion,version,'Cargo package version drift');
  const ownLock=cargoLock.split('[[package]]').find(s=>/^name\s*=\s*"tafelraum"/m.test(s));
  assert.equal(ownLock?.match(/^version\s*=\s*"([^"]+)"/m)?.[1],version,'Cargo lock version drift');
  assert.ok(Array.isArray(notes[version])&&notes[version].length,'Versioned release notes missing');
  return version;
}
export async function checkPublicVersions(root){
  const app=path.join(root,'prototypes/surface-shell-a-b');
  const text=relative=>readFile(path.join(app,relative),'utf8');
  const json=async relative=>JSON.parse(await text(relative));
  return validatePublicVersions({pkg:await json('package.json'),lock:await json('package-lock.json'),
    tauri:await json('src-tauri/tauri.conf.json'),cargo:await text('src-tauri/Cargo.toml'),
    cargoLock:await text('src-tauri/Cargo.lock'),notes:await json('release-notes.json')});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log(JSON.stringify({version:await checkPublicVersions(fileURLToPath(new URL('../',import.meta.url)))}));
}

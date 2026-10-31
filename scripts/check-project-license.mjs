// Consistency/evidence check only; no legal compatibility or ownership approval.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {hasRemoteDistribution} from './distribution-projects.mjs';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const packages=['prototypes/surface-shell-a-b','services/live-canvas','services/mobile-capture'];
function safeRelative(file) {
 assert.ok(typeof file==='string' && file && !file.includes('\\') && !file.includes(':') && !path.posix.isAbsolute(file)
  && !file.split('/').some(part=>!part || part==='.' || part==='..'),'Unsafe project evidence path');
 return file;
}

export async function checkProjectLicense(repository,{built=null}={}) {
 assert.ok(built===null || built==='app' || built==='live','Expected built target app or live');
 const remote=await hasRemoteDistribution(repository);
 const app=path.join(repository,packages[0]);
 const publicRoot=path.join(app,'public/licenses/tafelraum');
 const manifestBytes=await readFile(path.join(publicRoot,'provenance.json'));
 const manifest=JSON.parse(manifestBytes);
 assert.equal(manifest.schemaVersion,1,'Unknown project license evidence');
 assert.equal(manifest.licenseName,'MIT with Commons Clause 1.0','Project conditions changed: review required');
 assert.equal(manifest.license.source,'LICENSE');assert.equal(manifest.license.file,'LICENSE');
 const license=await readFile(path.join(repository,'LICENSE'));
 assert.equal(hash(license),manifest.license.sha256,'Project license evidence changed');
 const normalized=license.toString('utf8').replace(/\s+/g,' ');
 assert.ok(normalized.includes('License Condition v1.0') && normalized.includes('MIT License')
  && normalized.includes('the License does not grant to you, the right to Sell the Software.'),'Missing combined license conditions');
 assert.ok(normalized.includes(`Licensor: ${manifest.licensor}`),'Project licensor differs');
 assert.deepEqual(await readFile(path.join(publicRoot,'LICENSE')),license,'Public project license differs');
 for(const project of packages.filter(project=>project!=='services/live-canvas' || remote)) {
  const pkg=JSON.parse(await readFile(path.join(repository,project,'package.json'),'utf8'));
  assert.equal(pkg.license,'SEE LICENSE IN ../../LICENSE',`Misleading project license metadata: ${project}`);
 }
 const cargo=await readFile(path.join(app,'src-tauri/Cargo.toml'),'utf8');
 assert.match(cargo,/^license-file\s*=\s*"\.\.\/\.\.\/\.\.\/LICENSE"\s*$/m,'Native project license pointer differs');
 assert.ok(Array.isArray(manifest.assets) && manifest.assets.length>0,'Missing own-asset evidence');
 const seen=new Set();
 for(const asset of manifest.assets) {
  const source=safeRelative(asset.source);
  assert.ok(!seen.has(source),'Duplicate own-asset evidence');seen.add(source);
  assert.ok(['owner-attested-imagegen','recorded-imagegen-generation'].includes(asset.provenance),'Unclassified own-asset evidence');
  assert.equal(hash(await readFile(path.join(repository,source))),asset.sha256,`Project asset changed: ${source}`);
 }
 if(built) {
  const destination=path.join(app,built==='app'?'dist':'dist-live','licenses/tafelraum');
  assert.deepEqual(await readFile(path.join(destination,'LICENSE')),license,'Built project license missing/changed');
  assert.deepEqual(await readFile(path.join(destination,'provenance.json')),manifestBytes,'Built project evidence differs');
 }
 return {license:manifest.licenseName,licensor:manifest.licensor,assets:seen.size,built};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const args=process.argv.slice(2);
 if(args.length===1 && args[0]==='--help') {
  console.log('node scripts/check-project-license.mjs [--built app|live]\nRead-only project license, package pointers and declared asset hashes; optionally compare actual build copies. No legal approval.');
  process.exit(0);
 }
 if(args.length && !(args.length===2 && args[0]==='--built' && ['app','live'].includes(args[1]))) throw Error('Expected --built app|live, --help or no arguments');
 console.log(JSON.stringify(await checkProjectLicense(fileURLToPath(new URL('../',import.meta.url)),{built:args[1]??null})));
}

// Source-file evidence, not a legal approval or a binary-release inventory.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export async function checkSourceDistribution(repository) {
 const manifest=JSON.parse(await readFile(path.join(repository,'third-party/source-distribution.json'),'utf8'));
 assert.equal(manifest.schemaVersion,1,'Unknown source-distribution evidence');
 const seen=new Set();
 for(const group of manifest.groups) for(const row of group.files) {
  assert.ok(typeof row.file==='string' && !row.file.includes('\\') && !row.file.includes(':')
   && !row.file.startsWith('/') && !row.file.split('/').some(part=>!part || part==='.' || part==='..'),'Unsafe third-party evidence path');
  assert.ok(!seen.has(row.file),'Duplicate third-party evidence');seen.add(row.file);
  const bytes=await readFile(path.join(repository,row.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha256,`Source-distribution file changed: ${row.file}`);
 }
 return {scope:'source-only',groups:manifest.groups.length,files:seen.size};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 if(process.argv.length===3 && process.argv[2]==='--help') {
  console.log('node scripts/check-source-distribution.mjs\nRead-only hashes of the explicitly recorded third-party files in this source repository. No download, legal approval or binary-release coverage.');
 } else {
  if(process.argv.length!==2) throw Error('Expected no arguments or --help');
  console.log(JSON.stringify(await checkSourceDistribution(fileURLToPath(new URL('../',import.meta.url)))));
 }
}

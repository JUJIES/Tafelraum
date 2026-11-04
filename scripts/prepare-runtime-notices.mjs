// Runs against generated desktop resources, never an installed app or profile.
import assert from 'node:assert/strict';
import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const run=promisify(execFile);
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function prepareRuntimeNotices(appRoot,resources) {
 const evidence=path.join(appRoot,'runtime-licenses');
 const node=JSON.parse(await readFile(path.join(evidence,'node/provenance.json'),'utf8'));
 const version=(await run(path.join(resources,'runtime',process.platform==='win32'?'node.exe':'node'),['--version'],{timeout:10000})).stdout.trim();
 assert.equal(version,node.version,'Node changed: collect its original complete LICENSE before packaging');
 const nodeLicense=path.join(evidence,'node/LICENSE');
 assert.equal(hash(await readFile(nodeLicense)),node.sha256,'Node LICENSE evidence changed');
 const office=JSON.parse(await readFile(path.join(evidence,'libreoffice/provenance.json'),'utf8'));
 const spec=JSON.parse(await readFile(path.join(appRoot,'office-import/runtime.json'),'utf8'));
 assert.equal(office.version,spec.version,'LibreOffice changed: refresh notice evidence');
 const officeRoot=path.join(resources,'runtime/libreoffice/LibreOffice.app/Contents');
 assert.deepEqual(office.files.map(row=>row.path).sort(),['Resources/LICENSE','Resources/LICENSE.html','Resources/NOTICE'],'Incomplete LibreOffice root notice set');
 for(const row of office.files) assert.equal(hash(await readFile(path.join(officeRoot,row.path))),row.sha256,`LibreOffice notice missing/changed: ${row.path}`);
 const destination=path.join(resources,'runtime/licenses');
 await mkdir(destination,{recursive:true});
 await copyFile(nodeLicense,path.join(destination,'NODE-LICENSE'));
 await copyFile(path.join(evidence,'node/provenance.json'),path.join(destination,'node-provenance.json'));
 await copyFile(path.join(evidence,'libreoffice/provenance.json'),path.join(destination,'libreoffice-provenance.json'));
 assert.equal(hash(await readFile(path.join(destination,'NODE-LICENSE'))),node.sha256,'Packaged Node LICENSE differs');
 return {node:version,libreoffice:office.version,officeNotices:office.files.length};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 const args=process.argv.slice(2);
 if(args.length===1 && args[0]==='--help') {
  console.log('node scripts/prepare-runtime-notices.mjs <generated-resources>\nChecks Node/LibreOffice versions and original root notices, then copies the full Node LICENSE into those build resources. Never point at an installed app.');
  process.exit(0);
 }
 if(args.length!==1) throw Error('Expected generated desktop-resources directory or --help');
 console.log(JSON.stringify(await prepareRuntimeNotices(fileURLToPath(new URL('../prototypes/surface-shell-a-b',import.meta.url)),path.resolve(args[0]))));
}

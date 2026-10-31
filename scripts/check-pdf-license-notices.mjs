// Verify original notices against the installed PDF.js version, before and after build.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function checkPdfLicenseNotices(appRoot,{built=false}={}) {
 const dependency=path.join(appRoot,'node_modules/pdfjs-dist');
 const notices=path.join(appRoot,built?'dist':'public','licenses/pdfjs-dist');
 const manifest=JSON.parse(await readFile(path.join(notices,'provenance.json'),'utf8'));
 const pkg=JSON.parse(await readFile(path.join(dependency,'package.json'),'utf8'));
 assert.equal(manifest.package,'pdfjs-dist','Unexpected notice package');
 assert.equal(manifest.version,pkg.version,'PDF.js version changed: review and refresh original notices');
 const expected=['LICENSE',...(await readdir(path.join(dependency,'wasm'))).filter(name=>/^LICENSE(?:_|$)/.test(name)).map(name=>'wasm/'+name)].sort();
 assert.deepEqual(manifest.files.map(row=>row.source).sort(),expected,'Incomplete PDF.js/WASM notice set');
 for(const row of manifest.files) {
  assert.equal(row.file,path.basename(row.source),'Unsafe notice destination');
  assert.match(row.sha256,/^[a-f0-9]{64}$/,'Invalid notice digest');
  assert.equal(hash(await readFile(path.join(dependency,row.source))),row.sha256,`Upstream notice changed: ${row.source}`);
  assert.equal(hash(await readFile(path.join(notices,row.file))),row.sha256,`Missing/changed shipped notice: ${row.file}`);
 }
 return {version:pkg.version,files:expected.length,built};
}

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 if(process.argv.length===3 && process.argv[2]==='--help') {
  console.log('node scripts/check-pdf-license-notices.mjs [--built]\nChecks shipped PDF.js notices against installed originals (public/; --built checks dist/). Read-only; also runs during npm run build.');
  process.exit(0);
 }
 if(process.argv.slice(2).some(arg=>arg!=='--built')) throw Error('node scripts/check-pdf-license-notices.mjs [--built]');
 const result=await checkPdfLicenseNotices(fileURLToPath(new URL('../prototypes/surface-shell-a-b',import.meta.url)),{built:process.argv.includes('--built')});
 console.log(`PDF.js ${result.version}: ${result.files} Original-Lizenztexte geprüft (${result.built?'dist':'public'}).`);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const run=promisify(execFile),cli=fileURLToPath(new URL('./tafelraum-canvas-agent.mjs',import.meta.url));

test('canvas CLI help works offline and never needs an installed app',async()=>{
 for(const action of ['--help','help']){
  const result=await run(process.execPath,[cli,action,'--url','http://127.0.0.1:1'],{timeout:5000});
  assert.match(result.stdout,/sessions \| inspect/);assert.match(result.stdout,/--request-id/);assert.equal(result.stderr,'');
 }
});

test('canvas CLI validates a command locally before any connection and rejects unsafe targets',async t=>{
 const directory=await mkdtemp(path.join(tmpdir(),'tafelraum-canvas-cli-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const file=path.join(directory,'command.json');
 const command={type:'apply',expectedRevision:'example:1',operations:[{type:'text',key:'title',x:0,y:0,text:'Test'}]};
 await writeFile(file,JSON.stringify(command));
 const good=await run(process.execPath,[cli,'validate','--file',file,'--url','http://127.0.0.1:1'],{timeout:5000});
 assert.equal(JSON.parse(good.stdout).operations[0].text,'Test');
 await writeFile(file,JSON.stringify({...command,operations:[{type:'execute',code:'forbidden'}]}));
 await assert.rejects(run(process.execPath,[cli,'validate','--file',file,'--url','http://127.0.0.1:1'],{timeout:5000}),error=>error.code===1&&!error.stderr.includes('fetch failed'));
 await assert.rejects(run(process.execPath,[cli,'sessions','--url','https://example.invalid'],{timeout:5000}),error=>error.code===1&&error.stderr.includes('lokale Tafelraum-Adresse'));
});

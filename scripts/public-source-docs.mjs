// Apply an explicit documentation selection to a new export only.
import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,rm,mkdir} from 'node:fs/promises';
import path from 'node:path';

function relative(file) {
 assert.ok(typeof file==='string' && file.startsWith('docs/') && !file.includes('\\')
  && !file.split('/').some(part=>!part || part==='.' || part==='..'),'Unsafe public documentation path');
 return file;
}
export async function selectPublicDocs(destination,{distributionOmissions=[]}={}) {
 let policy;
 try {policy=JSON.parse(await readFile(path.join(destination,'public-source.json'),'utf8'));}
 catch(error) {if(error.code==='ENOENT') return {profile:null,replaced:[],omitted:[],localEvidenceLinks:[]};throw error;}
 assert.equal(policy.schemaVersion,1,'Unknown public documentation policy');
 const result={profile:'public-source.json',replaced:[],omitted:[],localEvidenceLinks:[]};
 for(const item of policy.omit) {
  const file=relative(item);await rm(path.join(destination,file),{recursive:true,force:true});result.omitted.push(file);
 }
 for(const [target,source] of Object.entries(policy.replace)) {
  relative(target);relative(source);
  assert.ok(target.endsWith('.md') && source.startsWith('docs/public/') && source.endsWith('.md'),'Only reviewed Markdown templates may replace documentation');
  const bytes=await readFile(path.join(destination,source));
  await mkdir(path.dirname(path.join(destination,target)),{recursive:true});
  await writeFile(path.join(destination,target),bytes);result.replaced.push({target,source});
 }
 async function visit(directory='') {
  for(const entry of await readdir(path.join(destination,directory),{withFileTypes:true})) {
   const file=directory ? directory+'/'+entry.name : entry.name;
   if(entry.isDirectory()) {await visit(file);continue;}
   if(!entry.isFile() || !file.endsWith('.md')) continue;
   // Original third-party texts are immutable, even if they contain local links.
   if(file.split('/').some(part=>['licenses','runtime-licenses'].includes(part))
    || /(?:^|\/)(?:LICENSE|COPYING|NOTICE)(?:\.md)?$/i.test(file)) continue;
   const original=await readFile(path.join(destination,file),'utf8');
   const parts=original.split(/(```[\s\S]*?```)/g);
   for(let i=0;i<parts.length;i+=2) {
    parts[i]=parts[i].replace(/(!?)\[([^\]]+)\]\(([^\s)]+)\)/g,(link,image,label,href)=>{
     const raw=href.replace(/^<|>$/g,'').split('#')[0];
     if(!raw || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('/')) return link;
     const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),decodeURIComponent(raw)));
     const omitted=policy.omit.some(prefix=>target===prefix || target.startsWith(prefix+'/'));
     const omittedComponent=distributionOmissions.some(prefix=>target===prefix || target.startsWith(prefix+'/'));
     const privateEvidence=['data/','test-materials/','output/'].some(prefix=>target.startsWith(prefix));
     if(!omitted && !privateEvidence && !omittedComponent) return link;
     // These links refer to intentionally absent private material, never source code.
     if(policy.replace[target]) return link;
     result.localEvidenceLinks.push({file,reason:omitted?'private lesson example':'local test evidence'});
     return label+(omittedComponent?' (persönlicher Bestandteil, nicht im öffentlichen Quellstand)':' (lokaler Beleg, nicht im öffentlichen Quellstand)');
    });
   }
   const updated=parts.join('');
   if(updated!==original) await writeFile(path.join(destination,file),updated);
  }
 }
 await visit();return result;
}

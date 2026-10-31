// Explicitly scoped package author refresh. Optional installation only in marked QA archive.
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildFilmController,buildSingleVideoPackage,renderWikiController,refreshControllerAssets} from './glt-playback-controller/build.mjs';
import {checkInteractiveMaterial} from './check-interactive-material.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),base=path.join(root,'output/glt-html-integration');
const archiveRoot=path.join(base,'test-archive'),archive=JSON.parse(await readFile(path.join(archiveRoot,'archive.json'),'utf8'));
if(archive.testPurpose!=='glt-html-integration'||archive.catalog.lessons.some(x=>!x.id.startsWith('test-glt-')))throw Error('Not the isolated gLT archive.');
const staged=id=>path.join(root,'output/interactive-materials',id);
await buildFilmController(staged('glt-lernszenen-player'));
const wiki=staged('glt-hattie-wiki'),old=await readFile(path.join(wiki,'controller.html'),'utf8');
const config=JSON.parse(old.match(/<script id="controller-config" type="application\/json">([\s\S]*?)<\/script>/)[1]);
await refreshControllerAssets(wiki);
await writeFile(path.join(wiki,'controller.html'),renderWikiController(JSON.parse(await readFile(path.join(wiki,'project.json'),'utf8')),config.scenes));
const {unitRoot}=JSON.parse(await readFile(path.join(base,'installation.json'),'utf8'));
await buildSingleVideoPackage(staged('glt-hattie-mittag'),{title:'Die Hattie-Studie (2025)',credit:'Michael Mittag · Erklärvideo',
  sourceVideo:path.join(unitRoot,'02_hattie-einfuehrung/media/hattie-studie-2025-michael-mittag.mp4'),
  poster:path.join(base,'mittag/poster.jpg'),logo:path.join(staged('glt-lernszenen-player'),'assets/be-teil-group.svg')});
const ids=['glt-lernszenen-player','glt-hattie-wiki','glt-hattie-mittag'];
for(const id of ids)await checkInteractiveMaterial({sourceDirectory:staged(id)});
console.log('Three staged controllers validated.');
if(process.argv.includes('--install-test')){
  const stamp=new Date().toISOString().replaceAll(':','-'),history=path.join(archiveRoot,'.history/glt-controls',stamp);
  const files=['controller.html','controller-surface.js','controller-surface.css','LUCIDE_LICENSE.txt'];
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),proof=[];
  for(const lesson of archive.catalog.lessons){
    for(const id of ids){
      if(lesson.id!==`test-${id}`&&lesson.id!=='test-glt-einheit-1-komplett')continue;
      const dest=path.join(archiveRoot,lesson.materialBasis.archivePath,'interaktiv',id);
      try{await readFile(path.join(dest,'manifest.json'));}catch(error){if(error.code==='ENOENT')continue;throw error;}
      const manifest=JSON.parse(await readFile(path.join(dest,'manifest.json'),'utf8'));
      if(manifest.id!==id||manifest.playback?.protocol!=='room-v1')throw Error('Unexpected installed package.');
      for(const file of [...files,...(id==='glt-hattie-mittag'?['single-video.css']:[])]){
        const target=path.join(dest,file),bytes=await readFile(path.join(staged(id),file));let previous=null;
        try{previous=await readFile(target);}catch(error){if(error.code!=='ENOENT')throw error;}
        if(previous&&hash(previous)===hash(bytes))continue;
        if(previous){const saved=path.join(history,lesson.id,id,file);await mkdir(path.dirname(saved),{recursive:true});await copyFile(target,saved);}
        await copyFile(path.join(staged(id),file),target);proof.push({lessonId:lesson.id,id,file,before:previous?hash(previous):null,after:hash(bytes)});
      }
      await checkInteractiveMaterial({sourceDirectory:dest});
    }
  }
  await mkdir(history,{recursive:true});await writeFile(path.join(history,'changes.json'),JSON.stringify(proof,null,2)+'\n');
  console.log(`Updated ${proof.length} controller files only in marked test archive. History: ${history}`);
}

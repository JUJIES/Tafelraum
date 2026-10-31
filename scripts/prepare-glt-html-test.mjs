// Explicit source arguments; no discovery or access to the productive archive.
import {cp, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkInteractiveMaterial} from './check-interactive-material.mjs';
import {installInteractiveMaterial} from './install-interactive-material.mjs';
import {buildFilmController,buildWikiController} from './glt-playback-controller/build.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const [unitRoot,wikiExport,playwrightModule]=process.argv.slice(2);
if(!unitRoot||!wikiExport)throw new Error('Aufruf: prepare-glt-html-test.mjs <gLT-Einheitsordner> <frischer Video-Lab-Export>');
const archiveRoot=path.join(root,'output/glt-html-integration/test-archive');
const packages=[
  {id:'glt-lernszenen-player',title:'gLT Test · Zwei Lernszenen',source:path.join(unitRoot,'00_einstieg/glt-lernszenen-player')},
  {id:'glt-hattie-aufloesung',title:'gLT Test · Forschungsauflösung',source:path.join(unitRoot,'03_aufloesung/glt-hattie-aufloesung')},
  {id:'glt-hattie-wiki',title:'gLT Test · Wiki-Tutorial',source:path.resolve(wikiExport)},
];
const lessons=packages.map(item=>({id:`test-${item.id}`,classId:'glt-test',subjectId:'glt-test',seriesId:'glt-html-test',title:item.title,
  seed:{prompt:'',showTransportImage:false},metadata:{scheduledFor:null},materialBasis:{scope:'lesson',archiveSeriesId:'glt-html-test',
    archivePath:`faecher/glt-test/reihen/glt-html-test/stunden/test-${item.id}/material`}}));
await mkdir(archiveRoot,{recursive:true});
const archivePath=path.join(archiveRoot,'archive.json');
try {
  const archive=JSON.parse(await readFile(archivePath,'utf8'));
  if(archive.testPurpose!=='glt-html-integration')throw new Error('Ziel ist kein von diesem Werkzeug angelegtes Testarchiv.');
} catch(error) {
  if(error.code!=='ENOENT')throw error;
  const now=new Date().toISOString();
  await writeFile(archivePath,JSON.stringify({format:'tafelraum-unterrichtsarchiv',schemaVersion:1,testPurpose:'glt-html-integration',createdAt:now,updatedAt:now,
    classes:[{id:'glt-test',label:'gLT · nur Integrationstest'}],catalog:{version:1,subjects:[{id:'glt-test',classId:'glt-test',label:'Methodik / Didaktik'}],
      series:[{id:'glt-html-test',classId:'glt-test',subjectId:'glt-test',label:'HTML-Teststunden'}],lessons,
      hiddenLessonIds:[],trash:[],subjectOrderByClassId:{},seriesOrderBySubjectId:{},lessonOrderBySeriesId:{}}},null,2)+'\n',{flag:'wx'});
}
const results=[];
for(const item of packages){
  const staged=path.join(root,'output/interactive-materials',item.id);
  await mkdir(path.dirname(staged),{recursive:true});
  await cp(item.source,staged,{recursive:true});
  if(item.id==='glt-hattie-wiki')await writeFile(path.join(staged,'manifest.json'),JSON.stringify({format:'tafelraum-interactive-html',schemaVersion:1,
    id:item.id,title:'Das Hattie-Wiki erkunden',entry:'index.html',defaultViewport:{width:1280,height:720}},null,2)+'\n');
  if(item.id!=='glt-hattie-aufloesung'){
    const manifestPath=path.join(staged,'manifest.json');
    const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
    manifest.playback={protocol:'room-v1',initialState:item.id==='glt-hattie-wiki'
      ?{version:1,projectId:'glt-hattie-wiki',frame:0,mode:'steps',speed:1}:{version:1,slide:0,positions:[0,0]}};
    if(playwrightModule){
      if(item.id==='glt-hattie-wiki')await buildWikiController(staged,path.resolve(wikiExport,'../..'),playwrightModule);
      else await buildFilmController(staged);
      manifest.playback.controllerEntry='controller.html';
    }
    await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  }
  await checkInteractiveMaterial({sourceDirectory:staged});
  results.push(await installInteractiveMaterial({archiveRoot,lessonId:`test-${item.id}`,sourceDirectory:staged}));
}
await writeFile(path.join(root,'output/glt-html-integration/installation.json'),JSON.stringify({archiveRoot,unitRoot:path.resolve(unitRoot),wikiExport:path.resolve(wikiExport),results},null,2)+'\n');
console.log(JSON.stringify({archiveRoot,lessons:lessons.map(({id,title})=>({id,title})),installed:results.length},null,2));

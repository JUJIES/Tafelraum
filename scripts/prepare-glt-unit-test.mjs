// Complete local rehearsal, never the productive archive or canonical gLT sources.
import {access,copyFile,cp,mkdir,readFile,readdir,rename,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkInteractiveMaterial} from './check-interactive-material.mjs';
import {installInteractiveMaterial} from './install-interactive-material.mjs';
import {buildSingleVideoPackage} from './glt-playback-controller/build.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const output=path.join(root,'output/glt-html-integration');
const archiveRoot=path.join(output,'test-archive');
const installation=JSON.parse(await readFile(path.join(output,'installation.json'),'utf8'));
const unit=installation.unitRoot;
const archiveFile=path.join(archiveRoot,'archive.json');
const archive=JSON.parse(await readFile(archiveFile,'utf8'));
if(archive.testPurpose!=='glt-html-integration'||archive.catalog.lessons.some(lesson=>!lesson.id.startsWith('test-glt-')))
  throw Error('Only the marked gLT test archive is allowed.');
const lessonId='test-glt-einheit-1-komplett';
const lesson={id:lessonId,classId:'glt-test',subjectId:'glt-test',seriesId:'glt-html-test',
  title:'gLT Test · Einheit 1 komplett',seed:{prompt:'',showTransportImage:false},metadata:{scheduledFor:null},
  materialBasis:{scope:'lesson',archiveSeriesId:'glt-html-test',archivePath:`faecher/glt-test/reihen/glt-html-test/stunden/${lessonId}/material`}};
const existing=archive.catalog.lessons.find(value=>value.id===lessonId);
if(existing&&JSON.stringify(existing.materialBasis)!==JSON.stringify(lesson.materialBasis))throw Error('Conflicting test lesson.');

const stagedVideo=path.join(root,'output/interactive-materials/glt-hattie-mittag');
await mkdir(path.join(output,'mittag'),{recursive:true});
const sourceVideo=path.join(unit,'02_hattie-einfuehrung/media/hattie-studie-2025-michael-mittag.mp4');
const poster=path.join(output,'mittag/poster.jpg');
try{await access(poster);}catch{
  execFileSync('/opt/homebrew/bin/ffmpeg',['-v','error','-ss','3','-i',sourceVideo,'-frames:v','1','-q:v','2',poster]);
}
await buildSingleVideoPackage(stagedVideo,{title:'Die Hattie-Studie (2025)',credit:'Michael Mittag · Erklärvideo',sourceVideo,poster,
  logo:path.join(root,'output/interactive-materials/glt-lernszenen-player/assets/be-teil-group.svg')});
await copyFile(path.join(unit,'02_hattie-einfuehrung/media/README.md'),path.join(stagedVideo,'QUELLEN.md'));
await checkInteractiveMaterial({sourceDirectory:stagedVideo});

// Package order is the actual current seminar sequence, not a new pedagogy.
const packages=[
  ['01','glt-lernszenen-player','Lernen in zwei Szenen',null],
  ['02','glt-lernen-einstieg','Filmvergleich · Blatt 1','00_einstieg/glt-lernen-einstieg'],
  ['03','glt-lernerfahrungen','Eigene Lernerfahrungen · Blatt 2','00_einstieg/glt-lernerfahrungen'],
  ['04','glt-paarsuche-auftrag','Kooperative Paarsuche · Spielanleitung','01_memory/glt-paarsuche-auftrag'],
  ['05','glt-rangfolge-auftrag','Eigene Rangfolge · Folgeauftrag','01_memory/glt-rangfolge-auftrag'],
  ['06','glt-hattie-einfuehrung','Hattie und MetaX · bisherige Einführungsfolie','02_hattie-einfuehrung/glt-hattie-einfuehrung'],
  ['07','glt-hattie-mittag','Hattie-Film · Michael Mittag',null],
  ['08','glt-hattie-aufloesung','Forschungsauflösung',null],
  ['09','glt-hattie-wiki','Wiki-Tutorial',null],
  ['10','glt-hattie-teamreflexion','Hattie-Reflexion · Arbeitsbogen','05_teamreflexion/glt-hattie-teamreflexion'],
  ['11','glt-klarheit-auftrag','Klarheit · Lese- und Plakatauftrag','07_vertiefung/glt-klarheit-auftrag'],
  ['12','glt-klarheit-lesetexte','Klarheit · Lesetexte A und B','07_vertiefung/glt-klarheit-lesetexte'],
  ['13','glt-klarheit-workshopauftrag','Klarheit · Workshopauftrag','07_vertiefung/glt-klarheit-workshopauftrag'],
  ['90','glt-filmvergleich-musterloesung','NUR KURSLEITUNG · Filmvergleich – Musterlösung','00_einstieg/glt-filmvergleich-musterloesung'],
  ['91','glt-memory-auftrag','Alternative · klassisches Memory','01_memory/glt-memory-auftrag'],
].map(([order,id,title,relative])=>({order,id,title,source:relative?path.join(unit,relative):path.join(root,'output/interactive-materials',id),canvas:Number(order)<90}));
// Preflight every source before adding the new catalog entry.
for(const item of packages){
  const manifest=JSON.parse(await readFile(path.join(item.source,'manifest.json'),'utf8'));
  item.requirePrint=Boolean(manifest.print);item.viewport=manifest.defaultViewport;
  await checkInteractiveMaterial({sourceDirectory:item.source,requirePrint:item.requirePrint});
}
if(!existing){
  await mkdir(path.join(archiveRoot,'.history/catalog'),{recursive:true});
  await copyFile(archiveFile,path.join(archiveRoot,'.history/catalog',`before-complete-glt-${Date.now()}.json`));
  archive.catalog.lessons.push(lesson);archive.updatedAt=new Date().toISOString();
  const tmp=archiveFile+'.complete-unit.tmp';await writeFile(tmp,JSON.stringify(archive,null,2)+'\n');await rename(tmp,archiveFile);
}
const materialRoot=path.join(archiveRoot,lesson.materialBasis.archivePath);
const names={},files=[],primary=[];
for(const item of packages){
  const result=await installInteractiveMaterial({archiveRoot,lessonId,sourceDirectory:item.source,requirePrint:item.requirePrint});
  names[`interaktiv/${item.id}`]=`${item.order} · ${item.title}`;
  if(item.canvas)primary.push({id:item.id,title:item.title,number:Number(item.order),viewport:item.viewport});
  console.log(`${result.created?'Installed':'Unchanged'}: ${item.id}`);
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function copyChecked(relative,target){
  const source=path.join(unit,relative),dest=path.join(materialRoot,target),bytes=await readFile(source);
  try{if(hash(await readFile(dest))!==hash(bytes))throw Error('Existing material differs: '+target);}
  catch(error){if(error.code!=='ENOENT')throw error;await mkdir(path.dirname(dest),{recursive:true});await copyFile(source,dest);}
  files.push({source:relative,path:target,sha256:hash(bytes)});
}
for(const [source,target] of [
  ['00_einstieg/output/glt-lernen-einstieg/glt-lernen-einstieg.pdf','druck/02-filmvergleich.pdf'],
  ['00_einstieg/output/glt-lernerfahrungen/glt-lernerfahrungen.pdf','druck/03-lernerfahrungen.pdf'],
  ['01_memory/output/pdf/glt-memory-duplex.pdf','druck/04-kartensatz-duplex.pdf'],
  ['01_memory/output/pdf/glt-auftragskarten-2-teams-duplex.pdf','druck/04-05-auftragskarten-duplex.pdf'],
  ['07_vertiefung/output/pdf/glt-klarheit-materialpaket-duplex.pdf','druck/11-12-klarheit-lesepaket-duplex.pdf'],
  ['07_vertiefung/glt-klarheit-praxisfall/output/pdf/klarheit-workshopauftrag.pdf','druck/13-klarheit-workshopauftrag.pdf'],
  ['07_vertiefung/glt-klarheit-praxisfall/output/docx/fuchs-arbeitsbogen-vorlage.docx','arbeitsdateien/fuchs-arbeitsbogen-vorlage.docx'],
  ['07_vertiefung/glt-klarheit-praxisfall/assets/fuchs-lebensraum.png','arbeitsdateien/fuchs-lebensraum.png'],
  ['00_einstieg/output/glt-filmvergleich-musterloesung/glt-filmvergleich-musterloesung.pdf','kursleitung/90-filmvergleich-musterloesung.pdf'],
  ['07_vertiefung/glt-klarheit-praxisfall/output/docx/fuchs-arbeitsbogen-musterloesung.docx','kursleitung/91-fuchs-musterloesung.docx'],
])await copyChecked(source,target);
async function collectLiterature(dir){
  for(const entry of await readdir(path.join(unit,dir),{withFileTypes:true})){
    const relative=path.posix.join(dir,entry.name);
    if(entry.isDirectory())await collectLiterature(relative);
    else if(entry.isFile()&&entry.name.endsWith('.pdf'))await copyChecked(relative,relative);
  }
}
await collectLiterature('literatur/teil_02_vertiefung');
const now=new Date().toISOString();
const links=[
  {id:'wiki-faktoren',title:'10 · Hattie-Wiki · Faktoren (online)',url:'https://web3.fhnw.ch/hattiewiki/hattie/Kategorie:Faktoren',provider:'web',updatedAt:now},
  {id:'wiki-wut',title:'10b · Abschlussimpuls · Wut (online)',url:'https://web.fhnw.ch/plattformen/hattie-wiki/begriffe/Wut',provider:'web',updatedAt:now},
];
await writeFile(path.join(materialRoot,'links.json'),JSON.stringify({schemaVersion:1,links},null,2)+'\n');
await writeFile(path.join(materialRoot,'.material-names.json'),JSON.stringify({schemaVersion:1,names},null,2)+'\n');
await writeFile(path.join(materialRoot,'README.md'),`# gLT · Einheit 1 · vollständige Teststunde\n\nNur lokales Testarchiv, keine echten Stunden.\n\n13 Präsentationsmaterialien in Ablaufreihenfolge. Nummern sind Testnavigation, keine neue Zeitplanung.\nTeil 1: 01–10; Teil 2/Klarheit: 11–13. Karten und Papierphasen bleiben analog.\n\n\`druck/\`: vorhandene Druckdateien; keine neue native Druckfreigabe.\n\`arbeitsdateien/\`: aktuelle Word-Vorlage und PNG für die Materialmail. DOCX bleibt bearbeitbare Quelle, kein HTML-Editor.\n\`kursleitung/\` und Materialnummer 90: Lösungen, nicht auf dem Präsentationscanvas und nicht zur Teilnehmerverteilung.\n\`literatur/\`: vorhandener Vorbereitungsfundus; nicht als zusätzliche Pflichtlektüre oder als neue Seminarphase ausgeben.\n\nKeine Altaufträge aus 06_klarheit-bestand, keine Zwischenexporte, keine noch nicht gebauten Differenzierungs-/Feedbackaufgaben.\nWiki/Wut benötigen Internet; Filme und Tutorial liegen lokal. QR-Fotoabgabe und Mail-/Word-/Druckweg müssen mit echten Geräten separat getestet werden.\nQuelle: bestehende gLT-Einheitenübersicht; Lerninhalte unverändert.\n`);
await writeFile(path.join(output,'complete-unit.json'),JSON.stringify({archiveRoot,lessonId,lessonTitle:lesson.title,materialRoot,unitRoot:unit,primary,packages,files},null,2)+'\n');
console.log(JSON.stringify({lessonId,htmlPackages:packages.length,primary:primary.length,files:files.length,materialRoot},null,2));

// Run from the repository root. Only a freshly initialized synthetic archive is read.
import {mkdtemp,mkdir,readFile,writeFile,rm,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {lessons} from './lessons/content.mjs';
import {makePackage} from './lessons/package.mjs';
import {initializeEmptyArchive,createDesktopServer} from '../prototypes/surface-shell-a-b/desktop-server.mjs';
const here=fileURLToPath(new URL('.',import.meta.url)),root=path.resolve(here,'..'),app=path.join(root,'prototypes/surface-shell-a-b');
const out=path.join(root,'output/public-preview/dist'),temp=await mkdtemp(path.join(tmpdir(),'tafelraum-preview-'));
const require=createRequire(path.join(app,'package.json'));
const {build}=await import(require.resolve('vite'));
if(JSON.parse(await readFile(path.join(app,'distribution.json'))).profile!=='public')throw Error('Public checkout required');
function scene(lesson){
  const items = [];
  function shape(type,x,y,width,height,extra={}) {
    const n=items.length+1;
    items.push({id:lesson.id+'-'+n,type,x,y,width,height,angle:0,strokeColor:'#213432',backgroundColor:'transparent',fillStyle:'solid',strokeWidth:1,strokeStyle:'solid',roughness:0,opacity:100,groupIds:[],frameId:null,roundness:null,seed:n,version:1,versionNonce:n,isDeleted:false,boundElements:[],updated:1,link:null,locked:false,...extra});
  }
  function text(x,y,width,label,size,color='#26352f'){
    shape('text',x,y,width,size*1.25*label.split('\n').length,{text:label,originalText:label,fontSize:size,fontFamily:2,lineHeight:1.25,textAlign:'left',verticalAlign:'top',autoResize:false,containerId:null,strokeColor:color});
  }
  shape('rectangle',26,28,852,700,{strokeColor:'transparent',customData:{materialKind:'interactive-html',interactiveHtmlId:lesson.id,interactiveHtmlContentZoom:1,interactiveHtmlFrameLayout:'content',sourceEntry:'index.html',sourceLessonId:lesson.id,sourceTitle:lesson.title,archiveMaterialPath:'faecher/subject-start/reihen/series-start/stunden/'+lesson.id+'/material/interaktiv/'+lesson.id}});
  shape('rectangle',912,50,275,305,{backgroundColor:lesson.tint,strokeColor:'transparent',roundness:{type:3,value:14}});
  text(932,78,225,'LESSON NOTES',16,lesson.accent);
  const notes={eclipse:['Predict','Sketch the order of\nthe three bodies.','Pair discussion','Where would a second\nobserver see daylight?'],'map-room':['Estimate','Trace both routes\nfrom camp to lookout.','Pair discussion','Which trail fits a\n25-minute limit?'],dispatch:['Notice','Which detail was\nactually observed?','Pair discussion','Can two records support\nthe same headline?']}[lesson.id];
  text(932,118,232,notes[0],25);text(932,159,238,notes[1],17);text(932,228,238,notes[2],22);text(932,266,237,notes[3],17);
  return {schemaVersion:1,elements:items,viewport:{scrollX:0,scrollY:0,zoom:{value:.88}},clips:[{kind:'material',id:lesson.id+'-clip',number:1,elementId:items[0].id}]};
}
let server;
try {
  await initializeEmptyArchive(temp);
  const file=path.join(temp,'archive.json'),archive=JSON.parse(await readFile(file,'utf8')),template=archive.catalog.lessons[0];
  archive.classes[0].label='Demo classroom';archive.catalog.subjects[0].label='Learning studio';archive.catalog.series[0].label='Field investigations';
  archive.catalog.lessons=lessons.map(l=>({...template,id:l.id,title:l.title}));archive.catalog.lessonOrderBySeriesId['series-start']=lessons.map(l=>l.id);
  await writeFile(file,JSON.stringify(archive));
  for(const l of lessons){
    const base=path.join(temp,'faecher/subject-start/reihen/series-start/stunden',l.id);
    const pkg=path.join(base,'material/interaktiv',l.id);
    await mkdir(pkg,{recursive:true});await mkdir(path.join(base,'board'),{recursive:true});
    await writeFile(path.join(pkg,'manifest.json'),JSON.stringify({format:'tafelraum-interactive-html',schemaVersion:1,id:l.id,title:l.title,entry:'index.html',defaultViewport:{width:852,height:700}}));
    await writeFile(path.join(pkg,'index.html'),makePackage(l));
    execFileSync(process.execPath,[path.join(root,'scripts/check-interactive-material.mjs'),'--source-dir',pkg],{stdio:'inherit'});
    await writeFile(path.join(base,'board/scene.json'),JSON.stringify(scene(l)));
  }
  process.chdir(app);
  await build({root:app,build:{outDir:out,emptyOutDir:true},plugins:[{
    name:'static-preview',enforce:'pre',
    resolveId(id){if(/(?:^|\/)canvas-persistence(?:\.ts)?$/.test(id))return path.join(here,'memory-canvas.mjs')},
    transformIndexHtml:{order:'post',handler(html){return html.replace('</head>','<script src="/preview-bootstrap.js"></script><link rel="stylesheet" href="/preview.css"></head>').replace('<div id="root">','<aside id="preview-bar"><strong>Tafelraum · Live demo</strong><span>Three lessons to try. Changes last only in this tab.</span><a href="/guide.html">Lesson guide</a><a href="/">Reset</a></aside><div id="root">')}}
  }]});
  await copyFile(path.join(here,'bootstrap.js'),path.join(out,'preview-bootstrap.js'));
  await copyFile(path.join(here,'preview.css'),path.join(out,'preview.css'));
  await copyFile(path.join(here,'guide.html'),path.join(out,'guide.html'));
  server=await createDesktopServer({archiveRoot:temp,webRoot:out});
  const origin='http://127.0.0.1:'+server.address().port, routes={};
  const paths=['/api/archive','/api/archive/material-removals'];
  for(const l of lessons){
    const base='/api/archive/lessons/'+l.id;
    paths.push(base+'/board',base+'/materials',base+'/materials/interactive/'+l.id,base+'/materials/interactive/'+l.id+'/index.html');
  }
  for(const p of paths){
    const res=await fetch(origin+p);if(!res.ok)throw Error(p+' '+res.status);
    routes[p]={type:res.headers.get('content-type'),body:await res.text()};
    if(routes[p].body.includes(temp))throw Error('Local path in fixture');
  }
  await writeFile(path.join(root,'output/public-preview/routes.json'),JSON.stringify(routes));
}finally{if(server)await new Promise(done=>server.close(done));await rm(temp,{recursive:true,force:true})}

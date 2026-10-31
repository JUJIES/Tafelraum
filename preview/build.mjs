// Run from the repository root. Only a freshly initialized synthetic archive is read.
import {mkdtemp,mkdir,readFile,writeFile,rm,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {lessons} from './lessons/content.mjs';
import {makeBoard} from './lessons/boards.mjs';
import {starterPicture} from './lessons/pictures.mjs';
import {worksheet,sheetManifest} from './lessons/worksheet.mjs';
import {makePackage} from './lessons/package.mjs';
import {initializeEmptyArchive,createDesktopServer} from '../prototypes/surface-shell-a-b/desktop-server.mjs';
const here=fileURLToPath(new URL('.',import.meta.url)),root=path.resolve(here,'..'),app=path.join(root,'prototypes/surface-shell-a-b');
const out=path.join(root,'output/public-preview/dist'),temp=await mkdtemp(path.join(tmpdir(),'tafelraum-preview-'));
const require=createRequire(path.join(app,'package.json'));
const {build}=await import(require.resolve('vite'));
if(JSON.parse(await readFile(path.join(app,'distribution.json'))).profile!=='public')throw Error('Public checkout required');
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
    if(l.id==='eclipse'){
      const date='2026-10-31T00:00:00.000Z';
      const video={id:'nasa-eclipse',title:'What Is a Solar Eclipse? · NASA Space Place',provider:'youtube',videoId:'hyf5JF_VxwM',url:'https://www.youtube.com/watch?v=hyf5JF_VxwM',createdAt:date,updatedAt:date};
      await writeFile(path.join(base,'material/links.json'),JSON.stringify({schemaVersion:1,links:[video]}));
    }
    if(l.id==='map-room'){
      const sheet=path.join(base,'material/interaktiv/trail-sheet');
      await mkdir(sheet,{recursive:true});
      await writeFile(path.join(sheet,'manifest.json'),JSON.stringify(sheetManifest));
      await writeFile(path.join(sheet,'index.html'),worksheet);
      execFileSync(process.execPath,[path.join(root,'scripts/check-interactive-material.mjs'),'--source-dir',sheet,'--require-print'],{stdio:'inherit'});
    }
    await writeFile(path.join(base,'board/scene.json'),JSON.stringify(makeBoard(l)));
  }
  process.chdir(app);
  await build({root:app,build:{outDir:out,emptyOutDir:true},plugins:[{
    name:'static-preview',enforce:'pre',
    resolveId(id,importer){
      if((id==='./YouTubeCanvasPlayer' && importer?.endsWith('/CanvasSurface.tsx')) ||
         (id==='./RoomMediaLayer' && importer?.endsWith('/LiveViewerCanvas.tsx')))return path.join(app,'src/preview/PreviewVideo.tsx');
      if(/(?:^|\/)canvas-persistence(?:\.ts)?$/.test(id))return path.join(here,'memory-canvas.mjs')},
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
    const id=l.id+'-picture';
    routes[base+'/starter-image']={type:'application/json',body:JSON.stringify({id,mimeType:'image/svg+xml',created:1,dataURL:'data:image/svg+xml;base64,'+Buffer.from(starterPicture(l.id)).toString('base64')})};
    if(l.id==='map-room')paths.push(base+'/materials/interactive/trail-sheet',base+'/materials/interactive/trail-sheet/index.html');
    paths.push(base+'/board',base+'/materials',base+'/materials/interactive/'+l.id,base+'/materials/interactive/'+l.id+'/index.html');
  }
  for(const p of paths){
    const res=await fetch(origin+p);if(!res.ok)throw Error(p+' '+res.status);
    routes[p]={type:res.headers.get('content-type'),body:await res.text()};
    if(routes[p].body.includes(temp))throw Error('Local path in fixture');
  }
  await writeFile(path.join(root,'output/public-preview/routes.json'),JSON.stringify(routes));
}finally{if(server)await new Promise(done=>server.close(done));await rm(temp,{recursive:true,force:true})}

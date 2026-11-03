// Run from the repository root. Only a freshly initialized synthetic archive is read.
import {mkdtemp,mkdir,readFile,writeFile,rm,copyFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const lessons=[{id:'volcanoes',title:'Volcanoes — Why live so close?'}];
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
  archive.classes[0].label='Year 7';archive.catalog.subjects[0].label='Geography';archive.catalog.series[0].label='Living with volcanoes';
  archive.catalog.lessons=lessons.map(l=>({...template,id:l.id,title:l.title}));archive.catalog.lessonOrderBySeriesId['series-start']=lessons.map(l=>l.id);
  await writeFile(file,JSON.stringify(archive));
  const base=path.join(temp,'faecher/subject-start/reihen/series-start/stunden/volcanoes');
  await mkdir(path.join(base,'board'),{recursive:true});
  await copyFile(path.join(here,'lessons/volcanoes/board.json'),path.join(base,'board/scene.json'));
  await mkdir(path.join(base,'material/interaktiv'),{recursive:true});
  await copyFile(path.join(here,'lessons/volcanoes/links.json'),path.join(base,'material/links.json'));
  for(const id of ['volcanoes-field-sheet','volcanoes-teacher-answers']){
    const src=path.join(here,'lessons/volcanoes',id),dest=path.join(base,'material/interaktiv',id);
    await mkdir(dest,{recursive:true});
    for(const name of ['index.html','manifest.json','style.css'])await copyFile(path.join(src,name),path.join(dest,name));
    execFileSync(process.execPath,[path.join(root,'scripts/check-interactive-material.mjs'),'--source-dir',dest,'--require-print'],{stdio:'inherit'});
  }
  process.chdir(app);
  await build({root:app,build:{outDir:out,emptyOutDir:true},plugins:[{
    name:'static-preview',enforce:'pre',
    resolveId(id,importer){
      if((id==='./YouTubeCanvasPlayer' && importer?.endsWith('/CanvasSurface.tsx')) ||
         (id==='./RoomMediaLayer' && importer?.endsWith('/LiveViewerCanvas.tsx')))return path.join(app,'src/preview/PreviewVideo.tsx');
      if(/(?:^|\/)canvas-persistence(?:\.ts)?$/.test(id))return path.join(here,'memory-canvas.mjs')},
    transformIndexHtml:{order:'post',handler(html){return html.replace('</head>','<script src="/preview-bootstrap.js"></script><link rel="stylesheet" href="/preview.css"></head>').replace('<div id="root">','<aside id="preview-bar"><strong>Tafelraum · Live demo</strong><span>Try the lesson from the video. Changes last only in this tab.</span><a href="/guide.html">Lesson guide</a><a href="/">Reset</a></aside><div id="root">')}}
  }]});
  await copyFile(path.join(here,'bootstrap.js'),path.join(out,'preview-bootstrap.js'));
  await copyFile(path.join(here,'preview.css'),path.join(out,'preview.css'));
  await copyFile(path.join(here,'guide.html'),path.join(out,'guide.html'));
  server=await createDesktopServer({archiveRoot:temp,webRoot:out});
  const origin='http://127.0.0.1:'+server.address().port, routes={};
  const paths=['/api/archive','/api/archive/material-removals'];
  const api='/api/archive/lessons/volcanoes';
  paths.push(api+'/board',api+'/materials');
  for(const id of ['volcanoes-field-sheet','volcanoes-teacher-answers']){
    paths.push(api+'/materials/interactive/'+id,api+'/materials/interactive/'+id+'/index.html',api+'/materials/interactive/'+id+'/style.css');
  }
  for(const p of paths){
    const res=await fetch(origin+p);if(!res.ok)throw Error(p+' '+res.status);
    routes[p]={type:res.headers.get('content-type'),body:await res.text()};
    if(routes[p].body.includes(temp))throw Error('Local path in fixture');
  }
  await writeFile(path.join(root,'output/public-preview/routes.json'),JSON.stringify(routes));
}finally{if(server)await new Promise(done=>server.close(done));await rm(temp,{recursive:true,force:true})}

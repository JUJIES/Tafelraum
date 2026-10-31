// Authoring only: derivative teacher surfaces. Never a runtime capture/player.
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../prototypes/surface-shell-a-b/package.json',import.meta.url));
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Lucide=require('lucide-react');
// Build-time only: unchanged official icons, no React/player runtime in packages.
export const controllerIcons=Object.fromEntries(['Play','Pause','Square','Volume2','VolumeX','Maximize','Minimize','ArrowLeft','ArrowRight']
  .map(name=>[name,renderToStaticMarkup(React.createElement(Lucide[name],{size:24,strokeWidth:2,'aria-hidden':true}))]));
const here=path.dirname(fileURLToPath(import.meta.url));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const controls=`<div class="controller-tools" id="controller-tools" data-tafelraum-interactive>
  <!--controller-navigation-->
  <button id="play" type="button" data-playback-command="play" aria-label="Abspielen" title="Abspielen">${controllerIcons.Play}</button>
  <button id="stop" type="button" aria-label="Stoppen und zum Anfang" title="Stoppen und zum Anfang">${controllerIcons.Square}</button>
  <input id="seek" aria-label="Position" title="Position wählen – Wiedergabe oder Pause bleibt erhalten" type="range" min="0" max="1" step=".1" value="0">
  <output id="time" aria-live="off">0:00 / 0:00</output>
  <button id="mute" type="button" aria-label="Ton ausschalten" title="Ton ausschalten">${controllerIcons.Volume2}</button>
  <input id="volume" aria-label="Lautstärke" title="Lautstärke – übernehmen beim Loslassen" type="range" min="0" max="1" step=".01" value="1">
  <button id="fullscreen" type="button" aria-label="Video im Room als Vollbild" aria-pressed="false" title="Video im Room als Vollbild">${controllerIcons.Maximize}</button>
  </div><p id="connection" class="controller-status" role="status"></p>`;
const configScript=config=>`<script id="controller-config" type="application/json">${JSON.stringify({...config,icons:controllerIcons}).replaceAll('<','\\u003c')}</script><script src="controller-surface.js" defer></script>`;
async function shared(directory){
  await copyFile(path.join(here,'surface.js'),path.join(directory,'controller-surface.js'));
  await copyFile(path.join(here,'surface.css'),path.join(directory,'controller-surface.css'));
  await copyFile(path.join(path.dirname(require.resolve('lucide-react/package.json')),'LICENSE'),path.join(directory,'LUCIDE_LICENSE.txt'));
}
export {shared as refreshControllerAssets};
export function renderFilmController(original){
  let count=0;
  let html=original.replace('<script src="player.js" defer></script>','<link rel="stylesheet" href="controller-surface.css">');
  html=html.replace(/<video\b([^>]*)>[\s\S]*?<\/video>/g,(_whole,attributes)=>{
    const poster=attributes.match(/\bposter="([^"]+)"/)?.[1];if(!poster)throw new Error('Filmvorlage ohne Poster.');count++;
    return `<img class="controller-image" src="${escape(poster)}" alt="Ruhende Vorschau der Filmszene">`;
  });
  if(count!==2)throw new Error('Filmvorlage geändert: genau zwei Szenen erwartet.');
  html=html.replace(/<p class="video-error"[\s\S]*?<\/p>/g,'').replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
  html=html.replace(/<button\b[^>]*\bid="fullscreen"[^>]*>[\s\S]*?<\/button>/g,'');
  html=html.replace(/<button\b[^>]*\bdata-play="[^"]+"[^>]*>[\s\S]*?<\/button>/g,'');
  return html.replace('</main>',`${controls.replace('<!--controller-navigation-->','')}</main>`).replace('</body>',`${configScript({kind:'slides',nextLabels:['Zur ersten Szene','Zum zweiten Film','Zur zweiten Szene','Zum Anfang']})}</body>`);
}
export async function buildFilmController(directory){
  await shared(directory);
  const index=path.join(directory,'index.html');
  let original=await readFile(index,'utf8');
  if(!original.includes('film-presentation.js')){
    original=original.replace('</head>','<link rel="stylesheet" href="film-presentation.css"><script src="film-presentation.js" defer></script></head>');
    await writeFile(index,original);
  }
  for(const file of ['film-presentation.js','film-presentation.css'])await copyFile(path.join(here,file),path.join(directory,file));
  // The passive teacher view cannot run a script referring to the real player.
  await writeFile(path.join(directory,'controller.html'),renderFilmController(original.replace('<script src="film-presentation.js" defer></script>','')));
}

export async function buildSingleVideoPackage(directory,{title,credit,sourceVideo,poster,logo}){
  await mkdir(path.join(directory,'assets'),{recursive:true});await shared(directory);
  for(const file of ['single-video.js','single-video.css'])await copyFile(path.join(here,file),path.join(directory,file));
  await copyFile(sourceVideo,path.join(directory,'assets/video.mp4'));
  await copyFile(poster,path.join(directory,'assets/poster.jpg'));
  await copyFile(logo,path.join(directory,'assets/logo.svg'));
  const header=`<header><img src="assets/logo.svg" alt="be-teil"><div><h1>${escape(title)}</h1><p>${escape(credit)}</p></div></header>`;
  const head=`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><link rel="stylesheet" href="single-video.css">`;
  await writeFile(path.join(directory,'index.html'),`${head}<script src="single-video.js" defer></script></head><body><main>${header}<div class="video-stage"><video controls playsinline preload="metadata" poster="assets/poster.jpg" src="assets/video.mp4" aria-label="${escape(title)}"></video><p class="video-error" id="video-error" hidden>Die Filmdatei konnte nicht geladen werden.</p></div></main></body></html>`);
  await writeFile(path.join(directory,'controller.html'),`${head}<link rel="stylesheet" href="controller-surface.css"></head><body><main>${header}<div class="video-stage"><img class="controller-image" src="assets/poster.jpg" alt="Ruhende Vorschau des Hattie-Films"></div>${controls.replace('<!--controller-navigation-->','')}</main>${configScript({kind:'video'})}</body></html>`);
  await writeFile(path.join(directory,'manifest.json'),JSON.stringify({format:'tafelraum-interactive-html',schemaVersion:1,id:path.basename(directory),title,entry:'index.html',defaultViewport:{width:1280,height:720},
    playback:{protocol:'room-v1',controllerEntry:'controller.html',initialState:{version:1,position:0}}},null,2)+'\n');
}

export async function buildWikiController(directory,videoLabRoot,playwrightModule){
  await shared(directory);
  const {compileProject}=await import(pathToFileURL(path.join(videoLabRoot,'lib/project.ts')).href);
  const project=JSON.parse(await readFile(path.join(directory,'project.json'),'utf8'));
  const compiled=compileProject(project),scenes=[];
  await mkdir(path.join(directory,'controller-previews'),{recursive:true});
  const server=createServer(async(request,response)=>{
    try{
      const file=path.resolve(directory,'.'+decodeURIComponent(new URL(request.url,'http://localhost').pathname));
      if(!file.startsWith(path.resolve(directory)+path.sep))throw new Error('Pfad außerhalb Paket');
      const ext=path.extname(file),mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.wav':'audio/wav','.mp3':'audio/mpeg'}[ext]??'application/octet-stream';
      response.setHeader('Content-Type',mime);response.end(await readFile(file));
    }catch{response.statusCode=404;response.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    const {chromium}=await import(playwrightModule);browser=await chromium.launch({headless:true,channel:'chrome'});
    const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
    await page.waitForFunction(()=>Boolean(window.tafelraumLive&&window.tafelraumPlayback));
    await page.addStyleTag({content:'body,.viewer-shell{margin:0!important;padding:0!important;width:1280px!important;max-width:none!important;height:720px!important}.player-frame{width:1280px!important;height:720px!important;aspect-ratio:16/9!important}.compact-controls{display:none!important}'});
    for(const scene of compiled.scenes){
      const frame=Math.min(scene.startFrame+scene.durationFrames-1,scene.startFrame+Math.round(3*project.canvas.fps));
      await page.evaluate(({id,frame})=>window.tafelraumLive.applyState({version:1,projectId:id,frame,mode:'steps',speed:1}),{id:project.id,frame});
      await page.waitForFunction(frame=>window.tafelraumLive.getState().frame===frame,frame);
      // Wait for the actual composition paint after its paused native seek.
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const image=`controller-previews/${scene.id}.png`;
      await page.locator('.player-frame').screenshot({path:path.join(directory,image),type:'png'});
      scenes.push({id:scene.id,title:scene.title,startFrame:scene.startFrame,image});
      console.log(`Ruhende Abschnittsvorschau: ${scene.id}`);
    }
  }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
  await writeFile(path.join(directory,'controller.html'),renderWikiController(project,scenes));
  await writeFile(path.join(directory,'controller-previews','provenance.json'),JSON.stringify({source:'project.json / compileProject / existing paused ProjectViewer',frames:scenes},null,2)+'\n');
}

export function renderWikiController(project,scenes){
  const navigation='<button id="previous" type="button" aria-label="Zurück">Zurück</button><button id="next" type="button" aria-label="Weiter">Weiter</button>';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(project.title)}</title><link rel="stylesheet" href="controller-surface.css"></head><body class="frame-controller"><main class="player-frame" aria-label="Erklärungsplayer"><img id="scene-preview" class="controller-image" src="${escape(scenes[0].image)}" alt="Ruhende Vorschau">${controls.replace('<!--controller-navigation-->',navigation)}</main>${configScript({kind:'frames',fps:project.canvas.fps,scenes})}</body></html>`;
}

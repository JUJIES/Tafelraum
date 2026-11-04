import assert from 'node:assert/strict';import{createServer}from'node:http';import{readFile,mkdir,writeFile}from'node:fs/promises';import{createRequire}from'node:module';
const require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
const{chromium}=require('playwright');
const html=await readFile(new URL('./downloads/index.html',import.meta.url));
let wrong=false,combined=false,badWindows=false,holdWindows=false,releaseWindows,notifyWindows;const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),channel=u.pathname.startsWith('/tafelraum-public/')?'public':'mdm',version=channel==='public'?'0.1.88':'0.1.90';
 if(u.pathname.endsWith('/download/')){res.setHeader('Content-Type','text/html');res.end(html);return;}
 res.setHeader('Content-Type','application/json');
 if(u.pathname.endsWith('/latest.json')){res.end(JSON.stringify({version,...(combined&&channel==='public'?{platforms:{'windows-x86_64':{url:'https://github.com/JUJIES/Tafelraum/releases/download/v'+version+'/Tafelraum-Public-'+version+'-Windows-x64-setup.exe'}}}:{})}));return;}
 if(u.pathname.endsWith('/windows-download.json')){const filename='Tafelraum-Public-'+version+'-Windows-x64-setup.exe';const respond=()=>res.end(JSON.stringify({version,profile:'public',channel:'public',updateChannel:'public',sourceCommit:(badWindows?'c':'b').repeat(40),platform:'windows-x86_64',filename,url:'https://github.com/JUJIES/Tafelraum/releases/download/v'+version+'/'+filename,instructions:'WINDOWS-INSTALLATION.txt',sha256:'d'.repeat(64)}));if(holdWindows){releaseWindows=respond;notifyWindows();}else respond();return;}
 res.end(JSON.stringify({channel:wrong?'bad':channel,profile:channel==='mdm'?'personal':'public',version,filename:'Tafelraum-'+(channel==='mdm'?'MDM':'Public')+'-'+version+'-macOS-arm64.zip',sha256:'a'.repeat(64),sourceCommit:'b'.repeat(40)}));
});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch();const page=await browser.newPage();const checks=[];
try{
 for(const[channel,product,word]of[['mdm','tafelraum','MDM-Installationsanleitung lesen'],['public','tafelraum-public','Read the installation guide']]){
  await page.goto(base+'/'+product+'/download/');await page.getByRole('link',{name:word,exact:true}).waitFor();
  const href=await page.locator('#download').getAttribute('href');assert.ok(href.includes(channel==='mdm'?'Tafelraum-MDM-0.1.90':'Tafelraum-Public-0.1.88'));checks.push(channel+' link, version and guide matched');
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);checks.push(channel+' narrow viewport fits');
  await page.setViewportSize({width:1280,height:900});
 }
 wrong=true;await page.goto(base+'/tafelraum-public/download/');await page.getByText('No public desktop download is available right now. Please try again later.',{exact:true}).waitFor();assert.equal(await page.locator('#download').isVisible(),false);checks.push('profile mismatch hides download');
 wrong=false;combined=true;holdWindows=true;const requested=new Promise(r=>notifyWindows=r);await page.goto(base+'/tafelraum-public/download/');await requested;assert.equal(await page.locator('#download').isVisible(),false);releaseWindows();holdWindows=false;await page.locator('#platform-choice').waitFor();checks.push('combined release keeps download hidden until both metadata responses validate');
 await page.selectOption('#platform','windows-x86_64');assert.ok((await page.locator('#download').getAttribute('href')).endsWith('-Windows-x64-setup.exe'));assert.ok((await page.locator('#guide a').getAttribute('href')).endsWith('WINDOWS-INSTALLATION.txt'));assert.ok((await page.locator('#hash').textContent()).includes('d'.repeat(64)));
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:new URL('../output/download-workflow/windows-selection.png',import.meta.url).pathname,fullPage:true});
 await page.selectOption('#platform','darwin-aarch64');assert.ok((await page.locator('#download').getAttribute('href')).endsWith('-macOS-arm64.zip'));assert.ok((await page.locator('#guide a').getAttribute('href')).endsWith('INSTALLATIONSANLEITUNG.txt'));assert.ok((await page.locator('#hash').textContent()).includes('a'.repeat(64)));checks.push('platform selection keeps artifact, guide and checksum together; narrow layout fits');
 badWindows=true;await page.reload();await page.getByText('No public desktop download is available right now. Please try again later.',{exact:true}).waitFor();assert.equal(await page.locator('#download').isVisible(),false);assert.equal(await page.locator('#platform-choice').isVisible(),false);checks.push('mixed Windows source hides combined download controls');
 await mkdir(new URL('../output/download-workflow/',import.meta.url),{recursive:true});await writeFile(new URL('../output/download-workflow/browser-fixture-checks.json',import.meta.url),JSON.stringify(checks,null,2));console.log(checks.join('\n'));
}finally{await browser.close();await new Promise(r=>server.close(r));}

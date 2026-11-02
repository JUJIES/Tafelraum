import assert from 'node:assert/strict';import{createServer}from'node:http';import{readFile,mkdir,writeFile}from'node:fs/promises';import{createRequire}from'node:module';
const require=createRequire(new URL('../prototypes/surface-shell-a-b/package.json',import.meta.url));
const{chromium}=require('playwright');
const html=await readFile(new URL('./downloads/index.html',import.meta.url));
let wrong=false;const server=createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost'),channel=u.pathname.startsWith('/tafelraum-public/')?'public':'mdm',version=channel==='public'?'0.1.88':'0.1.90';
 if(u.pathname.endsWith('/download/')){res.setHeader('Content-Type','text/html');res.end(html);return;}
 res.setHeader('Content-Type','application/json');
 if(u.pathname.endsWith('/latest.json')){res.end(JSON.stringify({version}));return;}
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
 await mkdir(new URL('../output/download-workflow/',import.meta.url),{recursive:true});await writeFile(new URL('../output/download-workflow/browser-fixture-checks.json',import.meta.url),JSON.stringify(checks,null,2));console.log(checks.join('\n'));
}finally{await browser.close();await new Promise(r=>server.close(r));}

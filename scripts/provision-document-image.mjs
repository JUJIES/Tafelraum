// Personal Apple Silicon runtime, deliberately outside app bundle and archive.
// Copies a previously tested Python environment and checkpoints; no downloads.
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, unlink, symlink, access } from 'node:fs/promises';
import path from 'node:path';
const option = name => { const index=process.argv.indexOf(name); if(index<0 || !process.argv[index+1])throw Error('Missing '+name); return path.resolve(process.argv[index+1]); };
const env=option('--python-env'), repo=option('--repo'), weights=option('--weights'), mbd=option('--mbd-weights');
const target=option('--destination'), configPath=option('--config');
try { await access(target); throw Error('Destination already exists; validate or remove the unused runtime explicitly first.'); }
catch(error) { if(error.code!=='ENOENT')throw error; }
const base=execFileSync(path.join(env,'bin/python'),['-c','import sys; print(sys.base_prefix)'],{encoding:'utf8'}).trim();
await mkdir(target,{recursive:true,mode:0o700});
for(const [source,name] of [[base,'python'],[env,'env'],[repo,'DocRes'],[weights,'docres.pkl'],[mbd,'mbd.pkl']]) {
  execFileSync('/bin/cp',['-cR',source,path.join(target,name)]);
}
const pythonHome=path.join(target,'python/bin');
const cfgPath=path.join(target,'env/pyvenv.cfg');
const cfg=(await readFile(cfgPath,'utf8')).replace(/^home = .*$/m,`home = ${pythonHome}`).replace(/^executable = .*$/m,`executable = ${path.join(pythonHome,'python3')}`);
await writeFile(cfgPath,cfg);
for(const name of ['python','python3','python3.12']) {
  const link=path.join(target,'env/bin',name); await unlink(link).catch(()=>{}); await symlink(path.join(pythonHome,'python3'),link);
}
const python=path.join(target,'env/bin/python');
execFileSync(python,['-c','import torch, cv2, einops; from PIL import Image; assert torch.backends.mps.is_available(); print("Local document runtime ready")'],{stdio:'inherit'});
const config={python,repo:path.join(target,'DocRes'),weights:path.join(target,'docres.pkl'),mbdWeights:path.join(target,'mbd.pkl')};
await mkdir(path.dirname(configPath),{recursive:true});
await writeFile(configPath,JSON.stringify(config,null,2)+'\n',{flag:'wx',mode:0o600});
console.log('Private runtime configured. No archive data changed.');

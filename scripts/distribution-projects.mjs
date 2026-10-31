import {readFile} from 'node:fs/promises';
import path from 'node:path';
export async function hasRemoteDistribution(repository){
 try{return JSON.parse(await readFile(path.join(repository,'prototypes/surface-shell-a-b/distribution.json'),'utf8')).remoteCanvas!==false;}
 catch(error){if(error.code==='ENOENT')return true;throw error;}
}

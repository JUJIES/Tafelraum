import {fileURLToPath} from 'node:url';
import {prepareAgentKit} from '../../scripts/prepare-agent-kit.mjs';
import {createAgentKitMiddleware} from './agent-kit-server.mjs';
const repository=fileURLToPath(new URL('../../',import.meta.url));
const kitRoot=fileURLToPath(new URL('./agent-kit/',import.meta.url));
export function agentKitPlugin(){
 const configure=async server=>{await prepareAgentKit(repository,kitRoot);server.middlewares.use(createAgentKitMiddleware({kitRoot}));};
 return {name:'tafelraum-agent-kit',configureServer:configure,configurePreviewServer:configure,
  async closeBundle(){await prepareAgentKit(repository,kitRoot);}};
}

// Retain manifest compatibility without a model host, credential store or bridge.
export {sentenceCheckCapability,validSentenceRequest,validSentenceResult} from './sentence-check-contract.mjs';
const unavailable=async()=>{throw Object.assign(new Error('This experimental capability is not included in this distribution.'),{status:503});};
export function createDirectSentenceGateway(){return unavailable;}
export function createVideoLabSentenceGateway(){return unavailable;}
export function sentenceCheckBridgeScript(){return '';}

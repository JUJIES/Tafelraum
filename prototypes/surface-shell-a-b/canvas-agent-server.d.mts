import type {Connect,Plugin} from 'vite';
export function createCanvasAgentBroker(options?:{now?:()=>number;leaseMs?:number;pollMs?:number}):{middleware:Connect.NextHandleFunction;close():void};
export function canvasAgentPlugin():Plugin;

export const createTeachingAgentBroker:typeof createCanvasAgentBroker;
export function teachingAgentPlugin():Plugin;

export const canvasAgentProtocol: string;
export type AgentRect = {x:number;y:number;width:number;height:number};
export type AgentOperation =
 | {type:'text';key:string;x:number;y:number;text:string;fontSize:number;color?:string}
 | ({type:'shape';key:string;shape:'rectangle'|'ellipse'|'diamond';color?:string;fill:string}&AgentRect)
 | {type:'material';key:string;path:string;x:number;y:number}
 | ({type:'transform';elementId:string;angle?:number}&AgentRect)
 | {type:'setText';elementId:string;text:string};
export type AgentCommand = {type:'inspect'}
 | {type:'apply';expectedRevision:string;operations:AgentOperation[];viewport?:{scrollX:number;scrollY:number;zoom:number}}
 | {type:'clip';expectedRevision:string;number:number;replace:boolean;elementId?:string;rect?:AgentRect};
export function readCanvasAgentCommand(value:unknown):AgentCommand;

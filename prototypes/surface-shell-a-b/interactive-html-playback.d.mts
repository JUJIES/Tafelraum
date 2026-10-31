export type PlaybackCommand={type:'play'|'pause'|'previous'|'next'}|{type:'seek'|'volume';value:number}|{type:'fullscreen';value:boolean};
export type PlaybackStatus={title:string;playing:boolean;canPrevious:boolean;canNext:boolean;position:number;duration:number;volume:number;timelinePosition?:number;fullscreen?:boolean;error?:string};
export function validPlaybackCommand(value:unknown):value is PlaybackCommand;
export function validPlaybackStatus(value:unknown):value is PlaybackStatus;
export function playbackCapability(value:unknown):{protocol:'room-v1';initialState:unknown;controllerEntry?:string;teacherView?:'shared'}|null;
export function playbackOutputScript(local?:boolean):string;
export function playbackSharedScript():string;
export function playbackSilentScript():string;

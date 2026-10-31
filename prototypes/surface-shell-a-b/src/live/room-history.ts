import { newElementWith } from '@excalidraw/excalidraw';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

type Change={id:string;before:ExcalidrawElement|null;after:ExcalidrawElement|null;version:number};
type Entry=Change[];
const maxRoomActions=50;
export type RoomHistoryState={undo:boolean;redo:boolean};
export type RoomHistoryCommand={type:'history';channel:string;generation:number;action:'undo'|'redo'};

export function validRoomHistoryCommand(value:unknown):value is RoomHistoryCommand {
  if(!value||typeof value!=='object')return false;
  const command=value as Partial<RoomHistoryCommand>;
  return command.type==='history'&&typeof command.channel==='string'
    &&Number.isSafeInteger(command.generation)&&command.generation!>0
    &&(command.action==='undo'||command.action==='redo');
}

/** Session-only Room actions. Every replay checks the current canonical version,
 * so a subsequent teacher edit is never overwritten by a stale Room undo. */
export class RoomActionHistory {
  private undoStack:Entry[]=[];
  private redoStack:Entry[]=[];

  clear(){this.undoStack=[];this.redoStack=[];}
  record(element:ExcalidrawElement){this.recordChanges([{before:null,after:element}]);}
  recordChanges(changes:{before:ExcalidrawElement|null;after:ExcalidrawElement|null}[]){
    if(!changes.length)return;
    this.undoStack.push(changes.map(change=>({id:(change.after??change.before)!.id,
      before:change.before,after:change.after,version:(change.after??change.before)!.version})));
    if(this.undoStack.length>maxRoomActions)this.undoStack.splice(0,this.undoStack.length-maxRoomActions);
    this.redoStack=[];
  }
  private valid(entry:Entry,elements:readonly ExcalidrawElement[],side:'before'|'after'){
    const byId=new Map(elements.map(element=>[element.id,element]));
    return entry.every(change=>{
      const current=byId.get(change.id);
      const expected=change[side];
      return current&&current.version===change.version&&current.isDeleted===(expected?.isDeleted??side==='before');
    });
  }
  private prune(stack:Entry[],elements:readonly ExcalidrawElement[],side:'before'|'after'){
    while(stack.length&&!this.valid(stack.at(-1)!,elements,side))stack.pop();
  }
  state(elements:readonly ExcalidrawElement[]):RoomHistoryState {
    this.prune(this.undoStack,elements,'after');this.prune(this.redoStack,elements,'before');
    return {undo:this.undoStack.length>0,redo:this.redoStack.length>0};
  }
  apply(action:'undo'|'redo',elements:readonly ExcalidrawElement[]){
    this.state(elements);
    const source=action==='undo'?this.undoStack:this.redoStack;
    const target=action==='undo'?this.redoStack:this.undoStack;
    const entry=source.pop();if(!entry)return null;
    const changes=new Map(entry.map(change=>[change.id,change]));
    const next=elements.map(element=>{
      const change=changes.get(element.id);if(!change)return element;
      const snapshot=action==='undo'?change.before:change.after;
      if(!snapshot)return newElementWith(element,{isDeleted:true});
      const {version:_version,versionNonce:_nonce,updated:_updated,...rest}=snapshot;
      return newElementWith(element,rest as Partial<ExcalidrawElement>);
    });
    const nextVersions=new Map(entry.map(change=>[change.id,next.find(element=>element.id===change.id)!.version]));
    for(const [id,version] of nextVersions){
      const previous=[...source].reverse().find(candidate=>candidate.some(change=>change.id===id));
      const matching=previous?.find(change=>change.id===id);
      if(matching)matching.version=version;
    }
    target.push(entry.map(change=>({...change,version:nextVersions.get(change.id)!})));
    return next;
  }
}

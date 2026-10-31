import { LIMITS, type JsonValue } from '../../../../shared/live-canvas/protocol.ts';

export type RoomMaterialStateCommand = {
  type:'material-state'; channel:string; generation:number; instanceId:string;
  baseState:JsonValue; state:JsonValue;
};

function boundedState(value:unknown):value is JsonValue {
  try {
    const text=JSON.stringify(value);
    return Boolean(text)&&new TextEncoder().encode(text).byteLength<=LIMITS.interactiveStateBytes
      &&JSON.parse(text)!==undefined;
  } catch { return false; }
}

export function validRoomMaterialStateCommand(value:unknown):value is RoomMaterialStateCommand {
  if(!value||typeof value!=='object')return false;
  const command=value as Partial<RoomMaterialStateCommand>;
  return command.type==='material-state'&&typeof command.channel==='string'
    &&Number.isSafeInteger(command.generation)&&command.generation!>0
    &&typeof command.instanceId==='string'&&command.instanceId.length>0&&command.instanceId.length<=80
    &&boundedState(command.baseState)&&boundedState(command.state);
}

const record=(value:JsonValue):value is {[key:string]:JsonValue}=>
  value!==null&&typeof value==='object'&&!Array.isArray(value);
const same=(left:JsonValue|undefined,right:JsonValue|undefined)=>JSON.stringify(left)===JSON.stringify(right);

/** Apply only the Room-changed JSON paths to the newest host state. Arrays are one value. */
export function mergeRoomMaterialState(base:JsonValue,next:JsonValue,current:JsonValue):JsonValue {
  if(same(base,next))return current;
  if(!record(base)||!record(next)||!record(current))return next;
  const merged=Object.fromEntries(Object.entries(current)) as {[key:string]:JsonValue};
  for(const key of new Set([...Object.keys(base),...Object.keys(next)])){
    if(same(base[key],next[key]))continue;
    if(!Object.hasOwn(next,key)){delete merged[key];continue;}
    merged[key]=Object.hasOwn(base,key)&&Object.hasOwn(current,key)
      ?mergeRoomMaterialState(base[key]!,next[key]!,current[key]!) :next[key]!;
  }
  if(!boundedState(merged))throw new Error('Der gemeinsame Materialzustand ist zu groß.');
  return merged;
}

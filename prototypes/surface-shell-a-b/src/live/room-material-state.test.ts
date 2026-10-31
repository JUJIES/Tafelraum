import assert from 'node:assert/strict';
import test from 'node:test';
import {mergeRoomMaterialState,validRoomMaterialStateCommand} from './room-material-state.ts';

test('Room input changes one field without replacing the teacher\'s other field',()=>{
  const base={version:1,fields:{first:{kind:'value',value:''},second:{kind:'value',value:''}}};
  const room={version:1,fields:{first:{kind:'value',value:'Schüler'},second:{kind:'value',value:''}}};
  const teacher={version:1,fields:{first:{kind:'value',value:''},second:{kind:'value',value:'Lehrkraft'}}};
  assert.deepEqual(mergeRoomMaterialState(base,room,teacher),{
    version:1,fields:{first:{kind:'value',value:'Schüler'},second:{kind:'value',value:'Lehrkraft'}}});
});

test('Room input preserves new host fields and updates the same field by last accepted action',()=>{
  assert.deepEqual(mergeRoomMaterialState({a:'old'},{a:'room'},{a:'teacher',b:'new'}),{a:'room',b:'new'});
  assert.deepEqual(mergeRoomMaterialState({a:['old']},{a:['room']},{a:['teacher'],b:true}),{a:['room'],b:true});
});

test('Room material command accepts bounded local states only',()=>{
  const command={type:'material-state',channel:'room',generation:1,instanceId:'material',baseState:{a:''},state:{a:'x'}};
  assert.equal(validRoomMaterialStateCommand(command),true);
  assert.equal(validRoomMaterialStateCommand({...command,generation:0}),false);
  assert.equal(validRoomMaterialStateCommand({...command,state:{a:'x'.repeat(70_000)}}),false);
});

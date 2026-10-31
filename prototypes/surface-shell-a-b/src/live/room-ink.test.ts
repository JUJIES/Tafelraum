import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import type { RoomInkCommand } from './room-ink.ts';

mock.module('@excalidraw/excalidraw', { namedExports: {
  convertToExcalidrawElements: (values:unknown[]) => values.map(value => ({
    ...value as object, id:'generated',groupIds:[],isDeleted:false,
  })),
} });
const { roomInkElement, validRoomInkCommand } = await import('./room-ink.ts');

const command:RoomInkCommand={
  type:'ink-commit',channel:'room',generation:2,id:'Excalidraw_ink-01',
  target:{mode:'clip',id:'clip-1'},kind:'pen',color:'#26323f',width:4,
  points:[[10,20],[25,30],[40,40]],
};

test('Room accepts native canvas IDs and rebuilds only supported ink geometry',()=>{
  assert.equal(validRoomInkCommand(command),true);
  const pen=roomInkElement(command);
  assert.equal(pen.id,command.id);
  assert.equal(pen.type,'freedraw');
  assert.equal(pen.customData?.role,'ink-pen');
  const marker=roomInkElement({...command,kind:'marker',color:'#e8c85b',width:17});
  assert.equal(marker.id,command.id);
  assert.equal(marker.type,'line');
  assert.equal(marker.customData?.role,'marker-ribbon');
});

test('Room rejects malformed or oversized gestures before touching the lesson',()=>{
  assert.equal(validRoomInkCommand({...command,id:'../board.json'}),false);
  assert.equal(validRoomInkCommand({...command,width:Infinity}),false);
  assert.equal(validRoomInkCommand({...command,points:[[Number.NaN,0]]}),false);
  assert.equal(validRoomInkCommand({...command,points:[[1_000_001,0]]}),false);
  assert.equal(validRoomInkCommand({...command,points:Array(20_001).fill([0,0])}),false);
  assert.equal(validRoomInkCommand({...command,target:{mode:'free',id:'clip-1'}}),false);
});

test('Room accepts a bounded local HTML scroll anchor with an ink gesture',()=>{
  assert.equal(validRoomInkCommand({...command,htmlScroll:{materialId:'html-1',offset:{x:0,y:71}}}),true);
  assert.equal(validRoomInkCommand({...command,htmlScroll:{materialId:'html-1',offset:{x:0,y:Infinity}}}),false);
  assert.equal(validRoomInkCommand({...command,htmlScroll:{materialId:'../html',offset:{x:0,y:71}}}),false);
  assert.equal(validRoomInkCommand({...command,htmlScroll:null} as unknown as RoomInkCommand),false);
});

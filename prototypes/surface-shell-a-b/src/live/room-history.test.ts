import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

mock.module('@excalidraw/excalidraw', { namedExports: {
  newElementWith: (element: ExcalidrawElement, patch: Partial<ExcalidrawElement>) =>
    ({ ...element, ...patch, version: element.version + 1 }),
} });
const { RoomActionHistory, validRoomHistoryCommand } = await import('./room-history.ts');

const ink = (id: string, version = 1, isDeleted = false) =>
  ({ id, version, isDeleted }) as ExcalidrawElement;

test('Room undo and redo touch only its own stroke after a teacher action', () => {
  const history = new RoomActionHistory();
  const room = ink('room');
  const teacher = ink('teacher');
  history.record(room);
  const undone = history.apply('undo', [room, teacher])!;
  assert.equal(undone.find(element => element.id === 'room')?.isDeleted, true);
  assert.equal(undone.find(element => element.id === 'teacher'), teacher);
  assert.deepEqual(history.state(undone), { undo: false, redo: true });
  const redone = history.apply('redo', undone)!;
  assert.equal(redone.find(element => element.id === 'room')?.isDeleted, false);
  assert.equal(redone.find(element => element.id === 'teacher'), teacher);
});

test('Room history skips a stroke changed by the teacher and clears redo after new ink', () => {
  const history = new RoomActionHistory();
  const first = ink('first'), second = ink('second');
  history.record(first);
  history.record(second);
  const teacherEditedSecond = ink('second', 2);
  assert.deepEqual(history.state([first, teacherEditedSecond]), { undo: true, redo: false });
  const undone = history.apply('undo', [first, teacherEditedSecond])!;
  assert.equal(undone.find(element => element.id === 'first')?.isDeleted, true);
  assert.equal(undone.find(element => element.id === 'second'), teacherEditedSecond);
  history.record(ink('third'));
  assert.deepEqual(history.state([...undone, ink('third')]), { undo: true, redo: false });
});

test('Room history command accepts only a bounded local action and generation', () => {
  assert.equal(validRoomHistoryCommand({type:'history',channel:'room',generation:1,action:'undo'}), true);
  assert.equal(validRoomHistoryCommand({type:'history',channel:'room',generation:1,action:'clear'}), false);
  assert.equal(validRoomHistoryCommand({type:'history',channel:'room',generation:0,action:'redo'}), false);
});

test('Room eraser and transform undo restore the previous native geometry as one action',()=>{
  const history=new RoomActionHistory();
  const before={...ink('shape'),x:12,y:18,width:80,height:40,angle:0} as ExcalidrawElement;
  const moved={...before,x:50,angle:0.5,version:2} as ExcalidrawElement;
  history.recordChanges([{before,after:moved}]);
  const restored=history.apply('undo',[moved])![0];
  assert.equal(restored.x,12);assert.equal(restored.angle,0);
  const redone=history.apply('redo',[restored])![0];
  assert.equal(redone.x,50);assert.equal(redone.angle,0.5);
  const erased={...redone,isDeleted:true,version:redone.version+1} as ExcalidrawElement;
  history.recordChanges([{before:redone,after:erased}]);
  const unerased=history.apply('undo',[erased])![0];
  assert.equal(unerased.isDeleted,false);assert.equal(unerased.x,50);
});

test('several Room transformations on the same object can all be undone and redone',()=>{
  const history=new RoomActionHistory();
  const first={...ink('object'),x:0} as ExcalidrawElement;
  const second={...first,x:20,version:2} as ExcalidrawElement;
  const third={...second,x:40,version:3} as ExcalidrawElement;
  history.recordChanges([{before:first,after:second}]);
  history.recordChanges([{before:second,after:third}]);
  const backOne=history.apply('undo',[third])!;
  assert.equal(backOne[0].x,20);
  assert.deepEqual(history.state(backOne),{undo:true,redo:true});
  const backTwo=history.apply('undo',backOne)!;
  assert.equal(backTwo[0].x,0);
  const forwardOne=history.apply('redo',backTwo)!;
  assert.equal(forwardOne[0].x,20);
  const forwardTwo=history.apply('redo',forwardOne)!;
  assert.equal(forwardTwo[0].x,40);
});

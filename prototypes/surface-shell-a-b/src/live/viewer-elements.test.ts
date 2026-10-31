import assert from "node:assert/strict";
import test from "node:test";
import type { PublicElement } from "../../../../shared/live-canvas/protocol";
import { discardCommittedInkPreviews, incrementalLinearElementIndex } from "./viewer-elements.ts";

const rectangle = (id: string): PublicElement => ({ id, type: "rectangle", x: 0, y: 0, width: 10, height: 10 });
const line = (id: string, points: [number,number][]): PublicElement => ({ id, type: "line", x: 0, y: 0, width: 10, height: 10, points });

test("viewer isolates a single changed linear delta while retaining the rest of the scene", () => {
  const paper = rectangle("paper"), before = line("ink", [[0,0],[1,1]]), after = line("ink", [[0,0],[1,1],[2,2]]);
  assert.equal(incrementalLinearElementIndex([paper,before],[paper,after],[{id:"paper"},{id:"ink"}]),1);
});

test("viewer falls back for snapshots, order changes, multiple changes and bound lines", () => {
  const a = rectangle("a"), b = line("b", [[0,0],[1,1]]), changedA = {...a,x:1}, changedB = line("b", [[0,0],[2,2]]);
  assert.equal(incrementalLinearElementIndex([a,b],[changedA,changedB],[{id:"a"},{id:"b"}]),null);
  assert.equal(incrementalLinearElementIndex([a,b],[b,a],[{id:"a"},{id:"b"}]),null);
  assert.equal(incrementalLinearElementIndex([a,b],[{...a},{...b}],[{id:"a"},{id:"b"}]),null);
  assert.equal(incrementalLinearElementIndex([a,b],[a,{...changedB,boundElements:[{id:"label",type:"text"}]}],[{id:"a"},{id:"b"}]),null);
});

test("canonical content clears only superseded transient ink previews", () => {
  const previews=new Map([["committed",1],["removed",2],["active",3]]);
  discardCommittedInkPreviews(previews,[rectangle("committed")],["removed"]);
  assert.deepEqual([...previews],[['active',3]]);
});

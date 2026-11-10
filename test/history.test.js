import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHistory} from '../src/history.js';
test('history coalesces typing, undoes, redoes, and branches after a new edit',()=>{
  let now=0;const history=createHistory({clock:()=>now});history.record('start');
  history.record('a','typing');now+=100;history.record('ab','typing');
  assert.equal(history.undo(),'start');assert.equal(history.redo(),'ab');
  history.undo();history.record('new','typing');assert.equal(history.canRedo,false);assert.equal(history.undo(),'start');
});
test('long pointer gestures are one command and history obeys its entry limit',()=>{
  let now=0;const history=createHistory({limit:3,clock:()=>now});history.record('start');
  history.record('drag1','gesture',Infinity);now+=10000;history.record('drag2','gesture',Infinity);
  assert.equal(history.undo(),'start');history.redo();history.record('third','3');history.record('fourth','4');
  assert.equal(history.undo(),'third');assert.equal(history.undo(),'drag2');assert.equal(history.canUndo,false);
});

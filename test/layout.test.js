import {test} from 'node:test';
import assert from 'node:assert/strict';
import {insertRowAfter,removeRowAfter,moveGroup,ROW_HEIGHT} from '../src/layout.js';
import {deserialize,serialize} from '../src/model.js';
test('row insertion shifts all later objects, including objects to the right on the same row',()=>{
  const a={id:'a',x:50,y:50},b={id:'b',x:100,y:50},c={id:'c',x:0,y:100},d={id:'d',x:0,y:0};
  insertRowAfter([c,b,a,d],'a');
  assert.equal(a.y,50);assert.equal(b.y,50+ROW_HEIGHT);assert.equal(c.y,100+ROW_HEIGHT);assert.equal(d.y,0);
});
test('group motion preserves relative spacing when clamped at the canvas edge',()=>{
  const original=[{id:'a',x:20,y:40},{id:'b',x:100,y:140}];
  const result=moveGroup(original,-100,-100);
  assert.deepEqual(result,[{id:'a',x:0,y:0},{id:'b',x:80,y:100}]);
  assert.equal(original[0].x,20);
});
test('manually resized notes retain both dimensions through JSON',()=>{
  const note={id:'note',type:'text',x:0,y:0,width:90,height:45,text:'A note',manualSize:true};
  assert.deepEqual(deserialize(serialize([note])),[note]);
});
test('removing an inserted row restores later object positions and preserves earlier fields',()=>{
  const regions=[{id:'a',x:50,y:100},{id:'b',x:200,y:100},{id:'c',x:0,y:250}];
  insertRowAfter(regions,'a',48);regions.push({id:'blank',x:50,y:148});
  assert.equal(removeRowAfter(regions,'blank',48),48);
  assert.equal(regions[0].y,100);assert.equal(regions[1].y,100);assert.equal(regions[2].y,250);
});
test('closing a blank row clamps the upward motion uniformly at the top edge',()=>{
  const regions=[{id:'blank',x:50,y:10},{id:'b',x:100,y:10},{id:'c',x:0,y:60}];
  assert.equal(removeRowAfter(regions,'blank'),10);assert.equal(regions[1].y,0);assert.equal(regions[2].y,50);
});

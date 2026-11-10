import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateControl,advanceControl} from '../src/control-values.js';
import {region,serialize,deserialize} from '../src/model.js';
import {panPlot} from '../src/plot-view.js';
test('numeric playback follows the step grid, wraps, and stops after its last value',()=>{
  const r={...region('slider'),min:'1',max:'2',step:'0.3',value:'1'};
  const values=[];for(let i=0;i<5;i++){const data=evaluateControl(r,new Map()).control;values.push(data.numericValue);assert.equal(advanceControl(r,data),true);}
  assert.deepEqual(values,[1,1.3,1.6,1.9,1]);r.value='1.9';r.loop=false;assert.equal(advanceControl(r,evaluateControl(r,new Map()).control),false);assert.equal(r.value,'1.9');
});
test('vector playback preserves ordering and duplicates and accepts row/column matrices',()=>{
  const r={...region('slider'),sequence:'values',frame:'0',fps:'5'},scope=new Map([['values',[3,1,1,4]]]);
  const values=[];for(let i=0;i<5;i++){const data=evaluateControl(r,scope).control;values.push(data.numericValue);advanceControl(r,data);}
  assert.deepEqual(values,[3,1,1,4,3]);
  for(const sequence of ['[3,1,4]','[3;1;4]','[[3,1,4]]'])assert.equal(evaluateControl({...r,sequence,frame:'2'},new Map()).value,4);
  assert.throws(()=>evaluateControl({...r,sequence:'[1,NaN]'},new Map()),/finite numbers/);
  assert.throws(()=>evaluateControl({...r,sequence:'[1]'},new Map()),/2–5000/);
  assert.throws(()=>evaluateControl({...r,fps:'0'},scope),/Frames per second/);
  assert.throws(()=>evaluateControl({...r,fps:'31'},scope),/Frames per second/);
});
test('animation settings and position survive JSON without an autoplay flag',()=>{
  const r={...region('slider'),sequence:'0:0.1:1',frame:'4',fps:'12',loop:false};assert.deepEqual(deserialize(serialize([r])),[r]);
  assert.throws(()=>deserialize(serialize([{...r,loop:'yes'}])),/animation loop/);
});
test('plot panning follows pointer motion without changing the axis scale',()=>{
  const view={xMin:2,yMin:3,xScale:.1,yScale:.2};panPlot(view,40,25);assert.deepEqual(view,{xMin:-2,yMin:8,xScale:.1,yScale:.2});
});

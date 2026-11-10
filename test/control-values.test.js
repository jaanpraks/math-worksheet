import {test} from 'node:test';
import assert from 'node:assert/strict';
import {worksheet} from '../src/engine.js';
import {region,deserialize,serialize} from '../src/model.js';
import {evaluateControl} from '../src/control-values.js';
import {removeCanvasRow} from '../src/layout.js';
test('a slider defines a shared variable and updates equations and plot samples',()=>{
  const slider={...region('slider',0,0),name:'q',value:'3',min:'0',max:'5',step:'0.25'};
  const equation={...region('math',0,150),source:'q^2'},plot={...region('plot',0,300),series:'q*x',min:'0',max:'2'};
  let result=worksheet([slider,equation,plot]);assert.equal(result.get(equation.id).text,'9');assert.deepEqual(result.get(plot.id).series[0].at(-1),[2,6]);
  slider.value='4';result=worksheet([slider,equation,plot]);assert.equal(result.get(equation.id).text,'16');
  assert.deepEqual(deserialize(serialize([slider])),[slider]);
});
test('radio options may use prior variables and mathematical expressions',()=>{
  const scope=new Map([['q',2]]),r={...region('radio'),options:'q\n2*q\npi/2',choice:'1'};
  assert.equal(evaluateControl(r,scope).value,4);r.choice='2';assert.equal(evaluateControl(r,scope).value,Math.PI/2);
  assert.deepEqual(deserialize(serialize([r])),[r]);
});
test('slider settings validate, snap, clamp, and can attach physical units',()=>{
  const r={...region('slider'),value:'20',min:'0',max:'10',step:'0.5',unit:'kg'};
  assert.equal(evaluateControl(r,new Map()).value.toNumber('kg'),10);
  r.value='1.24';assert.equal(evaluateControl(r,new Map()).control.numericValue,1);
  r.step='0';assert.throws(()=>evaluateControl(r,new Map()),/Step/);
  r.step='1';r.min='10';assert.throws(()=>evaluateControl(r,new Map()),/Minimum/);
});
test('invalid control definitions do not leave a stale variable in the scope',()=>{
  const r={...region('slider',0,0),name:'q',min:'10',max:'1'},equation={...region('math',0,100),source:'q+1'};
  const result=worksheet([r,equation]);assert.ok(result.get(r.id).error);assert.match(result.get(equation.id).error,/Undefined symbol q/);
});
test('repeated canvas row removal keeps shifting later objects without changing content',()=>{
  const regions=[{x:100,y:200,text:'kept'},{x:0,y:20,text:'earlier'}];
  let point={x:100,y:150};point=removeCanvasRow(regions,point);point=removeCanvasRow(regions,point);
  assert.equal(point.y,74);assert.equal(regions[0].y,124);assert.equal(regions[0].text,'kept');assert.equal(regions[1].y,20);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {requestsResult,evaluationSource} from '../src/equations.js';
import {worksheet} from '../src/engine.js';
import {serialize,deserialize,region} from '../src/model.js';
import {sourceToLatex} from '../src/expressions.js';
test('only a final evaluation equals requests an answer, without changing comparisons',()=>{
  for(const source of ['a=2','2==2','2>=1','2<=3','2!=3','2=='])assert.equal(requestsResult(source),false,source);
  assert.equal(requestsResult('a=2= '),true);assert.equal(evaluationSource('a=2= '),'a=2');
  assert.equal(sourceToLatex('sqrt(4)='),'\\sqrt{4}=');
});
test('hidden definitions evaluate, display-only equations never change scope or report evaluation errors',()=>{
  const math=(id,source,y,displayOnly=false)=>({id,type:'math',source,y,x:0,displayOnly});
  const results=worksheet([math('a','a=3',0),math('skip','a=99=',1,true),math('formula','unknown(x)=',2,true),math('use','a*2=',3)]);
  assert.equal(results.get('a').text,'3');assert.deepEqual(results.get('skip'),{text:''});assert.deepEqual(results.get('formula'),{text:''});assert.equal(results.get('use').text,'6');
});
test('display-only mode survives save/load and validates its type',()=>{
  const equation={...region('math'),displayOnly:true};assert.deepEqual(deserialize(serialize([equation])),[equation]);
  assert.throws(()=>deserialize(serialize([{...equation,displayOnly:'true'}])),/equation mode/);
});

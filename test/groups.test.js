import {test} from 'node:test';
import assert from 'node:assert/strict';
import {statements,groupRows} from '../src/groups.js';
import {sourceToLatex} from '../src/expressions.js';
import {unitSource} from '../src/units.js';
import {worksheet} from '../src/engine.js';
import {region,serialize,deserialize} from '../src/model.js';
test('statement groups preserve matrix rows, strings, and comments',()=>{
  assert.deepEqual(statements('A=[1,2;3,4];label="a;b";det(A)'),['A=[1,2;3,4]','label="a;b"','det(A)']);
  assert.equal(statements('a=3 # ignore ; here\nb=4').length,1);
  const source='A=[1,2;3,4];b=det(A);b*2=';const latex=sourceToLatex(source);assert.equal(groupRows(latex).length,3);assert.match(latex,/bmatrix/);assert.equal(statements(unitSource(latex)).length,3);
});
test('groups evaluate sequentially, define later worksheet values and expose the last result',()=>{
  const r={id:'g',type:'math',source:'a=3;b=4;c=sqrt(a^2+b^2)=',unitMode:'explicit',x:0,y:0},next={id:'n',type:'math',source:'c*2',x:0,y:100};
  const result=worksheet([r,next]);assert.equal(result.get('g').text,'5');assert.equal(result.get('n').text,'10');
  r.source='a=3;b=4;c=missing';assert.match(worksheet([r,next]).get('g').error,/missing/);assert.match(worksheet([r,next]).get('n').error,/Undefined symbol c/);
});
test('display-only groups do not execute and native Math.js semicolon result suppression stays hidden',()=>{
  const group={id:'g',type:'math',source:'a=3;b=4;',displayOnly:true,x:0,y:0};assert.deepEqual(worksheet([group]).get('g'),{text:''});
});
test('short ASCII explanations are saved with any region and validated',()=>{
  const r={...region('math'),description:'A short explanation.'};assert.deepEqual(deserialize(serialize([r])),[r]);
  assert.throws(()=>deserialize(serialize([{...r,description:'x'.repeat(251)}])),/explanation/);assert.throws(()=>deserialize(serialize([{...r,description:'Greek: \u03b1'}])),/explanation/);
});

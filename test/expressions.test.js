import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from 'mathjs';
import {sourceToLatex} from '../src/expressions.js';
import {unitSource} from '../src/units.js';
test('FFT and inverse FFT names and vector dimensions survive visual translation',()=>{
  for(const source of ['fft([1,0,0,0])','ifft(fft([1,0,0,0]))']){
    const latex=sourceToLatex(source),roundTrip=unitSource(latex);
    assert.match(latex,/operatorname/);assert.doesNotMatch(latex,/bmatrix/);
    assert.deepEqual(evaluate(roundTrip).toArray?.() ?? evaluate(roundTrip),evaluate(source).toArray?.() ?? evaluate(source));
  }
});
test('assignments and multi-letter variable references remain visible and evaluate correctly',()=>{
  const scope=new Map();evaluate(unitSource(sourceToLatex('signal=[1,0,0,0]')),scope);
  const value=evaluate(unitSource(sourceToLatex('fft(signal)')),scope);
  assert.equal(value.size()[0],4);
  assert.equal(value.get([0]).re,1);
});
test('invalid and incomplete raw expressions still have a visible literal representation',()=>{
  assert.match(sourceToLatex('fft('),/\\text/);assert.equal(sourceToLatex(''),'');
});

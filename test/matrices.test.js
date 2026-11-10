import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from 'mathjs';
import {unitSource} from '../src/units.js';
import {sourceToLatex} from '../src/expressions.js';
import {squareMatrices} from '../src/matrices.js';
import {plotSeries} from '../src/engine.js';
test('matrix environments become square brackets and retain rows and columns',()=>{
  for(const env of ['matrix','pmatrix','bmatrix','Bmatrix','smallmatrix']){
    const latex=`\\begin{${env}}1&2\\\\3&4\\end{${env}}`;
    assert.match(squareMatrices(latex),/begin\{bmatrix\}/);
    assert.deepEqual(evaluate(unitSource(latex)).toArray(),[[1,2],[3,4]]);
  }
});
test('comma and semicolon syntax and nested arrays produce equivalent visual matrices',()=>{
  for(const source of ['[1,2;3,4]','[[1,2],[3,4]]']){
    const latex=sourceToLatex(source);assert.match(latex,/begin\{bmatrix\}/);
    assert.deepEqual(evaluate(unitSource(latex)).toArray(),[[1,2],[3,4]]);
  }
  assert.deepEqual(evaluate(unitSource(sourceToLatex('[1,2]'))).size(),[2]);
  assert.deepEqual(evaluate(unitSource(sourceToLatex('[1;2]'))).size(),[2,1]);
});
test('row and column vectors can supply X/Y plot series without changing matrix arithmetic',()=>{
  const result=plotSeries({series:'[1;2;3];[4,5,6]',min:'0',max:'1'},new Map());
  assert.deepEqual(result[0],[[1,4],[2,5],[3,6]]);
});

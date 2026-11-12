import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from '../src/math-runtime.js';
import {sourceToLatex} from '../src/expressions.js';
import {unitSource,unitToken} from '../src/units.js';
import {mappedCall} from '../src/function-mappings.js';
test('formatting whitespace never changes identifiers and explicit word separators are stable',()=>{
 for(const latex of ['ABC',String.raw`\mathit{ABC}`,'A B C'])assert.equal(unitSource(latex),'ABC');
 assert.equal(unitSource(String.raw`a\;and\;b`),'a and b');assert.equal(unitSource(String.raw`a\quad b`),'a b');assert.equal(unitSource(String.raw`\sin\left( x \right)`),'sin(x)');
 for(let source='a and b',i=0;i<5;i++){source=unitSource(sourceToLatex(source));assert.equal(source,'a and b');}
});
test('boolean expressions and comparisons round trip without changing operators',()=>{
 for(const source of ['true and false','true xor false','not false','2==2','2!=3','1<=2','3>=2']){const converted=unitSource(sourceToLatex(source));assert.equal(evaluate(converted),evaluate(source),converted);assert.doesNotMatch(converted,/[\\∧⊻¬]/);}
});
test('fraction powers preserve the whole base and nested arithmetic precedence',()=>{
 assert.equal(evaluate(unitSource(String.raw`\frac{6}{3}^2`)),4);assert.equal(evaluate(unitSource(String.raw`2\frac{3}{4}`)),1.5);assert.equal(evaluate(unitSource(String.raw`\frac{1+2}{3+4}`)),3/7);assert.equal(evaluate(unitSource(String.raw`\sin^{2}\left(0\right)`)),0);assert.throws(()=>unitSource(String.raw`\sin x^2`),/parentheses/);
});

test('grouped expressions and fraction factorials retain their mathematical boundaries',()=>{
 assert.equal(evaluate(unitSource(String.raw`{1+2}^2`)),9);
 assert.equal(evaluate(unitSource(String.raw`{1+2}3`)),9);
 assert.equal(evaluate(unitSource(String.raw`\frac{6}{3}!`)),2);
});
test('quoted strings and explicit unit calls round trip instead of leaking LaTeX',()=>{
 for(const value of ['hello world','two  spaces','C:\\tmp','braces {a}; [b]','quote "x" and $5','tilde ~ caret ^ percent %']){const source=JSON.stringify(value);assert.equal(evaluate(unitSource(sourceToLatex(source))),value);}
 assert.equal(unitSource(sourceToLatex('unit("m")')),'unit("m")');assert.ok(Math.abs(evaluate(unitSource(sourceToLatex('5 cm to inch'))).toNumber('inch')-5/2.54)<1e-12);
});
test('metadata remains semantic and parser intermediates cannot leak into source',()=>{
 for(const name of ['kg','Pa','Hz'])assert.equal(unitSource(`5\\cdot${unitToken(name)}`),`5*unit("${name}")`);
 for(const source of ['map([1,4,9],sqrt)','sumOver(k^2,k,1,3)','nthRoot(27,3)','planckConstant','x_1+alpha_2'])assert.doesNotMatch(unitSource(sourceToLatex(source)),/WSOP|WSNAME|WSUNIT|WSSPACE|\\/);
});
test('unsupported or unfinished notation fails explicitly instead of becoming another expression',()=>{
 for(const latex of [String.raw`\foo{x}`,String.raw`\int x`,String.raw`\placeholder{}`,String.raw`\text{plain text}`,String.raw`\sqrt{`,String.raw`\begin{cases}x\end{cases}`])assert.throws(()=>unitSource(latex));
 assert.throws(()=>unitSource(sourceToLatex('fft(')),/literally/);
 assert.throws(()=>unitSource(mappedCall('[1,2]','sin').replace('\\right)','\\right)+1')),/mapped function/);
});

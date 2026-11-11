import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from '../src/math-runtime.js';
import {unitSource,requireAcceptedUnits,unitToken} from '../src/units.js';
import {sourceToLatex} from '../src/expressions.js';
import {worksheet} from '../src/engine.js';
import {serialize,deserialize,region} from '../src/model.js';
const visual=(latex,scope=new Map())=>{const source=unitSource(latex);requireAcceptedUnits(source,scope);return evaluate(source,scope);};
test('natural and arbitrary-base logarithms and indexed roots evaluate and round trip',()=>{
  assert.equal(visual(String.raw`\log_2(8)`),3);assert.equal(visual(String.raw`\log_{10}{100}`),2);
  assert.equal(visual(String.raw`\sqrt[3]{27}`),3);assert.equal(visual(String.raw`\sqrt[3]{-8}`),-2);
  assert.equal(visual(String.raw`\sqrt{9}\sqrt{4}`),6);
  for(const source of ['log(100)','log10(100)','log2(8)','log(81,3)','nthRoot(32,5)','sqrt(9)','log(nthRoot(256,2),2)'])assert.ok(Math.abs(visual(sourceToLatex(source))-evaluate(source))<1e-12,source);
  assert.equal(visual(String.raw`\log_b\left(\frac{64}{2}\right)`,new Map([['b',2]])),5);
});
test('absolute value, complex modulus, real/imaginary parts and modulo work',()=>{
  assert.equal(visual(String.raw`|-3|`),3);assert.equal(visual(String.raw`\lvert3+4i\rvert`),5);
  assert.equal(visual(String.raw`\Re(3+4i)`),3);assert.equal(visual(String.raw`\Im(3+4i)`),4);
  assert.equal(visual(String.raw`\lvert\lvert-3\rvert-5\rvert`),2);
  assert.equal(visual(String.raw`\left|\left|-3\right|-5\right|`),2);
  for(const source of ['abs(-3)','abs(complex(3,4))','re(complex(3,4))','im(complex(3,4))','mod(17,5)'])assert.equal(visual(sourceToLatex(source)),evaluate(source),source);
});
test('bounded sums/products preserve surrounding precedence and worksheet variables',()=>{
  const scope=new Map([['k',99],['a',2]]);
  assert.equal(visual(String.raw`\sum_{k=1}^{3} k^2+1`,scope),15);
  assert.equal(visual(String.raw`\prod_{k=1}^{4}\left(k\right)`,scope),24);
  assert.equal(visual(String.raw`\sum^{3}_{k=1}\left(a*k+1\right)`,scope),15);
  assert.equal(scope.get('k'),99);assert.equal(scope.has('j'),false);
  assert.equal(evaluate('sumOver(j,j,4,3)'),0);assert.equal(evaluate('productOver(j,j,4,3)'),1);
  assert.equal(visual(`\\sum_{k=1}^{3}\\left(k\\cdot${unitToken('kg')}\\right)`).toNumber('kg'),6);
});
test('nested reductions and names that resemble units use local index scopes',()=>{
  assert.equal(visual(String.raw`\sum_{j=1}^{3}\left(\sum_{m=1}^{j}m\right)`),10);
  assert.equal(visual(String.raw`\sum_{m=1}^{3}m`),6);
  assert.throws(()=>requireAcceptedUnits('sumOver(m,m,1,3)+m',new Map()),/Press Tab/);
});
test('reductions reject invalid bounds, assignments, and excessive nested work',()=>{
  for(const expression of ['sumOver(k,k,1.2,3)','sumOver(k,k,1,Infinity)','sumOver(k,k,1,5001)','sumOver(sumOver(j,j,1,100),k,1,100)'])assert.throws(()=>evaluate(expression),/bounds|5000/);
  assert.throws(()=>evaluate('sumOver(a=3,k,1,3)'),/Assignments/);
  assert.equal(evaluate('sumOver(k,k,1,3)'),6);
});
test('reductions round trip through display, save/load and the worksheet evaluator',()=>{
  for(const source of ['sumOver(k^2,k,1,3)','productOver(k,k,1,4)','sumOver(k,k,1,3)^2']){
    const r={...region('math'),source:unitSource(sourceToLatex(source))+'=',latex:sourceToLatex(source)+'=',unitMode:'explicit'};
    const [loaded]=deserialize(serialize([r]));assert.equal(worksheet([loaded]).get(r.id).text,String(evaluate(source)));
  }
});
test('incomplete operator templates report conversion errors instead of guessing',()=>{
  for(const latex of [String.raw`\log_2`,String.raw`|x`,String.raw`\sum_{k}^{3}k`,String.raw`\prod_{k=1}`])assert.throws(()=>unitSource(latex),/argument|bars|index|bounds/);
});
test('graphical map preserves Math.js argument order, collection shape and function references',()=>{
  for(const source of ['map([1,4,9],sqrt)','map([[1,-2],[3,-4]],abs)','map([1,2,3],sin)']){
    const latex=sourceToLatex(source);assert.match(latex,/\\overrightarrow/);assert.deepEqual(evaluate(unitSource(latex)).toArray(),evaluate(source).toArray());
  }
  const scope=new Map();evaluate('v=[1,2,3]',scope);evaluate('f(x)=x^2',scope);
  assert.deepEqual(evaluate(unitSource(sourceToLatex('map(v,f)')),scope).toArray(),[1,4,9]);
  evaluate('square(x)=x^2',scope);
  assert.deepEqual(visual(String.raw`\operatorname{map}(\vec{v},\htmlData{worksheet-function=1}{square})`,scope).toArray(),[1,4,9]);
});
test('custom function names stay intact and mapped values feed plot vectors',()=>{
  const math=(id,source,y)=>({...region('math'),id,source,latex:sourceToLatex(source),y});
  const rows=[math('t','t=[1,2,3]',100),math('f',unitSource(String.raw`\operatorname{sinc}(x)=\operatorname{sin}(x)/x`),150),math('y',unitSource(sourceToLatex('y=map(t,sinc)')),200),{...region('plot'),id:'plot',y:300,series:'t ; y'}];
  const results=worksheet(rows),points=results.get('plot').series[0];assert.equal(points.length,3);
  points.forEach(([x,y])=>assert.ok(Math.abs(y-Math.sin(x)/x)<1e-12));
  for(const source of ['dot([1,2,3],[4,5,6])','cross([1,0,0],[0,1,0])'])assert.equal(evaluate(unitSource(sourceToLatex(source))).toString(),evaluate(source).toString());
});

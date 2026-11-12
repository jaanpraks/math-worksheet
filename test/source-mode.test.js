import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safeGraphicalLatex} from '../src/source-mode.js';
import {worksheet} from '../src/engine.js';
import {region,serialize,deserialize} from '../src/model.js';
import {unitSource} from '../src/units.js';
test('source mode preserves multiline Math.js strings, comments, names and units',()=>{
 const r={...region('math'),displayMode:'source',source:'a=3 # comment\nlabel="hello world"\na*4',sourceHeight:155};assert.equal(worksheet([r]).get(r.id).text,'12');assert.deepEqual(deserialize(serialize([r])),[r]);r.source='5 cm to inch';assert.match(worksheet([r]).get(r.id).text,/1.96850394 inch/);
});
test('graphical conversion accepts equivalent expressions and refuses meaning changes',()=>{
 for(const source of ['2+3','sinc(x)=sin(x)/x','map([1,2],sin)','[1,2;3,4]','log(8,2)'])assert.notEqual(safeGraphicalLatex(source),null,source);
 for(const source of ['a==3','a=','x="a b"'])assert.equal(safeGraphicalLatex(source),null,source);
});
test('explicit graphical separators preserve boolean and unit conversion keywords',()=>{
 for(const [latex,expected] of [[String.raw`1\;xor\;0`,'xor'],[String.raw`1>0\;and\;2<5`,'and'],[String.raw`5\;cm\;to\;inch`,'to']])assert.match(unitSource(latex),new RegExp(`\\s${expected}\\s`));
});

test("function formatting and matrix row spacing retain their meaning",()=>{
 assert.equal(unitSource(String.raw`A=\begin{bmatrix}1 & 2\\ 3 & 4\end{bmatrix}=`),"A=[[1,2],[3,4]]=");
 assert.equal(unitSource(String.raw`sinc(x)=\frac{\operatorname{\mathrm{sin}}\left(x\right)}{x}`),"sinc(x)=(sin(x))/(x)");
});

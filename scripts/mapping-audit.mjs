import {mkdirSync,writeFileSync} from 'node:fs';
import * as math from 'mathjs';
import {sourceToLatex} from '../src/expressions.js';
import {unitSource,requireAcceptedUnits} from '../src/units.js';
import {normalize} from '../src/engine.js';
const sources=[
 '2+3*4','sqrt(9)','nthRoot(27,3)','sin(pi/2)','asin(0.5)','sinh(1)',
 'log(100)','log10(100)','log2(8)','log(8,2)','log(100,10)','exp(2)',
 '[1,2,3]','[1,2;3,4]','[1,2] * [3;4]','det([1,2;3,4])','inv([1,2;3,4])',
 'transpose([1,2;3,4])',"[1,2;3,4]'",'sum([1,2,3])','[10,20,30][2]','[1,2;3,4][2,1]',
 '[1,2;3,4].*[2,3;4,5]','1:2:9','[1,2]+[3,4]',
 'a_1=3','ABC=12','mass=3','f(x)=x^2','derivative("x^2","x")',
 '2 < 3','2 <= 3','2 == 3','2 != 3','true and false','2<3 ? 10 : 20',
 '5!','abs(-3)','floor(2.8)','ceil(2.2)','round(2.6)','mod(7,3)','5%','complex(2,3)',
 'integral(x^2,x)','integrate(x^2,x)','sum(k,k,1,3)'
];
const visuals=[
 ['fraction',String.raw`\frac{1}{2}+\frac{1}{3}`],
 ['square root',String.raw`\sqrt{9}`],['cube root',String.raw`\sqrt[3]{27}`],
 ['natural log',String.raw`\ln(100)`],['unbased log',String.raw`\log(100)`],
 ['base 2 log',String.raw`\log_2(8)`],['base 10 log',String.raw`\log_{10}(100)`],
 ['log with fraction',String.raw`\log_2\left(\frac{8}{2}\right)`],
 ['sine',String.raw`\sin\left(\frac{\pi}{2}\right)`],['inverse sine',String.raw`\sin^{-1}(0.5)`],
 ['square matrix',String.raw`\begin{bmatrix}1&2\\3&4\end{bmatrix}`],
 ['column vector',String.raw`\begin{bmatrix}1\\2\end{bmatrix}`],
 ['one-row matrix',String.raw`\begin{bmatrix}1&2\end{bmatrix}`],
 ['determinant bars',String.raw`\begin{vmatrix}1&2\\3&4\end{vmatrix}`],
 ['det function',String.raw`\det\left(\begin{bmatrix}1&2\\3&4\end{bmatrix}\right)`],
 ['matrix inverse',String.raw`\begin{bmatrix}1&2\\3&4\end{bmatrix}^{-1}`],
 ['matrix transpose',String.raw`\begin{bmatrix}1&2\\3&4\end{bmatrix}^{T}`],
 ['subscript name',String.raw`a_1=3`],['matrix element subscript',String.raw`A_{1,2}`],
 ['definite integral',String.raw`\int_0^1 x^2\,dx`],
 ['integral with differential',String.raw`\int_0^1 x^2\,\mathrm{d}x`],
 ['indefinite integral',String.raw`\int x^2\,dx`],
 ['sum',String.raw`\sum_{k=1}^{3} k`],['product',String.raw`\prod_{k=1}^{3} k`],
 ['derivative fraction',String.raw`\frac{d}{dx}x^2`],
 ['absolute value',String.raw`\left|-3\right|`],['floor notation',String.raw`\lfloor 2.8\rfloor`],
 ['piecewise',String.raw`\begin{cases}1&x>0\\0&x\le 0\end{cases}`]
];
function evaluate(source){try{return {value:math.format(math.evaluate(source,new Map()),{precision:12})};}catch(error){return {error:error.message};}}
function visual(latex){const source=normalize(unitSource(latex));let worksheetError;try{requireAcceptedUnits(source,new Map());}catch(error){worksheetError=error.message;}return {latex,source,...evaluate(source),...(worksheetError?{worksheetError}:{})};}
const roundTrips=sources.map(source=>{const expected=evaluate(source);const converted=visual(sourceToLatex(source));return {input:source,expected,...converted,same:expected.value!==undefined && expected.value===converted.value};});
const visualInputs=visuals.map(([name,latex])=>({name,...visual(latex)}));
const result={versions:{mathjs:math.version,mathlive:'0.111.4'},roundTrips,visualInputs,integrationFunctions:{integral:typeof math.integral,integrate:typeof math.integrate}};
mkdirSync(new URL('../test-results/',import.meta.url),{recursive:true});
writeFileSync(new URL('../test-results/mapping-audit.json',import.meta.url),JSON.stringify(result,null,2));
for(const row of roundTrips)console.log(JSON.stringify({input:row.input,expected:row.expected,latex:row.latex,source:row.source,value:row.value,error:row.error,worksheetError:row.worksheetError,same:row.same}));
console.log('VISUAL INPUTS');for(const row of visualInputs)console.log(JSON.stringify(row));


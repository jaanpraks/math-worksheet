import { parse } from 'mathjs';
import { convertLatexToAsciiMath } from 'mathlive';
import { squareMatrices } from './matrices.js';
import { requestsResult,evaluationSource } from './equations.js';
import {statements,groupLatex,groupRows} from './groups.js';

const conventional=new Set(['sqrt','cbrt','abs','sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','log','log10','log2','exp']);
const symbols=new Set(['pi','theta','mu','alpha','beta','gamma','delta','epsilon','lambda','omega','phi','sigma','Infinity']);
function literal(source) {
  const escaped=source.replace(/\\/g,'\\backslash ').replace(/[{}#$%&_]/g,c=>`\\${c}`).replace(/\^/g,'\\textasciicircum ').replace(/~/g,'\\textasciitilde ');
  return `\\text{${escaped.replace(/\r?\n/g,' ')}}`;
}
export function sourceToLatex(source) {
  if(!source.trim())return '';
  const rows=statements(source);if(rows.length>1)return groupLatex(rows.map(sourceToLatex));
  try {
    return parse(evaluationSource(source)).toTex({parenthesis:'auto',handler:(node,options)=>{
      // Math.js normally renders a 1D array as a column matrix. Keep vector
      // brackets so visual editing does not silently change its dimension.
      if(node.isArrayNode){
        const rows=node.items;
        if(rows.length && rows.every(row=>row.isArrayNode && row.items.length===rows[0].items.length && row.items.every(cell=>!cell.isArrayNode)))
          return `\\begin{bmatrix}${rows.map(row=>row.items.map(cell=>cell.toTex(options)).join('&')).join('\\\\')}\\end{bmatrix}`;
        return `\\left[${rows.map(item=>item.toTex(options)).join(',')}\\right]`;
      }
      if(node.isFunctionNode && node.fn.isSymbolNode && !conventional.has(node.fn.name))
        return `\\operatorname{${node.fn.name}}\\left(${node.args.map(arg=>arg.toTex(options)).join(',')}\\right)`;
      if(node.isSymbolNode && /^[A-Za-z][A-Za-z0-9]*$/.test(node.name) && node.name.length>1 && !symbols.has(node.name))return `\\mathit{${node.name}}`;
      return undefined;
    }}) + (requestsResult(source)?'=':'');
  }catch{return literal(source);}
}

// MathLive's generic ASCII exporter separates operator-name letters. Preserve
// named functions and multi-letter identifiers as single Math.js identifiers.
export function expressionAscii(latex) {
  if(latex.trim()==='\\placeholder{}')return '';
  const rows=groupRows(latex);if(rows)return rows.map(expressionAscii).join(';');
  const names=[];
  const replaced=squareMatrices(latex).replace(/\\(?:operatorname|mathrm|mathit)\{([A-Za-z][A-Za-z0-9_]*)\}/g,(_,name)=>{
    const id=names.push(name)-1;return `\\text{WSNAME${id}}`;
  });
  return convertLatexToAsciiMath(replaced).replace(/"WSNAME(\d+)"/g,(_,id)=>names[Number(id)]);
}

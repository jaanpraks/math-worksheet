import { parse } from 'mathjs';
import {isUnit,unitToken} from './units.js';
import { requestsResult,evaluationSource } from './equations.js';
import {statements,groupLatex} from './groups.js';
import {renderFunction} from './function-mappings.js';
import {greekSymbol} from './greek-symbols.js';

const conventional=new Set(['sqrt','cbrt','abs','sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','log','log10','log2','exp']);
const symbols=new Set(['pi','theta','mu','alpha','beta','gamma','delta','epsilon','lambda','omega','phi','sigma','Infinity']);
function literal(source) {
  const escaped=source.replace(/\\/g,'\\backslash ').replace(/[{}#$%&_]/g,c=>`\\${c}`).replace(/\^/g,'\\textasciicircum ').replace(/~/g,'\\textasciitilde ');
  return `\\htmlData{worksheet-source=1}{\\text{${escaped.replace(/\r?\n/g,' ')}}}`;
}
export function sourceToLatex(source) {
  if(!source.trim())return '';
  const rows=statements(source);if(rows.length>1)return groupLatex(rows.map(sourceToLatex));
  try {
    return parse(evaluationSource(source)).toTex({parenthesis:'auto',handler:(node,options)=>{
      if(node.isConstantNode && typeof node.value==='string'){const text=JSON.stringify(node.value).replace(/\\/g,'\\backslash ').replace(/[{}#$%&_]/g,c=>`\\${c}`).replace(/\^/g,'\\textasciicircum ').replace(/~/g,'\\textasciitilde ');return `\\text{${text}}`;}
      if(node.isOperatorNode && node.fn==='equal')return node.args.map(arg=>arg.toTex(options)).join('==');
      if(node.isOperatorNode && ['and','or','xor','not','to'].includes(node.op)){
        const args=node.args.map(arg=>{const value=arg.toTex(options);return arg.isOperatorNode || arg.isAssignmentNode?`\\left(${value}\\right)`:value;});
        return node.op==='not'?`\\operatorname{not}${args[0]}`:args.join(`\\operatorname{${node.op}}`);
      }
      if(node.isSymbolNode){const greek=greekSymbol(node.name);if(greek)return greek;}
      if(node.isFunctionNode && node.fn.isSymbolNode){
        if(node.fn.name==='unit' && node.args.length===1 && node.args[0].isConstantNode && typeof node.args[0].value==='string' && isUnit(node.args[0].value))return unitToken(node.args[0].value);
        const rendered=renderFunction(node.fn.name,node.args.map(arg=>arg.toTex(options)));if(rendered!==undefined)return rendered;
      }
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

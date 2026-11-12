import {parse} from 'mathjs';
import {sourceToLatex} from './expressions.js';
import {unitSource} from './units.js';
import {evaluationSource} from './equations.js';
import {statements} from './groups.js';

function trees(source,evaluationMarkers){return statements(source).filter(row=>row.trim()).map(row=>parse(evaluationMarkers?evaluationSource(row):row));}
export function compileGraphical(latex){const source=unitSource(latex);trees(source,true);return source;}
function canonical(node){
  if(node?.isParenthesisNode)return canonical(node.content);
  if(node?.isFunctionNode && ['log10','log2'].includes(node.fn.name) && node.args.length===1)return canonical(parse(`log(${node.args[0].toString()},${node.fn.name==='log10'?10:2})`));
  if(node?.isNode)return canonical(node.toJSON());
  if(Array.isArray(node))return node.map(canonical);
  if(node && typeof node==='object')return Object.fromEntries(Object.entries(node).filter(([key])=>key!=='implicit').map(([key,value])=>[key,canonical(value)]));
  return node;
}
// A projection can never become the source of truth. Verify its structure
// before offering it as an editable graphical view of the Math.js document.
export function projectMathjs(source,{evaluationMarkers=false}={}){
  try{
    const original=canonical(trees(source,evaluationMarkers)),latex=sourceToLatex(source),converted=canonical(trees(unitSource(latex),true));
    return JSON.stringify(original)===JSON.stringify(converted)?latex:null;
  }catch{return null;}
}

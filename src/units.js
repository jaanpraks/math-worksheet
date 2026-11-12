import { Unit, format, parse } from 'mathjs';
import {latexToMathjs} from './latex-to-mathjs.js';

export const UNIT_COLOR = '#137f78';
export const isUnit = name => /^[A-Za-z]+$/.test(name) && Unit.isValuelessUnit(name);
export const unitLatex = name => `\\textcolor{${UNIT_COLOR}}{\\mathrm{${name}}}`;
export const unitToken = name => `\\htmlData{worksheet-unit=${name}}{${unitLatex(name)}}`;

// Keep a semantic unit marker in saved LaTeX; evaluate it as an explicit unit()
// call so a worksheet variable named 'm' can coexist with the metre unit.
export const unitSource=latexToMathjs;

export function requireAcceptedUnits(source, scope) {
  const tree = parse(source);
  function visit(node,path,parent,parameters){
    if(node.isFunctionNode && ['sumOver','productOver'].includes(node.fn.name) && node.args.length===4 && node.args[1].isSymbolNode){
      const local=new Set([...parameters,node.args[1].name]);visit(node.args[0],'args[0]',node,local);visit(node.args[2],'args[2]',node,parameters);visit(node.args[3],'args[3]',node,parameters);return;
    }
    if(node.isFunctionAssignmentNode)parameters=new Set([...parameters,...node.params]);
    if(node.isSymbolNode && isUnit(node.name) && !scope.has(node.name) && !parameters.has(node.name) && !(parent?.isAssignmentNode && path==='object'))throw Error(`Press Tab to accept ${node.name} as a unit, or define it as a variable above.`);
    node.forEach((child,childPath)=>visit(child,childPath,node,parameters));
  }
  visit(tree,'',undefined,new Set());
}

export function unitResult(value) {
  if (!value?.isUnit) return undefined;
  const units = value.formatUnits();
  const number = format(value.toNumeric(units), { precision: 9 });
  if (!units) return undefined;
  // Make products explicit, including between the magnitude and unit.
  const expression = `${number}*${units.replace(/([A-Za-z0-9)])\s+(?=[A-Za-z(])/g, '$1*')}`;
  return parse(expression).toTex({ parenthesis: 'auto', handler: node =>
    node.isSymbolNode && isUnit(node.name) ? unitLatex(node.name) : undefined });
}

// Keep typing templates, source names and visual notation together. The source
// always uses Math.js argument order; only explicitly registered forms are special.
const call=name=>args=>`\\operatorname{${name}}\\left(${args.join(',')}\\right)`;
import {functionReferenceName} from './latex-structure.js';
export const mappedCall=(vector,fn)=>`\\htmlData{worksheet-map=1}{\\overrightarrow{\\htmlData{worksheet-function=1}{${fn}}\\left(${vector}\\right)}}`;
export const functionMappings={
  abs:{arity:1,shortcut:'\\left|#?\\right|',render:args=>`\\left|${args[0]}\\right|`},
  re:{arity:1,shortcut:'\\Re',latexCommand:'\\Re',render:args=>`\\Re\\left(${args[0]}\\right)`},
  im:{arity:1,shortcut:'\\Im',latexCommand:'\\Im',render:args=>`\\Im\\left(${args[0]}\\right)`},
  mod:{shortcut:'\\operatorname{mod}',render:call('mod')},
  fft:{shortcut:'\\operatorname{fft}',render:call('fft')},
  ifft:{shortcut:'\\operatorname{ifft}',render:call('ifft')},
  map:{arity:2,shortcut:mappedCall('#?','#?'),render:args=>{const name=functionReferenceName(args[1]);return name?mappedCall(args[0],`\\operatorname{${name}}`):call('map')(args);}},
  nthRoot:{arity:2,render:args=>`\\sqrt[${args[1]}]{${args[0]}}`},
  sumOver:{arity:4,render:args=>`\\sum_{${args[1]}=${args[2]}}^{${args[3]}}\\left(${args[0]}\\right)`},
  productOver:{arity:4,render:args=>`\\prod_{${args[1]}=${args[2]}}^{${args[3]}}\\left(${args[0]}\\right)`}
};
export const functionShortcuts=Object.fromEntries(Object.entries(functionMappings).filter(([,rule])=>rule.shortcut).map(([name,rule])=>[name,rule.shortcut]));
export const visualFunctionNames=Object.fromEntries(Object.entries(functionMappings).filter(([,rule])=>rule.latexCommand).map(([name,rule])=>[rule.latexCommand,name]));
export function renderFunction(name,args){
  const rule=functionMappings[name];return rule && (rule.arity===undefined || rule.arity===args.length)?rule.render(args):undefined;
}
export function normalizeFunctionCalls(latex){
  // Also recognize a name when its first letter was the seed used to create a
  // field, or arrived through paste: MathLive's keystroke shortcut buffer then
  // does not contain the complete name. Do not rewrite styled identifiers/text.
  return latex.replace(/\\(?:operatorname|mathrm|mathit|text)\{[^{}]*\}|\\[A-Za-z]+|([A-Za-z]+)(?=\\left\(|\()/g,(token,name)=>{
    if(!name)return token;const rule=functionMappings[name];return rule?.latexCommand || `\\operatorname{${name}}`;
  });
}

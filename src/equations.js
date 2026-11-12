// Only a final standalone '=' requests a visible answer. Comparisons such as
// >=, <=, != and == keep their original meaning.
export function requestsResult(source) { return /(?<![=<>!])=\s*$/.test(source); }
export function evaluationSource(source) { return source.trim().replace(/(?<![=<>!])=\s*$/, ''); }
import {greekNames} from './greek-symbols.js';
export function recognizesMath(latex){
  if(/[=+\-*/^()[\]]/.test(latex))return true;
  return [...latex.matchAll(/\\([A-Za-z]+)/g)].some(([,name])=>greekNames.has(name) || ['sqrt','frac','dfrac','sum','prod','Re','Im','cdot','times','htmlData'].includes(name));
}

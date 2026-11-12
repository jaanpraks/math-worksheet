// Statement separators must not split matrix rows, strings, or comments.
export function statements(source) {
  const rows=[];let start=0,depth=0,quote='',comment=false;
  for(let i=0;i<source.length;i++){
    const c=source[i];
    if(comment){if(c==='\n'){comment=false;if(depth===0){rows.push(source.slice(start,i));start=i+1;}}continue;}
    if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}
    if(c==='#'){comment=true;continue;}
    if(c==='"' || (c==="'" && !/[\w)\]}]/.test(source[i-1] || ''))){quote=c;continue;}
    if('([{'.includes(c))depth++;
    else if(')]}'.includes(c))depth--;
    else if((c===';' || c==='\n') && depth===0){rows.push(source.slice(start,i));start=i+1;}
  }
  rows.push(source.slice(start));return rows;
}
export const groupLatex=rows=>`\\begin{array}{l}${rows.map(row=>row.trim()?row:'\\placeholder{}').join('\\\\')}\\end{array}`;
export function groupRows(latex) {
  const match=latex.trim().match(/^\\begin\{array\}\{l\}([\s\S]*)\\end\{array\}$/);
  if(!match)return undefined;
  const rows=[];let start=0,braces=0,environments=0;
  const tokens=/\\begin\{[^}]+\}|\\end\{[^}]+\}|\\\\(?:\[[^\]]*\])?|[{}]/g;let token;
  while((token=tokens.exec(match[1]))){
    if(token[0].startsWith('\\begin'))environments++;
    else if(token[0].startsWith('\\end'))environments--;
    else if(token[0]==='{')braces++;
    else if(token[0]==='}')braces--;
    else if(braces===0 && environments===0){rows.push(match[1].slice(start,token.index).trim());start=tokens.lastIndex;}
  }
  rows.push(match[1].slice(start).trim());return rows;
}
export function atStatementLevel(prefix) {
  // MathLive selection exports can include complete outer environments. Only
  // the group's one-column array is a statement container; matrices are not.
  const cleaned=prefix.replace(/\\(?:left|right|middle)/g,'').replace(/\\[{}]/g,'');
  const opens=(cleaned.match(/\[/g)||[]).length,closes=(cleaned.match(/\]/g)||[]).length;
  return opens===closes;
}

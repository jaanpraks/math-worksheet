export function readLatexGroup(text,index){
  while(/\s/.test(text[index] || '') && index<text.length)index++;
  const start=index;if(text.startsWith('\\left',index))index+=5;
  const close={'{':'}','(':')','[':']'}[text[index]];if(!close)return null;
  const contentStart=index+1,stack=[close];index++;
  for(;index<text.length;index++){
    if(text[index]==='\\'){
      const command=text.slice(index).match(/^\\[A-Za-z]+/);if(command){index+=command[0].length-1;continue;}index++;continue;
    }
    const closing={'{':'}','(':')','[':']'}[text[index]];if(closing)stack.push(closing);
    else if(text[index]===stack.at(-1)){stack.pop();if(!stack.length)return {start,content:text.slice(contentStart,index).replace(/\\right\s*$/,''),end:index+1};}
  }
  return null;
}
export function splitLatexArguments(text){
  text=text.replace(/\\lbrack/g,'[').replace(/\\rbrack/g,']');
  const parts=[];let start=0;const stack=[];
  for(let index=0;index<text.length;index++){
    if(text[index]==='\\'){index++;continue;}
    if('([{'.includes(text[index]))stack.push(text[index]);else if(')]}'.includes(text[index]))stack.pop();
    else if(text[index]===',' && !stack.length){parts.push(text.slice(start,index));start=index+1;}
  }
  parts.push(text.slice(start));return parts;
}
export function functionReferenceName(latex){
  let value=latex.trim();
  const marked=value.match(/^\\htmlData\{worksheet-function=1\}\{([\s\S]*)\}$/);if(marked)value=marked[1];
  for(let count=0;count<3;count++){const styled=value.match(/^\\(?:operatorname|mathit|mathrm)\{([\s\S]*)\}$/);if(!styled)break;value=styled[1];}
  value=value.replace(/\\_/g,'_').replace(/\s/g,'');
  if(/^\\[A-Za-z]+$/.test(value))value=({'\\Re':'re','\\Im':'im','\\ln':'log'}[value] || value.slice(1));
  return /^[A-Za-z][A-Za-z0-9_]*$/.test(value)?value:undefined;
}

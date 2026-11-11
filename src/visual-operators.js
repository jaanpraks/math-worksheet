// Read balanced LaTeX arguments before using MathLive's elementary ASCII exporter.
// These operators carry structure that ASCIIMath cannot express in Math.js syntax.
import {visualFunctionNames} from './function-mappings.js';
import {readLatexGroup,functionReferenceName} from './latex-structure.js';
export function visualOperators(latex,convert){
  const text=latex.replace(/\\left\s*\|/g,'\\lvert ').replace(/\\right\s*\|/g,'\\rvert ')
    .replace(/\\(?:left|right|bigl|bigr|Bigl|Bigr|big|Big)\s*/g,'').replace(/\\(?:,|!|;|quad|qquad)\s*/g,' ');
  const replacements=[];
  const skip=index=>{while(/\s/.test(text[index] || '') && index<text.length)index++;return index;};
  function group(index){
    index=skip(index);const opening=text[index],closing={'{':'}','(':')','[':']'}[opening];
    if(!closing)return null;
    let depth=1,end=index+1;
    for(;end<text.length;end++){
      if(text[end]==='\\'){end++;continue;}
      if(text[end]===opening)depth++;
      if(text[end]===closing){depth--;if(depth===0)break;}
    }
    if(end>=text.length)throw Error('Complete the operator argument.');
    return {content:text.slice(index+1,end),end:end+1};
  }
  function atom(index){
    index=skip(index);const nested=group(index);if(nested)return nested;
    if(index>=text.length || /[=+*/,}\]]/.test(text[index]))throw Error('Complete the operator argument.');
    const command=text.slice(index).match(/^\\[A-Za-z]+/);
    let end=command?index+command[0].length:index+1;
    if(command && ['\\frac','\\dfrac','\\tfrac'].includes(command[0])){end=atom(end).end;end=atom(end).end;}
    while(text[end]==='^' || text[end]==='_'){end=atom(end+1).end;}
    return {content:text.slice(index,end),end};
  }
  function argument(index){return atom(index);}
  function script(index){
    index=skip(index);const nested=group(index);if(nested)return nested;
    if(index>=text.length)throw Error('Complete the operator bounds.');
    const token=text.slice(index).match(/^\\[A-Za-z]+/)?.[0] || text[index];return {content:token,end:index+token.length};
  }
  function term(index){
    const start=skip(index);let end=start;
    while(end<text.length){
      const c=text[end];if(/[+=,}\]]/.test(c) || c===')' || (c==='-' && end>start))break;
      const nested=group(end);if(nested){end=nested.end;continue;}
      if(c==='\\'){const command=text.slice(end).match(/^\\[A-Za-z]+/);if(command){end+=command[0].length;continue;}}
      end++;
    }
    if(!text.slice(start,end).trim())throw Error('Add an expression after the sum or product.');
    return {content:text.slice(start,end),end};
  }
  function bars(index,command){
    const start=index+command.length,closing=command==='|'?'|':'\\rvert';
    let end=start,depth=1;
    for(;end<text.length;end++){
      if(command!=='|' && text.startsWith('\\lvert',end)){depth++;end+=5;continue;}
      if(text.startsWith(closing,end)){if(--depth===0)break;end+=closing.length-1;}
    }
    if(end>=text.length)throw Error('Close the absolute-value bars.');
    return {source:`abs(${convert(text.slice(start,end))})`,end:end+closing.length};
  }
  function mapArguments(content){
    const parts=[];let start=0;const stack=[];
    for(let pos=0;pos<content.length;pos++){
      if(content[pos]==='\\'){pos++;continue;}
      if('([{'.includes(content[pos]))stack.push(content[pos]);
      else if(')]}'.includes(content[pos]))stack.pop();
      else if(content[pos]===',' && !stack.length){parts.push(content.slice(start,pos));start=pos+1;}
    }
    parts.push(content.slice(start));return parts;
  }
  let result='',index=0;
  while(index<text.length){
    const command=text.slice(index).match(/^\\[A-Za-z]+/)?.[0];let mapped;
    if(command==='\\htmlData'){
      const tag=group(index+command.length);
      if(tag?.content==='worksheet-map=1'){
        const marked=group(tag.end),arrow=marked && readLatexGroup(marked.content,'\\overrightarrow'.length);
        const metadata=arrow && readLatexGroup(arrow.content,'\\htmlData'.length);
        const fn=metadata?.content==='worksheet-function=1' && readLatexGroup(arrow.content,metadata.end);
        const vector=fn && readLatexGroup(arrow.content,fn.end),name=fn && functionReferenceName(fn.content);
        if(!marked || !arrow || !vector || !name)throw Error('Complete the mapped function name and vector.');
        const source=convert(vector.content);if(!source)throw Error('Enter a vector for the mapped function.');
        mapped={source:`map(${source},${name})`,end:marked.end};
      }
    }
    if(command==='\\text' || command==='\\mathit' || command==='\\mathrm'){
      const body=group(index+command.length);if(body){result+=text.slice(index,body.end);index=body.end;continue;}
    }
    if(mapped){/* Explicit vectorized application handled above. */}
    else if(command==='\\operatorname' && group(index+command.length)?.content.replace(/\\mathrm\{([^}]*)\}/g,'$1')==='map'){
      const name=group(index+command.length),args=group(name.end);
      if(!args)throw Error('Complete map(vector,function).');
      const parts=mapArguments(args.content);
      if(parts.length<2)throw Error('Map needs a vector and a function.');
      const first=parts[0].trim();
      // The vector arrow is a presentation hint only inside an explicit map call.
      if(first.startsWith('\\vec')){
        const vector=first.slice(4).trim();if(!vector.startsWith('{') || !vector.endsWith('}'))throw Error('Complete the map vector.');parts[0]=vector.slice(1,-1);
      }
      const reference=parts[1].trim().match(/^\\htmlData\{worksheet-function=1\}\{([\s\S]*)\}$/);if(reference)parts[1]=reference[1];
      const converted=parts.map(convert);
      if(reference && /^[A-Za-z][A-Za-z0-9_\s]*$/.test(converted[1]))converted[1]=converted[1].replace(/\s/g,'');
      mapped={source:`map(${converted.join(',')})`,end:args.end};
    }else if(text[index]==='|' || command==='\\lvert')mapped=bars(index,command || '|');
    else if(command==='\\sqrt'){
      let next=skip(index+command.length),degree;
      if(text[next]==='['){degree=group(next);next=degree.end;}
      const value=argument(next);mapped={source:degree?`nthRoot(${convert(value.content)},${convert(degree.content)})`:`sqrt(${convert(value.content)})`,end:value.end};
    }else if(command==='\\ln' || command==='\\log' || visualFunctionNames[command]){
      let next=skip(index+command.length),base;
      if(command==='\\log' && text[next]==='_'){base=script(next+1);next=base.end;}
      const value=argument(next),name=visualFunctionNames[command] || 'log';
      mapped={source:`${name}(${convert(value.content)}${base?','+convert(base.content):''})`,end:value.end};
    }else if(command==='\\sum' || command==='\\prod'){
      let next=skip(index+command.length),lower,upper;
      for(let count=0;count<2;count++){
        const marker=text[next];if(marker!=='_' && marker!=='^')break;
        const value=script(next+1);if(marker==='_')lower=value;else upper=value;next=skip(value.end);
      }
      if(!lower || !upper)throw Error('A sum or product needs an index and both bounds, for example k=1 to 10.');
      const definition=convert(lower.content).match(/^([A-Za-z][A-Za-z0-9_]*)=(.+)$/);
      if(!definition)throw Error('Use an index definition such as k=1 below the sum or product.');
      const value=term(next);mapped={source:`${command==='\\sum'?'sumOver':'productOver'}(${convert(value.content)},${definition[1]},${definition[2]},${convert(upper.content)})`,end:value.end};
    }
    if(mapped){const id=replacements.push(mapped.source)-1;result+=`{\\text{WSOP${id}}}`;index=mapped.end;}
    else if(command){result+=command;index+=command.length;}
    else {result+=text[index];index++;}
  }
  return {latex:result,restore:source=>source.replace(/"WSOP(\d+)"/g,(_,id)=>`(${replacements[Number(id)]})`)};
}

import {readLatexGroup,splitLatexArguments,functionReferenceName} from './latex-structure.js';
import {renderFunction} from './function-mappings.js';

// Format completed calls only. Alphabetic names are never expanded while they
// are still being typed, so a user can extend sin to sinc without interference.
export function formatVisualCalls(latex){
  let result='',index=0;
  while(index<latex.length){
    const command=latex.slice(index).match(/^\\[A-Za-z]+/)?.[0];
    if(command==='\\text'){
      const text=readLatexGroup(latex,index+command.length);if(text){result+=latex.slice(index,text.end);index=text.end;continue;}
    }
    if(command==='\\operatorname'){
      const nameGroup=readLatexGroup(latex,index+command.length),name=nameGroup && functionReferenceName(nameGroup.content);
      const argument=nameGroup && readLatexGroup(latex,nameGroup.end);
      if(argument){
        const parts=splitLatexArguments(argument.content).map(formatVisualCalls);let rendered;
        if(!argument.content.includes('\\placeholder')){
          if(name==='sqrt' && parts.length===1)rendered=`\\sqrt{${parts[0]}}`;
          else if(['abs','map','nthRoot'].includes(name))rendered=renderFunction(name,parts);
        }
        result+=rendered ?? `${latex.slice(index,argument.start)}${latex.slice(argument.start,argument.start+5)==='\\left'?'\\left':''}(${parts.join(',')}${latex.slice(argument.start,argument.start+5)==='\\left'?'\\right':''})`;
        index=argument.end;continue;
      }
    }
    if(command){result+=command;index+=command.length;}else result+=latex[index++];
  }
  return result;
}

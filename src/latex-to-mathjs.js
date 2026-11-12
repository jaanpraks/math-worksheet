import {Unit} from 'mathjs';
import {greekNames} from './greek-symbols.js';
import {functionReferenceName,readLatexGroup} from './latex-structure.js';

// This reader accepts our graphical notation directly. LaTeX formatting spaces
// are ignored; explicit space commands and mathematical word operators are not.
// Unknown notation fails closed instead of falling through a second exporter.
const words=new Set(['and','or','xor','not','to','mod']);
const functions=new Set(['sin','cos','tan','asin','acos','atan','arcsin','arccos','arctan','sinh','cosh','tanh','exp','ln','log','Re','Im']);
const operators={cdot:'*',times:'*',ast:'*',div:'/',le:'<=',leq:'<=',ge:'>=',geq:'>=',ne:'!=',neq:'!=',equiv:'==',land:'and',wedge:'and',lor:'or',vee:'or',veebar:'xor',neg:'not',lnot:'not',to:'to',rightarrow:'to',colon:':',bmod:'mod',mod:'mod'};
const styles=new Set(['mathit','mathrm','mathnormal','mathbf','mathsf','mathbb','mathcal','boldsymbol','operatorname']);
const atom=(source,kind='atom')=>({source,kind});
const parenthesize=source=>`(${source})`;
function assemble(tokens){
  let out='',previous,space=false;
  for(const token of tokens){
    if(token.kind==='space'){space=true;continue;}
    const word=token.kind==='word',priorWord=previous?.kind==='word';
    const identifier=token.kind==='identifier',priorIdentifier=previous?.kind==='identifier';
    const ends=previous && !['operator','word','open'].includes(previous.kind),starts=!['operator','word','close','postfix'].includes(token.kind);
    if(word || priorWord){if(out && !out.endsWith(' '))out+=' ';}
    else if(space && previous && starts && ends)out+=' ';
    else if(ends && starts){
      if(priorIdentifier && (identifier || token.kind==='number') || previous.kind==='number' && token.kind==='number'){/* Adjacent characters are one Math.js token. */}
      else if(priorIdentifier && token.kind==='round'){/* f(x) is a function call. */}
      else out+='*';
    }
    out+=token.source;previous=token;space=false;
  }
  return out.trim();
}

class Reader{
  constructor(text,depth=0){if(depth>100)throw Error('The expression is nested too deeply.');this.text=text;this.index=0;this.depth=depth;}
  fail(message){throw Error(message);}
  skip(){while(this.index<this.text.length){if(/\s/.test(this.text[this.index])){this.index++;continue;}const style=this.text.slice(this.index).match(/^\\(?:left|right|middle|bigl|bigr|Bigl|Bigr|big|Big|displaystyle|textstyle|limits|nolimits)\b|^\\!/);if(!style)break;if(['\\left','\\right'].includes(style[0]) && /^\s*\|/.test(this.text.slice(this.index+style[0].length)))break;this.index+=style[0].length;}}
  command(){const match=this.text.slice(this.index).match(/^\\([A-Za-z]+|.)/s);if(!match)this.fail('Complete the LaTeX command.');this.index+=match[0].length;return match[1];}
  group(){this.skip();const value=readLatexGroup(this.text,this.index);if(!value)this.fail('Complete the operator argument.');this.index=value.end;return value.content;}
  fragment(text){return new Reader(text,this.depth+1).read();}
  script(){this.skip();return this.text[this.index]==='{'?this.fragment(this.group()):this.one().source;}
  one(){this.skip();if(this.index>=this.text.length)this.fail('Complete the operator argument.');return this.token();}
  argument(){this.skip();if(this.index>=this.text.length)this.fail('Complete the operator argument.');const value=this.text[this.index]==='{'?atom(this.fragment(this.group())):this.one();if(value.kind==='operator' && !['+','-'].includes(value.source))this.fail('Complete the operator argument.');return value;}
  textValue(raw){return raw.replace(/~/g,' ').replace(/\\(?:textasciicircum|textasciitilde)(?: |\{\})?/g,m=>m.includes('circum')?'^':'~').replace(/\\backslash(?: |\{\})?/g,'\\').replace(/\\([{}#$%&_])/g,'$1');}
  string(raw){const value=this.textValue(raw).trim();if(!/^"[\s\S]*"$/.test(value))this.fail('Text in an equation must be a quoted Math.js string.');try{return atom(JSON.stringify(JSON.parse(value)),'string');}catch{this.fail('Complete the quoted string.');}}
  delimited(open,close){
    this.index++;const tokens=this.sequence(()=>this.text[this.index]===close);if(this.text[this.index]!==close)this.fail(`Close the ${open}${close} brackets.`);this.index++;return atom(open+assemble(tokens)+close,open==='('?'round':'array');
  }
  bars(command){
    const close=command==='|'?'|':'\\rvert';
    const tokens=this.sequence(()=>this.text.startsWith(close,this.index) || this.text.startsWith('\\right|',this.index));
    if(this.text.startsWith('\\right|',this.index))this.index+=7;
    else if(this.text.startsWith(close,this.index))this.index+=close.length;
    else this.fail('Close the absolute-value bars.');
    return atom(`abs(${assemble(tokens)})`);
  }
  matrix(name){
    if(!['matrix','pmatrix','bmatrix','Bmatrix','smallmatrix','array'].includes(name))this.fail(`Unsupported graphical environment: ${name}. Use native Math.js for this notation.`);
    if(name==='array'){const columns=this.group();if(columns!=='l')this.fail('Only single-column statement groups are supported.');}
    const rows=[],cells=[];let tokens=[];
    const cell=()=>{const source=assemble(tokens);if(!source)this.fail('Fill every matrix cell.');cells.push(source);tokens=[];};
    while(this.index<this.text.length){
      this.skip();
      if(this.text.startsWith('\\end',this.index)){this.index+=4;const end=this.group();if(end!==name)this.fail('Matrix environments do not match.');if(tokens.length || cells.length)cell();if(cells.length)rows.push(cells.splice(0));
        if(name==='array'){if(rows.some(row=>row.length!==1))this.fail('Statement groups must have one column.');return atom(rows.map(row=>row[0]).join(';'),'statements');}
        if(!rows.length)return atom('[]','array');if(rows.some(row=>row.length!==rows[0].length))this.fail('Every matrix row must have the same number of cells.');return atom(`[${rows.map(row=>`[${row.join(',')}]`).join(',')}]`,'array');}
      if(this.text[this.index]==='&'){cell();this.index++;continue;}
      if(this.text.startsWith('\\\\',this.index)){cell();rows.push(cells.splice(0));this.index+=2;continue;}
      tokens.push(this.token());
    }
    this.fail('Close the matrix environment.');
  }
  marked(tag,body){
    if(tag==='worksheet-source=1')this.fail('This source is shown literally. Edit it in the Math.js source editor.');
    if(tag.startsWith('worksheet-unit=')){
      const name=tag.slice(15),spelling=body.replace(/\\textcolor\{[^{}]*\}/g,'').replace(/\\(?:mathrm|text|operatorname)/g,'').replace(/[{}\s]/g,'');
      if(!/^[A-Za-z]+$/.test(name) || !Unit.isValuelessUnit(name) || spelling!==name)this.fail('The unit marker is incomplete or has been edited. Reinsert the unit.');
      return atom(`unit(${JSON.stringify(name)})`);
    }
    if(tag==='worksheet-map=1'){
      const arrow=body.startsWith('\\overrightarrow') && readLatexGroup(body,'\\overrightarrow'.length),metadata=arrow && readLatexGroup(arrow.content,'\\htmlData'.length);
      const fn=metadata?.content==='worksheet-function=1' && readLatexGroup(arrow.content,metadata.end),vector=fn && readLatexGroup(arrow.content,fn.end),name=fn && functionReferenceName(fn.content);
      if(!vector || !name || !arrow.content.startsWith('\\htmlData') || body.slice(arrow.end).trim() || arrow.content.slice(vector.end).trim())this.fail('Complete the mapped function name and vector.');const source=this.fragment(vector.content);if(!source)this.fail('Enter a vector for the mapped function.');return atom(`map(${source},${name})`);
    }
    if(tag==='worksheet-function=1'){const name=functionReferenceName(body);if(!name)this.fail('Complete the mapped function name.');return atom(name,'identifier');}
    return atom(this.fragment(body));
  }
  token(){
    this.skip();const char=this.text[this.index];if(char===undefined)this.fail('Complete the expression.');
    if(char==='(' || char==='[')return this.delimited(char,char==='('?')':']');
    if(char==='{')return atom(parenthesize(this.fragment(this.group())),'round');
    if(char==='|'){this.index++;return this.bars('|');}
    if(char==='"'){const start=this.index++;while(this.index<this.text.length){if(this.text[this.index]==='\\'){this.index+=2;continue;}if(this.text[this.index++]==='"')return this.string(this.text.slice(start,this.index));}this.fail('Complete the quoted string.');}
    if(char==='~'){this.index++;return atom(' ','space');}
    const number=this.text.slice(this.index).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if(number){this.index+=number[0].length;return atom(number[0],'number');}
    const name=this.text.slice(this.index).match(/^[A-Za-z][A-Za-z0-9]*/);
    if(name){this.index+=name[0].length;return atom(name[0],words.has(name[0])?'word':'identifier');}
    if(char==='\\'){
      const command=this.command();
      if(command==='left' && /^\s*\|/.test(this.text.slice(this.index))){while(/\s/.test(this.text[this.index]))this.index++;this.index++;return this.bars('lvert');}
      if(['left','right','middle','big','Big','bigl','bigr','Bigl','Bigr'].includes(command))return this.one();
      if(['quad','qquad',',',';',' '].includes(command))return atom(' ','space');
      if(['!','displaystyle','textstyle','limits','nolimits'].includes(command))return atom('','space');
      if(command==='placeholder'){this.group();this.fail('Complete the expression placeholders.');}
      if(command==='begin')return this.matrix(this.group());
      if(command==='htmlData'){const tag=this.group(),body=this.group();return this.marked(tag,body);}
      if(command==='textcolor' || command==='colorbox'){this.group();return atom(this.fragment(this.group()));}
      if(command==='text' || command==='mathtt')return this.string(this.group());
      if(styles.has(command)){const body=this.group(),name=functionReferenceName(body);if(!name)this.fail('Complete the function or variable name.');return atom(name,words.has(name)?'word':'identifier');}
      if(greekNames.has(command))return atom(command,'identifier');
      if(command==='infty')return atom('Infinity','identifier');
      if(command==='frac' || command==='dfrac' || command==='tfrac'){const a=this.argument(),b=this.argument();return atom(`(${a.source})/(${b.source})`,'fraction');}
      if(command==='sqrt'){this.skip();const degree=this.text[this.index]==='['?this.fragment(this.group()):undefined,value=this.argument();return atom(degree?`nthRoot(${value.source},${degree})`:`sqrt(${value.source})`);}
      if(command==='sum' || command==='prod'){
        let lower,upper;for(let n=0;n<2;n++){this.skip();const marker=this.text[this.index];if(marker!=='_' && marker!=='^')break;this.index++;const value=this.script();if(marker==='_')lower=value;else upper=value;}
        if(!lower || !upper)this.fail('A sum or product needs an index and both bounds.');const definition=lower.match(/^([A-Za-z][A-Za-z0-9_]*)=(.+)$/);if(!definition)this.fail('Use an index definition such as k=1 below the sum or product.');
        this.skip();const start=this.index;let tokens=[];while(this.index<this.text.length){this.skip();if(this.index>start && /^[+=,;\])}-]/.test(this.text.slice(this.index)))break;tokens.push(this.tokenWithScripts());}if(!tokens.length)this.fail('Add an expression after the sum or product.');return atom(`${command==='sum'?'sumOver':'productOver'}(${assemble(tokens)},${definition[1]},${definition[2]},${upper})`);
      }
      if(command==='lvert')return this.bars(command);
      if(command==='vec'){const source=this.fragment(this.group());return atom(source);}
      if(functions.has(command)){
        this.skip();let base;if(command==='log' && this.text[this.index]==='_'){this.index++;base=this.script();}
        let power;if(this.text[this.index]==='^'){this.index++;power=this.script();}
        const value=this.argument();this.skip();if(['identifier','number'].includes(value.kind) && this.text[this.index]==='^')this.fail('Use parentheses around a function argument with a power.');const argument=value.kind==='round'?value.source.slice(1,-1):value.source;
        const name=({ln:'log',Re:'re',Im:'im',arcsin:'asin',arccos:'acos',arctan:'atan'})[command] || command;
        const call=`${name}(${argument}${base?','+base:''})`;return atom(power?`${call}^(${power})`:call);
      }
      if(operators[command])return atom(operators[command],words.has(operators[command])?'word':'operator');
      if(['_','%','{','}'].includes(command))return atom(command,command==='_'?'underscore':'operator');
      if(command==='lbrack' || command==='rbrack')return atom(command==='lbrack'?'[':']',command==='lbrack'?'open':'close');
      this.fail(`Unsupported graphical command: \\${command}. Use native Math.js for this notation.`);
    }
    this.index++;
    if(char==='_')return atom('_','underscore');
    if('+-*/=<>!:,;?%'.includes(char))return atom(char,'operator');
    if(char===')' || char===']' || char==='}')this.fail('The expression has an unmatched closing bracket.');
    if(char==='∗' || char==='×')return atom('*','operator');if(char==='÷')return atom('/','operator');if(char==='−')return atom('-','operator');
    this.fail(`Unsupported graphical character: ${char}.`);
  }
  tokenWithScripts(){
    let value=this.token();this.skip();
    while(this.text[this.index]==='^' || this.text[this.index]==='_' || this.text.startsWith('\\_',this.index) || this.text[this.index]==='!' && this.text[this.index+1]!=='='){
      if(this.text[this.index]==='!'){this.index++;value=atom(`${value.kind==='fraction'?parenthesize(value.source):value.source}!`);this.skip();continue;}
      const marker=this.text[this.index];if(marker==='\\')this.index+=2;else this.index++;const script=this.script();
      if(marker==='_' || marker==='\\'){if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(value.source) || !/^[A-Za-z0-9]+$/.test(script))this.fail('Use simple variable indices here, or native Math.js for array indexing.');value=atom(`${value.source}_${script}`,'identifier');}
      else value=atom(`${value.kind==='fraction'?parenthesize(value.source):value.source}^(${script})`);
      this.skip();
    }
    return value;
  }
  sequence(stop=()=>false){const tokens=[];while(this.index<this.text.length){this.skip();if(this.index>=this.text.length || stop())break;tokens.push(this.tokenWithScripts());}return tokens;}
  read(){return assemble(this.sequence());}
}
export function latexToMathjs(latex){if(!latex.trim())return '';return new Reader(latex).read();}

import {mappedCall} from './function-mappings.js';

const slot=name=>({slot:name});
const arg=selected=>selected || slot('x');
export const beginnerFunctions=[
  {id:'sqrt',label:'√x',name:'Square root',syntax:'sqrt(x)',visual:x=>`\\sqrt{${x}}`,source:x=>['sqrt(',arg(x),')']},
  {id:'root',label:'ⁿ√x',name:'Nth root',syntax:'nthRoot(x,n)',visual:x=>`\\sqrt[#?]{${x}}`,source:x=>['nthRoot(',arg(x),',',slot('n'),')']},
  {id:'square',label:'x²',name:'Square',syntax:'x^2',visual:x=>`\\left(${x}\\right)^2`,source:x=>['(',arg(x),')^2']},
  {id:'power',label:'xⁿ',name:'Power',syntax:'x^n',visual:x=>`\\left(${x}\\right)^{#?}`,source:x=>['(',arg(x),')^',slot('n')]},
  {id:'abs',label:'|x|',name:'Absolute value',syntax:'abs(x)',visual:x=>`\\left|${x}\\right|`,source:x=>['abs(',arg(x),')']},
  {id:'ln',label:'ln(x)',name:'Natural logarithm',syntax:'log(x)',visual:x=>`\\ln\\left(${x}\\right)`,source:x=>['log(',arg(x),')']},
  {id:'log10',label:'log₁₀',name:'Base-10 logarithm',syntax:'log10(x)',visual:x=>`\\log_{10}\\left(${x}\\right)`,source:x=>['log10(',arg(x),')']},
  {id:'logbase',label:'logᵦ',name:'Logarithm with base',syntax:'log(x,b)',visual:x=>`\\log_{#?}\\left(${x}\\right)`,source:x=>['log(',arg(x),',',slot('b'),')']},
  {id:'exp',label:'eˣ',name:'Exponential',syntax:'exp(x)',visual:x=>`e^{${x}}`,source:x=>['exp(',arg(x),')']},
  {id:'pi',label:'π',name:'Pi',syntax:'pi',visual:()=>String.raw`\pi`,source:()=>['pi']},
  ...['sin','cos','tan'].map(name=>({id:name,label:`${name}(x)`,name:{sin:'Sine',cos:'Cosine',tan:'Tangent'}[name],syntax:`${name}(x)`,visual:x=>`\\${name}\\left(${x}\\right)`,source:x=>[`${name}(`,arg(x),')']})),
  {id:'sum',label:'Σ',name:'Summation',syntax:'sumOver(expression,k,lower,upper)',visual:x=>`\\sum_{#?=#?}^{#?}\\left(${x}\\right)`,source:x=>['sumOver(',x || slot('expression'),',',slot('k'),',',slot('lower'),',',slot('upper'),')']},
  {id:'map',label:'map',name:'Apply function to vector',syntax:'map(vector,f)',visual:x=>mappedCall(x,'#?'),source:x=>['map(',x || slot('vector'),',',slot('f'),')']}
];

const snippets=new WeakMap();
function sourceInsertion(target,entry){
  const start=target.selectionStart,end=target.selectionEnd,selected=target.value.slice(start,end),slots=[];let text='';
  for(const part of entry.source(selected)){if(typeof part==='string')text+=part;else {slots.push({start:start+text.length,end:start+text.length+part.slot.length});text+=part.slot;}}
  snippets.delete(target);target.setRangeText(text,start,end,'end');target.dispatchEvent(new Event('input',{bubbles:true}));
  if(slots.length){snippets.set(target,{slots,index:0,value:target.value,end:start+text.length});target.setSelectionRange(slots[0].start,slots[0].end);}
}
export function insertMathTemplate(target,entry){
  target.focus({preventScroll:true});
  if(!target.matches('math-field')){sourceInsertion(target,entry);return;}
  const range=target.selection.ranges.find(([a,b])=>a!==b),selected=range?target.getValue(Math.min(...range),Math.max(...range),'latex'):'';
  const latex=entry.visual(selected || '#?');target.insert(latex,{format:'latex',selectionMode:latex.includes('#?')?'placeholder':'after',focus:true});target.dispatchEvent(new Event('input',{bubbles:true}));
}

export function mountFunctionsMenu({getTarget}){
  const rail=document.querySelector('#insertion-tools'),topics=rail.querySelector('.insertion-topics');
  const panel=document.createElement('section');panel.id='functions-palette';panel.hidden=true;panel.setAttribute('aria-label','Functions');
  const heading=document.createElement('div');heading.className='elements-heading';heading.textContent='Functions';
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close functions');heading.append(close);
  const grid=document.createElement('div');grid.className='functions-grid';const hint=document.createElement('p');
  for(const entry of beginnerFunctions){const button=document.createElement('button');button.type='button';button.textContent=entry.label;button.title=`${entry.name} — ${entry.syntax}`;button.setAttribute('aria-label',entry.name);button.onclick=()=>{const target=getTarget();if(target)insertMathTemplate(target,entry);update();};grid.append(button);}
  const toggle=document.createElement('button');toggle.id='functions-toggle';toggle.type='button';toggle.textContent='Functions';toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');
  function update(){const target=getTarget();for(const b of grid.children)b.disabled=!target;hint.textContent=target?'Select an expression to wrap it. Tab moves between placeholders.':'Select a graphical or native Math.js equation first.';}
  function setOpen(open){if(open)rail.dispatchEvent(new CustomEvent('insertion-topic',{detail:'functions'}));panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));update();}
  toggle.onclick=()=>setOpen(panel.hidden);close.onclick=()=>setOpen(false);panel.append(heading,grid,hint);rail.insertBefore(panel,topics);topics.insertBefore(toggle,document.querySelector('#greek-toggle'));
  for(const host of [toggle,panel])host.addEventListener('pointerdown',event=>{if(event.target.closest('button'))event.preventDefault();});
  rail.addEventListener('insertion-topic',event=>{if(event.detail!=='functions')setOpen(false);});document.addEventListener('focusin',update);
  document.addEventListener('input',event=>{
    const target=event.target,state=snippets.get(target);if(!state)return;
    const before=state.value,after=target.value;let from=0;while(from<before.length && from<after.length && before[from]===after[from])from++;
    let to=before.length,newTo=after.length;while(to>from && newTo>from && before[to-1]===after[newTo-1]){to--;newTo--;}
    const active=state.slots[state.index];if(from<active.start || to>active.end){snippets.delete(target);return;}
    const delta=after.length-before.length,map=(position,end)=>position<from || (position===from && !end)?position:position>to || (position===to && end)?position+delta:from+(end?newTo-from:0);
    state.slots=state.slots.map(s=>({start:map(s.start,false),end:map(s.end,true)}));state.end=map(state.end,true);state.value=after;
  },true);
  document.addEventListener('pointerdown',event=>{if(snippets.has(event.target))snippets.delete(event.target);},true);
  document.addEventListener('keydown',event=>{
    const target=event.target,state=snippets.get(target);
    if(state && event.key==='Tab' && !event.ctrlKey && !event.metaKey && !event.altKey){const index=state.index+(event.shiftKey?-1:1);if(index<0){snippets.delete(target);return;}event.preventDefault();event.stopImmediatePropagation();if(index>=state.slots.length){target.setSelectionRange(state.end,state.end);snippets.delete(target);}else {state.index=index;const slot=state.slots[index];target.setSelectionRange(slot.start,slot.end);}return;}
    if(state && ['Escape','Enter'].includes(event.key))snippets.delete(target);
    if(event.key==='Escape' && !panel.hidden && rail.contains(target)){event.preventDefault();setOpen(false);}
  },true);
  update();
}

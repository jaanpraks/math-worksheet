import {matrixTemplate} from './matrices.js';
import {insertMathTemplate} from './functions-menu.js';

const slot=name=>({slot:name});
const argument=(selected,name='A')=>selected || slot(name);
const call=(name,x)=>`\\operatorname{${name}}\\left(${x}\\right)`;
function matrixSource(rows,columns,selected){
  const parts=['['];for(let r=0;r<rows;r++){if(r)parts.push(',');parts.push('[');for(let c=0;c<columns;c++){if(c)parts.push(',');parts.push(r===0 && c===0 && selected?selected:slot(`a${r+1}${c+1}`));}parts.push(']');}parts.push(']');return parts;
}
export const matrixEntries=[
  {name:'Vector',label:'[x,y,z]',short:'Vector',syntax:'[x,y,z]',visual:x=>`\\left[${x},#?,#?\\right]`,source:x=>['[',argument(x,'x'),',',slot('y'),',',slot('z'),']']},
  {name:'Column vector',label:'[x;y;z]',short:'Column',syntax:'[[x],[y],[z]]',visual:x=>matrixTemplate(3,1).replace('#?',x),source:x=>matrixSource(3,1,x)},
  {name:'2 by 2 matrix',label:'2×2',short:'Matrix',syntax:'[[a,b],[c,d]]',visual:x=>matrixTemplate(2,2).replace('#?',x),source:x=>matrixSource(2,2,x)},
  {name:'3 by 3 matrix',label:'3×3',short:'Matrix',syntax:'[[a,b,c],[d,e,f],[g,h,i]]',visual:x=>matrixTemplate(3,3).replace('#?',x),source:x=>matrixSource(3,3,x)},
  ...[['transpose','Aᵀ','Transpose'],['det','det(A)','Determinant'],['inv','A⁻¹','Inverse']].map(([fn,label,name])=>({name,label,short:name,syntax:`${fn}(A)`,visual:x=>call(fn,x),source:x=>[`${fn}(`,argument(x),')']})),
  ...[['dot','a·b','Dot product'],['cross','a×b','Cross product']].map(([fn,label,name])=>({name,label,short:name,syntax:`${fn}(a,b)`,visual:x=>call(fn,`${x},#?`),source:x=>[`${fn}(`,argument(x,'a'),',',slot('b'),')']})),
  {name:'Vector norm',label:'‖a‖',short:'Norm',syntax:'norm(a)',visual:x=>call('norm',x),source:x=>['norm(',argument(x,'a'),')']},
  {name:'Identity matrix',label:'Iₙ',short:'Identity',syntax:'identity(n)',visual:x=>call('identity',x),source:x=>['identity(',argument(x,'n'),')']},
  {name:'Zero matrix',label:'0ₘₙ',short:'Zeros',syntax:'zeros(rows,cols)',visual:x=>call('zeros',`${x},#?`),source:x=>['zeros(',argument(x,'rows'),',',slot('cols'),')']}
];

export function mountMatricesMenu({getTarget}){
  const rail=document.querySelector('#insertion-tools'),topics=rail.querySelector('.insertion-topics');
  const panel=document.createElement('section');panel.id='matrices-palette';panel.hidden=true;panel.setAttribute('aria-label','Matrix and vectors');
  const heading=document.createElement('div');heading.className='elements-heading';heading.textContent='Matrix & vectors';
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close matrix and vectors');heading.append(close);
  const grid=document.createElement('div');grid.className='matrices-grid';const hint=document.createElement('p');
  for(const entry of matrixEntries){const button=document.createElement('button');button.type='button';button.setAttribute('aria-label',entry.name);button.title=`${entry.name} — ${entry.syntax}`;const symbol=document.createElement('span');symbol.className='matrix-symbol';symbol.textContent=entry.label;const caption=document.createElement('small');caption.textContent=entry.short;button.append(symbol,caption);button.onclick=()=>{const target=getTarget();if(target)insertMathTemplate(target,entry);update();};grid.append(button);}
  const toggle=document.createElement('button');toggle.id='matrices-toggle';toggle.type='button';toggle.textContent='Matrix & vectors';toggle.setAttribute('aria-label','Matrix and vectors');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',panel.id);
  function update(){const target=getTarget();for(const button of grid.children)button.disabled=!target;hint.textContent=target?'Select an expression to use it as the first argument. Tab moves through cells and arguments.':'Select a graphical or native Math.js equation first.';}
  function setOpen(open){if(open)rail.dispatchEvent(new CustomEvent('insertion-topic',{detail:'matrices'}));panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));update();}
  toggle.onclick=()=>setOpen(panel.hidden);close.onclick=()=>setOpen(false);panel.append(heading,grid,hint);rail.insertBefore(panel,topics);topics.append(toggle);
  for(const host of [toggle,panel])host.addEventListener('pointerdown',event=>{if(event.target.closest('button'))event.preventDefault();});
  rail.addEventListener('insertion-topic',event=>{if(event.detail!=='matrices')setOpen(false);});document.addEventListener('focusin',update);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !panel.hidden && rail.contains(event.target)){event.preventDefault();setOpen(false);}});
  update();
}

import {format,planckConstant,gravitationConstant,gravity,speedOfLight,elementaryCharge,boltzmann} from 'mathjs';
import {unitToken,unitSource} from './units.js';
import {sourceToLatex} from './expressions.js';

export const commonUnits=[['m','Metre'],['s','Second'],['kg','Kilogram'],['N','Newton'],['J','Joule'],['W','Watt'],['Pa','Pascal'],['Hz','Hertz'],['V','Volt'],['A','Ampere']].map(([symbol,name])=>({kind:'unit',symbol,name,source:`unit("${symbol}")`}));
export const physicsConstants=[
  ['planckConstant','h','Planck constant',planckConstant],
  ['gravitationConstant','G','Gravitational constant',gravitationConstant],
  ['gravity','g₀','Standard gravity',gravity],
  ['speedOfLight','c','Speed of light',speedOfLight],
  ['elementaryCharge','e','Elementary charge',elementaryCharge],
  ['boltzmann','k_B','Boltzmann constant',boltzmann]
].map(([source,symbol,name,value])=>({kind:'constant',source,symbol,name,value:format(value,{precision:9})}));

const keywordEnd=text=>/\b(?:to|and|or|xor|not)\s*$/.test(text);
const keywordStart=text=>/^\s*(?:to|and|or|xor)\b/.test(text);
export function insertUnitOrConstant(target,entry){
  target.focus({preventScroll:true});
  if(target.matches('math-field')){
    const range=target.selection.ranges[0],start=Math.min(...range),end=Math.max(...range);
    const selected=target.getValue(start,end,'latex'),before=start?target.getValue(Math.max(0,start-1),start,'latex').trim():'',after=target.getValue(end,Math.min(end+1,target.lastOffset),'latex').trim();
    let conversion=false,afterSource=after;try{conversion=keywordEnd(unitSource(target.getValue(0,start,'latex')));}catch{/* Partial branches still support local multiplication. */}
    try{afterSource=unitSource(target.getValue(end,target.lastOffset,'latex'));}catch{/* Inspect the adjacent atom if the suffix is incomplete. */}
    const nextPrimary=/^[A-Za-z0-9(]/.test(after) || /^\\(?!(?:right|end|rvert|rangle|rbrace|rbrack)\b)[A-Za-z]/.test(after);
    const left=/[A-Za-z0-9)}\]]$/.test(before) && !conversion?'\\cdot ':'',right=nextPrimary && !keywordStart(afterSource)?'\\cdot ':'';
    let latex=entry.kind==='unit'?unitToken(entry.symbol):sourceToLatex(entry.source);
    if(entry.kind==='unit' && selected && !selected.includes('worksheet-unit=') && !/^\\placeholder\{[^}]*\}$/.test(selected))latex=`\\left(${selected}\\right)\\cdot ${latex}`;
    target.insert(left+latex+right,{format:'latex',selectionMode:'after',focus:true});target.dispatchEvent(new Event('input',{bubbles:true}));return;
  }
  const start=target.selectionStart,end=target.selectionEnd,before=target.value.slice(0,start),after=target.value.slice(end),selected=target.value.slice(start,end);
  const left=/[A-Za-z0-9_)\]]\s*$/.test(before) && !keywordEnd(before)?'*':'',right=/^\s*[A-Za-z0-9_(]/.test(after) && !keywordStart(after)?'*':'';
  const value=entry.kind==='unit' && selected && !/^unit\(["'][A-Za-z]+["']\)$/.test(selected)?`(${selected})*${entry.source}`:entry.source;
  target.setRangeText(left+value+right,start,end,'end');target.dispatchEvent(new Event('input',{bubbles:true}));
}

export function mountUnitsMenu({getTarget}){
  const rail=document.querySelector('#insertion-tools'),topics=rail.querySelector('.insertion-topics');
  const panel=document.createElement('section');panel.id='units-palette';panel.hidden=true;panel.setAttribute('aria-label','Units');
  const heading=document.createElement('div');heading.className='elements-heading';heading.textContent='Units';
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close units');heading.append(close);
  const units=document.createElement('div');units.className='units-grid';const constants=document.createElement('div');constants.className='constants-grid';
  const subheading=document.createElement('h3');subheading.textContent='Physics constants';const hint=document.createElement('p'),reference=document.createElement('p');
  reference.append('A small sample of Math.js constants, with units. ');const link=document.createElement('a');link.href='https://mathjs.org/docs/datatypes/units.html#physical-constants';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Browse more constants';reference.append(link);
  for(const entry of [...commonUnits,...physicsConstants]){
    const button=document.createElement('button');button.type='button';button.textContent=entry.symbol;if(entry.source==='boltzmann'){button.textContent='k';const sub=document.createElement('sub');sub.textContent='B';button.append(sub);}button.setAttribute('aria-label',entry.name);button.title=entry.kind==='unit'?`${entry.name} — ${entry.source}`:`${entry.name} — ${entry.source}\n${entry.value}`;
    button.onclick=()=>{const target=getTarget();if(target)insertUnitOrConstant(target,entry);update();};(entry.kind==='unit'?units:constants).append(button);
  }
  const toggle=document.createElement('button');toggle.id='units-toggle';toggle.type='button';toggle.textContent='Units';toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');
  function update(){const target=getTarget();for(const button of panel.querySelectorAll('.units-grid button,.constants-grid button'))button.disabled=!target;hint.textContent=target?'Units are accepted immediately. Constants insert their Math.js names.':'Select a graphical or native Math.js equation first.';}
  function setOpen(open){if(open)rail.dispatchEvent(new CustomEvent('insertion-topic',{detail:'units'}));panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));update();}
  toggle.onclick=()=>setOpen(panel.hidden);close.onclick=()=>setOpen(false);panel.append(heading,units,subheading,constants,hint,reference);rail.insertBefore(panel,topics);topics.append(toggle);
  for(const host of [toggle,panel])host.addEventListener('pointerdown',event=>{if(event.target.closest('button'))event.preventDefault();});
  rail.addEventListener('insertion-topic',event=>{if(event.detail!=='units')setOpen(false);});document.addEventListener('focusin',update);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !panel.hidden && rail.contains(event.target)){event.preventDefault();setOpen(false);}});
  update();
}

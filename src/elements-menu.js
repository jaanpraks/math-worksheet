import {canvasPoint} from './canvas-geometry.js';

export function mountElementsMenu({viewport,canvas,place,message,hasSelection,wrapSelection}){
  const rail=document.createElement('div');rail.id='insertion-tools';rail.setAttribute('aria-label','Insertion tools');
  const panel=document.createElement('section');panel.id='elements-palette';panel.hidden=true;panel.setAttribute('aria-label','Elements');
  const heading=document.createElement('div');heading.className='elements-heading';heading.textContent='Elements';
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close elements');heading.append(close);
  const grid=document.createElement('div');grid.className='elements-grid';
  const hint=document.createElement('p');hint.textContent='Choose an element, then click or tap the canvas to place it.';
  const wrap=document.createElement('button');wrap.type='button';wrap.textContent='Section around selection';wrap.onclick=()=>{cancel();wrapSelection();};
  const cancelButton=document.createElement('button');cancelButton.type='button';cancelButton.className='cancel-placement';cancelButton.textContent='Cancel placement';cancelButton.hidden=true;cancelButton.onclick=()=>{cancel();message('Placement cancelled.');};
  const toggle=document.createElement('button');toggle.id='elements-toggle';toggle.type='button';toggle.textContent='Elements';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',panel.id);
  let pending,drag;
  const buttons=[];
  const entries=[['math','Math','x²'],['text','Text','Aa'],['image','Picture','▧'],['plot','Plot','∿'],['slider','Slider','↔'],['radio','Selector','◉'],['section','Section','▤']];
  for(const [type,label,icon] of entries){
    const button=document.querySelector(`#add-${type}`);button.replaceChildren();button.type='button';button.setAttribute('aria-label',label);button.title=`Place ${label.toLowerCase()} on the canvas`;button.dataset.type=type;button.setAttribute('aria-pressed','false');
    const symbol=document.createElement('span');symbol.className='element-symbol';symbol.textContent=icon;symbol.setAttribute('aria-hidden','true');button.append(symbol,document.createTextNode(label));
    button.onclick=()=>{pending=type;canvas.classList.add('placing-element');buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));hint.textContent=`Click or tap the canvas to place ${label.toLowerCase()}. Escape cancels.`;cancelButton.hidden=false;message(hint.textContent);};buttons.push(button);grid.append(button);
  }
  function cancel(){pending=undefined;drag=undefined;canvas.classList.remove('placing-element');buttons.forEach(b=>b.setAttribute('aria-pressed','false'));cancelButton.hidden=true;hint.textContent='Choose an element, then click or tap the canvas to place it.';}
  function setOpen(open){if(open)rail.dispatchEvent(new CustomEvent('insertion-topic',{detail:'elements'}));panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(!open){cancel();message('Ready');}updateSelection();}
  toggle.onclick=()=>setOpen(panel.hidden);close.onclick=()=>{setOpen(false);toggle.focus();};
  const topics=document.createElement('div');topics.className='insertion-topics';topics.append(toggle);
  panel.append(heading,grid,wrap,hint,cancelButton);rail.append(panel,topics);viewport.append(rail);
  rail.addEventListener('insertion-topic',event=>{if(event.detail!=='elements')setOpen(false);});
  function updateSelection(){wrap.hidden=!hasSelection();}
  viewport.addEventListener('pointerdown',event=>{
    if(!pending || event.button!==0 || !event.target.closest('#canvas') || event.target.closest('.region-settings'))return;
    event.preventDefault();event.stopImmediatePropagation();drag={id:event.pointerId,x:event.clientX,y:event.clientY,point:canvasPoint(canvas,event),type:pending};
  },true);
  document.addEventListener('pointerup',event=>{
    if(!drag || drag.id!==event.pointerId)return;const start=drag;drag=undefined;
    if(Math.hypot(event.clientX-start.x,event.clientY-start.y)>8 || !event.target.closest('#canvas'))return;
    event.preventDefault();event.stopImmediatePropagation();cancel();place(start.type,start.point);
  },true);
  document.addEventListener('pointercancel',()=>{drag=undefined;},true);
  document.addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(pending){event.preventDefault();event.stopImmediatePropagation();cancel();message('Placement cancelled.');}
    else if(!panel.hidden && rail.contains(event.target)){event.preventDefault();setOpen(false);toggle.focus();}
  },true);
  updateSelection();return {updateSelection,cancel};
}

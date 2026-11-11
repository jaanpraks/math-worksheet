import { MathfieldElement } from 'mathlive';
import './style.css';
import './paper.css';
import { worksheet } from './engine.js';
import { region, starter, serialize, deserialize } from './model.js';
import { mountPlot } from './plot-ui.js';
import { mathEditor, resultEditor, updateResult } from './editing.js';
import { mountNote } from './note.js';
import { ordered } from './engine.js';
import { selectionTool } from './selection.js';
import { insertRowAfter,removeRowAfter,removeCanvasRow,moveGroup,ROW_HEIGHT } from './layout.js';
import { emptyRegion,replaceTextSelection } from './clipboard.js';
import { unitSource } from './units.js';
import { mountControl } from './controls.js';
import { sourceToLatex } from './expressions.js';
import { createHistory } from './history.js';
import { fitImage,resizeImage,imageDimensions,fitSavedImages } from './images.js';
import {SECTION_HEADER,sections,hiddenBySection,screenY,sheetY,sectionGroup,validateSections,stretchSection} from './sections.js';
import {mountSection} from './section-ui.js';
import {mountFullscreen} from './fullscreen.js';
import {statements} from './groups.js';
import {mountInformation} from './information.js';
import {mountPopovers,positionPopovers} from './popovers.js';
import {applyAppearance,mountProperties,tabProperties,fieldNames} from './properties.js';

MathfieldElement.fontsDirectory = `${import.meta.env.BASE_URL}fonts`;
const canvas = document.querySelector('#canvas');
const viewport = document.querySelector('#viewport');
mountPopovers(viewport);
const status = document.querySelector('#status');
mountFullscreen(document.querySelector('#fullscreen'),message);
let regions = starter();
let timer;
let pendingFocusId;
let pasteAnchor={x:100,y:100};
let canvasPoint;
const canvasCaret=document.createElement('div');canvasCaret.className='canvas-caret';canvasCaret.setAttribute('aria-hidden','true');
const insertedRows=new Map();
const views = new Map();
const history=createHistory();
let restoringHistory=false,animationTick=false,historyEpoch=0,historyGroup='initial',historyMerge=600,pointerActive=false;
const undoButton=document.querySelector('#undo'),redoButton=document.querySelector('#redo');
const historySnapshot=()=>serialize(regions.filter(r=>!emptyRegion(r)));
function historyButtons(){if(undoButton)undoButton.disabled=!history.canUndo;if(redoButton)redoButton.disabled=!history.canRedo;}
function recordHistory(){if(!restoringHistory && !animationTick){history.record(historySnapshot(),historyGroup,historyMerge);historyButtons();}}
function applyHistory(direction){
  clearTimeout(timer);recordHistory();const data=history[direction]();if(data===undefined)return;
  const active=document.activeElement,id=active.closest?.('.region')?.dataset.id,label=active.closest?.('.region-settings') || active.matches?.('.hidden-placeholder')?active.getAttribute('aria-label'):undefined;
  restoringHistory=true;pendingFocusId=undefined;regions=JSON.parse(data).regions;insertedRows.clear();canvasPoint=undefined;selection.selected.clear();
  const focusId=regions.some(r=>r.id===id)?id:undefined;render(focusId);
  if(label && focusId){
    const input=[...views.get(focusId).element.querySelectorAll('.region-settings [aria-label],.hidden-placeholder[aria-label]')].find(el=>el.getAttribute('aria-label')===label);
    if(input){pendingFocusId=undefined;for(let parent=input.parentElement;parent && parent!==views.get(focusId).element;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;positionPopovers(viewport);input.focus();}
  }else if(!focusId)canvas.focus();
  restoringHistory=false;history.replace(historySnapshot());historyEpoch++;historyGroup=`restore:${historyEpoch}`;historyButtons();message(direction==='undo'?'Undone.':'Redone.');
}
for(const [button,direction] of [[undoButton,'undo'],[redoButton,'redo']])if(button){button.addEventListener('pointerdown',event=>event.preventDefault());button.onclick=()=>applyHistory(direction);}
document.addEventListener('pointerdown',()=>{pointerActive=true;historyGroup=`gesture:${++historyEpoch}`;historyMerge=Infinity;},true);
for(const type of ['pointerup','pointercancel'])document.addEventListener(type,()=>{pointerActive=false;queueMicrotask(recordHistory);},true);
function typingGroup(target){historyGroup=`edit:${target.closest?.('.region')?.dataset.id || 'canvas'}:${target.getAttribute?.('aria-label') || target.tagName}:${historyEpoch}`;historyMerge=600;}
document.addEventListener('input',event=>{if(event.target.closest?.('#canvas')){if(!pointerActive)typingGroup(event.target);queueMicrotask(recordHistory);}},true);
document.addEventListener('paste',()=>{historyGroup=`paste:${++historyEpoch}`;historyMerge=Infinity;queueMicrotask(recordHistory);},true);
document.addEventListener('keydown',event=>{
  if(event.isComposing)return;
  const modified=event.ctrlKey||event.metaKey,key=event.key.toLowerCase();
  if(modified && !event.altKey && (key==='z'||key==='y')){
    event.preventDefault();event.stopImmediatePropagation();applyHistory(key==='y'||event.shiftKey?'redo':'undo');return;
  }
  if(!modified && (event.key.length===1 || ((key==='backspace'||key==='delete')&&event.target!==canvas)))typingGroup(event.target);
  else {historyGroup=`command:${++historyEpoch}`;historyMerge=Infinity;}
},true);
const selection=selectionTool(canvas,{
  elements:()=>canvas.querySelectorAll('.region:not(.section-hidden)'),
  create:(x,y)=>createMath(x,sheetY(regions,y)),
  changed:count=>{message(count?`${count} selected · Drag a move handle to move the group · Enter inserts a row · Esc clears selection`:'Ready');paintCanvasCaret();},
});
function paintCanvasCaret() {
  canvasCaret.hidden=!canvasPoint || document.activeElement!==canvas || selection.selected.size>0;
  if(canvasPoint)Object.assign(canvasCaret.style,{left:`${canvasPoint.x}px`,top:`${screenY(regions,canvasPoint.y)}px`});
}
document.addEventListener('focusin',paintCanvasCaret);
function setCanvasPoint(point) {
  canvasPoint=point;pasteAnchor={x:point.x,y:point.y};canvas.focus({preventScroll:true});paintCanvasCaret();
}
function placeAll() {for(const r of regions){const view=views.get(r.id);place(view.element,r);view.fit?.();}bounds();}
function message(text) { status.textContent = text; }
function updateFieldChrome(r,element) { element.classList.toggle('is-empty',emptyRegion(r));element.classList.toggle('math-group',r.type==='math' && statements(r.source).length>1); }
canvas.addEventListener('input',event=>{
  const element=event.target.closest('.region'),r=regions.find(r=>r.id===element?.dataset.id);
  if(r){updateFieldChrome(r,element);recordHistory();}
});
function removeRegions(ids) {
  ids=sectionGroup(regions,ids);const removedSections=sections(regions).filter(s=>ids.has(s.id));
  regions=regions.filter(r=>!ids.has(r.id));
  for(const r of regions)r.y-=removedSections.filter(s=>r.y>=s.y+s.height).reduce((sum,s)=>sum+s.height,0);
  for(const id of ids){views.get(id)?.dispose?.();views.get(id)?.element.remove();views.delete(id);selection.selected.delete(id);insertedRows.delete(id);}
  placeAll();selection.refresh();recalculate();
}
function cleanupEmpty(forceId) {
  const active=document.activeElement;
  const ids=new Set(regions.filter(r=>emptyRegion(r) && (r.id===forceId || (r.id!==pendingFocusId && !views.get(r.id)?.element.contains(active)))).map(r=>r.id));
  if(ids.size)removeRegions(ids);
}
canvas.addEventListener('focusout',()=>setTimeout(()=>{cleanupEmpty();paintCanvasCaret();},0));
canvas.addEventListener('pointerdown',event=>{
  const box=canvas.getBoundingClientRect();pasteAnchor={x:Math.max(0,event.clientX-box.left),y:sheetY(regions,Math.max(0,event.clientY-box.top))};
},true);
canvas.addEventListener('pointermove',event=>{
  if(event.buttons || event.target.closest('.region-head,.move-handle'))return;
  const box=canvas.getBoundingClientRect();pasteAnchor={x:Math.max(0,event.clientX-box.left),y:sheetY(regions,Math.max(0,event.clientY-box.top))};
});
function recalculate() {
  const results = worksheet(regions);
  for (const [id, result] of results) {
    const view = views.get(id);
    updateResult(view, result, regions.find(r => r.id === id));
    view.updateControl?.(result);
    if(view.updatePlot)try{view.updatePlot(result);}catch(e){view.output.textContent=e.message;view.output.classList.add('error');}
    view.element.classList.toggle('has-error',view.output.classList.contains('error'));
  }
  bounds();
  recordHistory();
}
function schedule() { clearTimeout(timer); timer = setTimeout(recalculate, 160); }
function bounds() {
  const visible=regions.filter(r=>!hiddenBySection(regions,r));
  // Full-width section headers follow this width; measuring them here would
  // feed the canvas width back into itself and add 100 px on every update.
  canvas.style.width = `${Math.max(1400, ...visible.filter(r=>r.type!=='section').map(r => r.x+(r.hidden?140:Math.max(r.width,views.get(r.id)?.editor?.closest('section')?.offsetWidth || 0))+100))}px`;
  canvas.style.height = `${Math.max(1200, ...visible.map(r => screenY(regions,r.y)+(r.type==='section'&&r.collapsed?SECTION_HEADER:r.hidden?26:Math.max(r.height,views.get(r.id)?.editor?.closest('section')?.offsetHeight || 0))+100))}px`;
  positionPopovers(viewport);
}
function place(el, r) {
  applyAppearance(r,el);
  Object.assign(el.style, { left: `${r.x}px`, top: `${screenY(regions,r.y)}px`, width: `${r.width}px`, height: `${r.type==='section'&&r.collapsed?SECTION_HEADER:r.height}px` });el.style.setProperty('--note-height',`${r.height}px`);
  el.classList.toggle('concealed',!!r.hidden);el.classList.toggle('section-hidden',hiddenBySection(regions,r));el.classList.toggle('collapsed',r.type==='section'&&!!r.collapsed);
}
function input(parent, value, label, oninput, multiline = false) {
  const el = document.createElement(multiline ? 'textarea' : 'input');
  el.value = value; el.setAttribute('aria-label', label); el.spellcheck = false;
  el.addEventListener('input', () => oninput(el.value)); parent.append(el); return el;
}
function pointerMove(handle, el, r, resize = false) {
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('button,input,textarea,summary,details')) return;
    event.preventDefault(); event.stopPropagation(); handle.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY, w: r.type==='image'?r.width:el.offsetWidth, h: r.type==='image'?r.height:el.offsetHeight };
    const ids=sectionGroup(regions,new Set(!resize && selection.selected.has(r.id)?selection.selected:[r.id]));
    const group=resize?[r]:regions.filter(item=>ids.has(item.id));
    const positions=group.map(item=>({id:item.id,x:item.x,y:item.y}));
    for(const item of group)views.get(item.id).element.classList.add('moving');
    const move = e => {
      const dx = group.some(item=>item.type==='section')?0:e.clientX-start.x, dy = e.clientY-start.y;
      const before=group.map(item=>({item,x:item.x,y:item.y,width:item.width,height:item.height}));
      if (resize) {
        if(r.type==='section'){if(r.collapsed)return;r.height=Math.max(100,Math.min(20000-r.y,start.h+dy));}
        else if(r.type==='image')Object.assign(r,resizeImage(start.w,start.h,dx,dy));
        else {r.width = Math.max(r.type==='text'?40:220,Math.min(20000,start.w+dx));r.height = Math.max(r.type==='text'?26:100,Math.min(20000,start.h+dy));}
        if(r.type==='text')r.manualSize=true;
      } else {
        for(const position of moveGroup(positions,dx,dy)) {
          const item=group.find(item=>item.id===position.id);item.x=position.x;item.y=position.y;
        }
      }
      try{validateSections(regions);}catch(error){for(const state of before)Object.assign(state.item,{x:state.x,y:state.y,width:state.width,height:state.height});message(error.message);return;}
      placeAll();
    };
    const end = () => { handle.removeEventListener('pointermove',move); handle.removeEventListener('pointerup',end); handle.removeEventListener('pointercancel',end);for(const item of group)views.get(item.id).element.classList.remove('moving');recalculate(); };
    handle.addEventListener('pointermove',move); handle.addEventListener('pointerup',end); handle.addEventListener('pointercancel',end);
  });
}
function render(focusId, caret) {
  pendingFocusId=focusId;
  regions=regions.filter(r=>r.id===focusId || !emptyRegion(r));
  for(const id of selection.selected)if(!regions.some(r=>r.id===id))selection.selected.delete(id);
  for(const view of views.values())view.dispose?.();
  canvas.replaceChildren(); views.clear();
  for (const r of regions) {
    if(r.type==='math' && r.unitMode==='raw')r.latex=sourceToLatex(r.source);
    const el = document.createElement('section'); el.className = `region ${r.type}`; el.dataset.id = r.id; place(el,r);updateFieldChrome(r,el);
    const head = document.createElement('div'); head.className = 'region-head';
    const title = document.createElement('span'); title.textContent = '⠿'; title.title = 'Drag to move';
    const remove = document.createElement('button'); remove.textContent = '×'; remove.setAttribute('aria-label', `Delete ${r.type} region`);
    remove.onclick = () => removeRegions(new Set([r.id]));
    title.className='move-handle';
    el.addEventListener('dblclick',event=>{if(r.hidden && !event.ctrlKey && !event.metaKey){r.hidden=false;render();}});
    head.append(remove);mountInformation(r,head,remove,recordHistory);mountProperties(r,el,head,remove,recordHistory); el.append(title,head); pointerMove(title,el,r);
    for(const side of ['top','right','bottom','left']){
      const edge=document.createElement('div');edge.className=`move-edge move-edge-${side}`;edge.setAttribute('aria-hidden','true');el.append(edge);pointerMove(edge,el,r);
    }
    const body = document.createElement('div'); body.className = 'region-body'; el.append(body);
    const output = document.createElement('output'); const view = { output,element:el }; views.set(r.id,view);
    if(r.type==='section') {
      Object.assign(view,mountSection(r,body,()=>{r.collapsed=!r.collapsed;canvasPoint=undefined;pendingFocusId=undefined;selection.clear();render();},recordHistory));
    } else if (r.type === 'math') {
      const field = mathEditor(r, {
        change: () => { raw.value = r.source;updateFieldChrome(r,el);schedule(); },
        toText: (text, position) => {
          r.type = 'text'; r.text = text; delete r.latex; delete r.source; delete r.unitMode;
          render(r.id, position);
        },
        nextLine: () => insertDefinition(r),
        previousLine: () => closeEmptyRow(r),
      });
      view.result = resultEditor(); view.editor = field;
      const line = document.createElement('div'); line.className = 'equation-line';
      view.vectorToggle=document.createElement('button');view.vectorToggle.type='button';view.vectorToggle.className='vector-toggle';view.vectorToggle.hidden=true;
      view.vectorToggle.onclick=()=>{r.showVector=!r.showVector;showValues.checked=!!r.showVector;recalculate();};
      line.append(field,view.result,view.vectorToggle); body.append(line,field.unitHint,output);
      const details = document.createElement('details'), summary = document.createElement('summary'); summary.textContent = '⚙'; summary.title='Edit Math.js expression'; summary.setAttribute('aria-label','Edit Math.js expression'); details.append(summary);
      const settings=document.createElement('div'); settings.className='region-settings'; details.append(settings);
      const raw = input(settings,r.source,'Math.js expression', value => {
        r.source=value;r.unitMode='raw';delete r.conversionError;r.latex=sourceToLatex(value);
        field.setValue(r.latex,{silenceNotifications:true});updateFieldChrome(r,el);schedule();
      });
      const valuesLabel=document.createElement('label'),showValues=document.createElement('input');showValues.type='checkbox';showValues.checked=!!r.showVector;
      showValues.setAttribute('aria-label','Show long vector/matrix results');showValues.onchange=()=>{r.showVector=showValues.checked;recalculate();};
      valuesLabel.className='result-visibility';valuesLabel.append(showValues,document.createTextNode('Show long vector/matrix results'));settings.append(valuesLabel);
      const modeLabel=document.createElement('label'),displayOnly=document.createElement('input');displayOnly.type='checkbox';displayOnly.checked=!!r.displayOnly;
      displayOnly.setAttribute('aria-label','Display only — do not evaluate');displayOnly.onchange=()=>{r.displayOnly=displayOnly.checked;recalculate();};
      modeLabel.className='result-visibility';modeLabel.append(displayOnly,document.createTextNode('Display only — do not evaluate'));settings.append(modeLabel);
      const hint = document.createElement('small'); hint.textContent = 'End with = to show the result. Display-only formulas do not define variables. Math.js syntax updates the canvas as you type.'; settings.append(hint); head.insertBefore(details,remove);
    } else if (r.type === 'text') {
      Object.assign(view,mountNote(r,body,el,bounds,()=>closeEmptyRow(r),head,remove));
    }
    else if (r.type === 'image') { const img = document.createElement('img'); img.src = r.src; img.alt = r.alt; img.draggable = false; body.append(img); }
    else if(r.type==='slider'||r.type==='radio') {
      Object.assign(view,mountControl(r,body,head,remove,options=>{
        animationTick=!!options?.animation;try{recalculate();}finally{animationTick=false;}
      }));body.append(output);
    }
    else {Object.assign(view,mountPlot(r,body,head,remove,recalculate));body.append(output);}
    canvas.append(el);
    if(r.type!=='section') {
      const hide=document.createElement('button');hide.type='button';hide.textContent=r.hidden?'□':'−';hide.setAttribute('aria-label',r.hidden?'Show field':'Hide field');hide.title=r.hidden?'Show field':'Hide field';hide.onclick=()=>{r.hidden=!r.hidden;render();};head.insertBefore(hide,remove);
      const placeholder=document.createElement('input');placeholder.type='text';placeholder.className='hidden-placeholder';placeholder.value=r.hiddenLabel ?? fieldNames[r.type];placeholder.maxLength=120;placeholder.setAttribute('aria-label','Hidden field label');placeholder.addEventListener('input',()=>{r.hiddenLabel=placeholder.value;recordHistory();});el.append(placeholder);
    }
    // Keep shared actions on the first row; type-specific tools and decoration follow.
    const info=head.querySelector('.field-info'),properties=head.querySelector('.field-properties');
    const toggle=r.type==='section'?body.querySelector('.section-bar button'):head.querySelector('button[aria-label="Hide field"],button[aria-label="Show field"]');
    const tools=[...head.children].filter(child=>![title,info,toggle,remove,properties].includes(child));
    tabProperties(r,el,properties,tools,recordHistory);
    head.replaceChildren(properties,info,toggle,remove);
    if(r.type==='text'||r.type==='plot'||r.type==='image'||r.type==='section'||r.type==='slider'||r.type==='radio') {
      const corner=document.createElement('div');corner.className='resize corner-resize';corner.title=`Resize ${r.type} field`;corner.setAttribute('aria-label',corner.title);el.append(corner);pointerMove(corner,el,r,true);
    }
  }
  canvas.append(canvasCaret);selection.refresh();bounds(); recalculate();
  if (focusId) {
    const focused=regions.find(r=>r.id===focusId);if(focused?.hidden || (focused && hiddenBySection(regions,focused))){pendingFocusId=undefined;canvas.focus();return;}
    views.get(focusId)?.activate?.();
    const editor = views.get(focusId)?.editor;
    editor?.focus();
    if (editor?.tagName === 'TEXTAREA') editor.setSelectionRange(caret ?? editor.value.length, caret ?? editor.value.length);
    // MathLive finishes connecting its internal editor after DOM insertion.
    const finishFocus = (attempt=0) => {
      if (!editor?.isConnected || pendingFocusId!==focusId) return;
      if (document.activeElement !== editor) editor.focus();
      if(document.activeElement===editor)pendingFocusId=undefined;
      else if(attempt<10)requestAnimationFrame(()=>finishFocus(attempt+1));
      else {pendingFocusId=undefined;cleanupEmpty();}
    };
    requestAnimationFrame(()=>finishFocus());
  }
}
function createMath(x, y, seed = '') {
  canvasPoint=undefined;
  const r = region('math', x, y); r.latex=seed; r.source=seed;
  regions.push(r); render(r.id); return r;
}
function insertDefinition(anchor) {
  const distance=Math.max(ROW_HEIGHT,(views.get(anchor.id)?.element.offsetHeight || 0)+6);
  try {
    if(anchor.y+distance>20000)throw Error('No room to insert another row at the edge of the worksheet.');
    stretchSection(regions,anchor.y,distance);insertRowAfter(regions,anchor.id,distance);selection.clear();const added=createMath(anchor.x,anchor.y+distance);
    insertedRows.set(added.id,{distance,anchorId:anchor.id});
    message('Inserted a row; later fields moved down.');
  }catch(error){message(error.message);}
}
function closeEmptyRow(r) {
  if(!emptyRegion(r))return;
  const inserted=insertedRows.get(r.id);
  stretchSection(regions,r.y,-(inserted?.distance || ROW_HEIGHT));
  pendingFocusId=undefined;
  removeRowAfter(regions,r.id,inserted?.distance || ROW_HEIGHT);
  removeRegions(new Set([r.id]));
  placeAll();
  setCanvasPoint({x:r.x,y:Math.max(0,r.y-(inserted?.distance || ROW_HEIGHT)),step:inserted?.distance || ROW_HEIGHT});
  message('Removed the empty row; later fields moved up.');
}
canvas.tabIndex=0;
document.addEventListener('keydown',event=>{
  if(event.isComposing)return;
  if((event.ctrlKey||event.metaKey) && !event.altKey && event.key.toLowerCase()==='a' && !event.target.closest('.region-settings,.section-bar,.hidden-placeholder') && (!event.target.matches('input,textarea,[contenteditable="true"]') || event.target.closest('#canvas'))) {
    event.preventDefault();event.stopImmediatePropagation();
    pendingFocusId=undefined;selection.selected.clear();for(const r of regions)if(!hiddenBySection(regions,r))selection.selected.add(r.id);
    canvas.focus();selection.refresh();return;
  }
  if((event.key==='Delete'||event.key==='Backspace') && selection.selected.size && event.target===canvas) {
    event.preventDefault();event.stopImmediatePropagation();const count=selection.selected.size;removeRegions(new Set(selection.selected));message(`Deleted ${count} selected fields.`);return;
  }
  if(event.key==='Escape') {
    const id=event.target.closest('.region')?.dataset.id;
    if(id)setTimeout(()=>cleanupEmpty(id),0);
  }
},true);
canvas.addEventListener('keydown', event => {
  if(event.key==='Escape' && selection.selected.size){event.preventDefault();selection.clear();message('Selection cleared.');return;}
  if(event.key==='Enter' && selection.selected.size && event.target===canvas) {
    event.preventDefault();const anchor=ordered(regions).filter(r=>selection.selected.has(r.id)).at(-1);if(anchor)insertDefinition(anchor);return;
  }
  if(event.target===canvas && canvasPoint && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if(event.key==='Backspace') {
      event.preventDefault();const point={...canvasPoint},container=sections(regions).find(s=>point.y>=s.y+SECTION_HEADER && point.y<s.y+s.height);canvasPoint=removeCanvasRow(regions,canvasPoint,canvasPoint.step);if(container)container.height=Math.max(100,container.height-(point.y-canvasPoint.y));placeAll();recalculate();setCanvasPoint(canvasPoint);return;
    }
    if(event.key==='Enter') {
      event.preventDefault();const point={...canvasPoint},height=point.step || ROW_HEIGHT;
      if(regions.some(r=>r.y>=point.y && r.y+height>20000)){message('No room to insert another row.');return;}
      try{stretchSection(regions,point.y,height);}catch(error){message(error.message);return;}for(const r of regions)if(r.y>=point.y)r.y+=height;
      const added=createMath(point.x,point.y);insertedRows.set(added.id,{distance:height});return;
    }
  }
  if (event.target !== canvas || event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
  event.preventDefault(); createMath(canvasPoint?.x ?? viewport.scrollLeft+60,canvasPoint?.y ?? sheetY(regions,viewport.scrollTop+60),event.key);
});
function add(type) {
  const point=pasteAnchor;
  if (type === 'math') return createMath(point.x,point.y);
  const r = region(type, point.x,point.y);
  if(type==='slider'||type==='radio') {
    const base=r.name;let suffix=1;
    while(regions.some(item=>item.name===r.name || item.source?.match(new RegExp(`^\\s*${r.name}\\s*=`))))r.name=base+(++suffix);
  }
  if (type === 'text') r.text='';
  regions.push(r); render(r.id); return r;
}
for (const type of ['math','text','plot','slider','radio']) document.querySelector(`#add-${type}`).onclick = () => add(type);
document.querySelector('#add-section').onclick=()=>{
  const selected=regions.filter(r=>selection.selected.has(r.id) && r.type!=='section' && !hiddenBySection(regions,r));
  const y=selected.length?Math.min(...selected.map(r=>r.y)):pasteAnchor.y;
  if(sections(regions).some(s=>y>=s.y && y<s.y+s.height)){message('Sections cannot nest. Choose fields outside an existing section.');return;}
  const section=region('section',0,y),before=regions.map(r=>({r,y:r.y}));
  if(selected.length)section.height=Math.max(100,...selected.map(r=>r.y+Math.max(views.get(r.id).element.offsetHeight,26)-y+56));
  for(const r of regions)if(r.y>=y)r.y+=selected.length?40:section.height;
  try{validateSections([...regions,section]);if(regions.some(r=>r.y>20000))throw Error('No room for a section here.');}
  catch(error){for(const state of before)state.r.y=state.y;message(error.message);return;}
  regions.push(section);selection.clear();render();message('Section created. All fields between its horizontal boundaries belong to it. Drag its bottom edge to change its height.');
};
document.querySelector('#save').onclick = () => {
  cleanupEmpty();
  const url = URL.createObjectURL(new Blob([serialize(regions)],{type:'application/json'}));
  const a = document.createElement('a'); a.href=url; a.download='orbit-worksheet.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000); message('Worksheet saved, including embedded images.');
};
document.querySelector('#load').onclick = () => document.querySelector('#file').click();
document.querySelector('#file').onchange = async event => {
  try { const file = event.target.files[0]; if (!file) return; if (file.size > 30_000_000) throw Error('Worksheet exceeds 30 MB.'); const next = await fitSavedImages(deserialize(await file.text())); regions = next;selection.clear();render();message('Worksheet loaded.'); }
  catch (e) { message(`Load failed: ${e.message}`); } finally { event.target.value=''; }
};
async function addImage(file,offset=0,position=pasteAnchor,operation=historyGroup) {
  if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)) throw Error('Use PNG, JPEG, WebP or GIF.');
  if (file.size > 8_000_000) throw Error('Images must be smaller than 8 MB.');
  const src = await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=()=>reject(Error('Cannot read image.')); reader.readAsDataURL(file); });
  const size=await imageDimensions(src);
  historyGroup=operation;historyMerge=Infinity;
  const r = region('image',position.x+offset,position.y+offset);Object.assign(r,fitImage(size.width,size.height));r.src=src; r.alt=file.name || 'Clipboard image'; regions.push(r);document.activeElement?.blur();render();message('Image added. Drag its left handle to move or its corner to resize.');
}
document.addEventListener('paste', async event => {
  const images = [...(event.clipboardData?.items || [])].filter(item => item.type.startsWith('image/'));
  const target=event.target instanceof Element?event.target:document.activeElement;
  if(target?.closest('.region-settings,.section-bar,.hidden-placeholder') || (target?.matches('input,textarea,[contenteditable="true"]') && !target.closest('#canvas')))return;
  const activeRegion=target?.closest('.region') || document.activeElement?.closest('.region');
  const r=regions.find(r=>r.id===activeRegion?.dataset.id);
  if(images.length) {
    event.preventDefault();event.stopImmediatePropagation();
    const position={...pasteAnchor};
    try { for(const [i,item] of images.entries())await addImage(item.getAsFile(),i*30,position); }catch(error){message(error.message);}
    return;
  }
  const text=event.clipboardData?.getData('text/plain');
  if(!text)return;
  event.preventDefault();event.stopImmediatePropagation();
  if(r?.type==='text') {
    const view=views.get(r.id),editor=view.editor;
    if(editor.hidden){view.activate();editor.focus();editor.setSelectionRange(editor.value.length,editor.value.length);}
    replaceTextSelection(editor,text);return;
  }
  if(r?.type==='math' && !emptyRegion(r)) {
    const field=views.get(r.id).editor;
    const plain=latex=>unitSource(latex).replace(/unit\("([A-Za-z]+)"\)/g,'$1').replace(/\s+/g,'');
    const start=field.selection?.ranges[0]?.[0] ?? field.position,end=field.selection?.ranges[0]?.[1] ?? field.position;
    const prefix=plain(field.getValue(0,Math.min(start,end),'latex'));
    const suffix=plain(field.getValue(Math.max(start,end),field.lastOffset,'latex'));
    r.type='text';r.text=prefix+text+suffix;delete r.source;delete r.latex;delete r.unitMode;render(r.id,prefix.length+text.length);return;
  }
  const note=r?.type==='math'?r:region('text',pasteAnchor.x,pasteAnchor.y);
  if(note!==r)regions.push(note);
  note.type='text';note.text=text;delete note.source;delete note.latex;delete note.unitMode;
  render(note.id,text.length);
},true);
document.querySelector('#add-image').onclick = () => document.querySelector('#image-file').click();
document.querySelector('#image-file').onchange = async event => { try { if(event.target.files[0]) await addImage(event.target.files[0]); } catch(e) { message(e.message); } finally { event.target.value=''; } };
render();

import {parse} from 'mathjs';
import {sourceToLatex} from './expressions.js';
import {unitSource} from './units.js';
import {evaluationSource} from './equations.js';
import {statements} from './groups.js';
import {normalize} from './engine.js';
import {canvasZoom} from './canvas-geometry.js';

function canonical(node){
  if(node?.isParenthesisNode)return canonical(node.content);
  if(node?.isFunctionNode && ['log10','log2'].includes(node.fn.name) && node.args.length===1)return canonical(parse(`log(${node.args[0].toString()},${node.fn.name==='log10'?10:2})`));
  if(node?.isNode)return canonical(node.toJSON());
  if(Array.isArray(node))return node.map(canonical);
  if(node && typeof node==='object')return Object.fromEntries(Object.entries(node).filter(([key])=>key!=='implicit').map(([key,value])=>[key,canonical(value)]));
  return node;
}
export function safeGraphicalLatex(source,previousLatex){
  try{
    const original=statements(source).filter(row=>row.trim()).map(row=>canonical(parse(row)));
    for(const latex of [previousLatex,sourceToLatex(source)]){
      if(!latex)continue;
      try{const converted=statements(unitSource(latex)).filter(row=>row.trim()).map(row=>canonical(parse(normalize(evaluationSource(row)))));if(JSON.stringify(original)===JSON.stringify(converted))return latex;}catch{/* Try the generated form next. */}
    }
  }catch{/* Invalid source stays available in the source editor. */}
  return null;
}

export function nativeEditor(r,changed){
  const editor=document.createElement('textarea');editor.className='native-source-editor';editor.setAttribute('aria-label','Math.js source');editor.spellcheck=false;editor.wrap='off';editor.value=r.source;
  let manual=!!r.sourceHeight,lastWidth,lastHeight;
  const measure=document.createElement('canvas').getContext('2d');measure.font='16px Consolas, monospace';
  function fit(){
    if(manual)return;
    const lines=editor.value.split('\n');
    lastWidth=Math.min(20000,Math.max(48,Math.ceil(Math.max(...lines.map(line=>measure.measureText(line).width)))+26));
    lastHeight=Math.min(2000,Math.max(34,lines.length*24+10));
    editor.style.width=`${lastWidth}px`;editor.style.height=`${lastHeight}px`;
  }
  if(manual){lastWidth=r.width;lastHeight=r.sourceHeight;editor.style.width=`${lastWidth}px`;editor.style.height=`${lastHeight}px`;}else fit();
  const pending=document.createElement('small');pending.className='source-pending';pending.textContent='Uncalculated edits — Ctrl+Enter to calculate';pending.hidden=true;
  editor.addEventListener('input',()=>{r.source=editor.value;r.unitMode='raw';delete r.conversionError;fit();changed({commit:false});});
  editor.addEventListener('keydown',event=>{
    if(event.key==='Enter' && (event.ctrlKey || event.metaKey)){event.preventDefault();event.stopImmediatePropagation();changed({commit:true});}
  });
  editor.addEventListener('blur',()=>changed({commit:true}));
  const observer=new ResizeObserver(()=>{
    if(!editor.isConnected || matchMedia('print').matches)return;const rect=editor.getBoundingClientRect(),zoom=canvasZoom(editor),box={width:rect.width/zoom,height:rect.height/zoom};if(!box.width || !box.height)return;
    if(Math.abs(box.width-lastWidth)<1 && Math.abs(box.height-lastHeight)<1)return;
    manual=true;lastWidth=box.width;lastHeight=box.height;r.width=Math.max(48,Math.min(20000,Math.round(box.width)));r.sourceHeight=Math.max(34,Math.min(2000,Math.round(box.height)));
    editor.dispatchEvent(new CustomEvent('source-resized',{bubbles:true}));
  });observer.observe(editor);
  return {editor,nativeStatus:pending,fitSource:fit,dispose:()=>observer.disconnect()};
}

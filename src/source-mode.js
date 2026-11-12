import {canvasZoom} from './canvas-geometry.js';

export {projectMathjs as safeGraphicalLatex} from './math-translation.js';

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

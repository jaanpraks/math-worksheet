import {statements} from './groups.js';
export function emptyRegion(r) {
  if(r.type==='math'){
    if(r.conversionError)return false;
    // An incomplete visual operator has no executable source yet, but its
    // notation must survive cleanup and loading before conversion runs again.
    if(r.unitMode==='explicit' && !r.source.trim() && r.latex?.replace(/\\placeholder\{[^}]*\}|\s/g,''))return false;
    return statements(r.source).every(row=>!row.trim());
  }
  if(r.type==='text')return !r.text.trim();
  if(r.type==='plot')return !r.series.trim();
  if(r.type==='slider'||r.type==='radio')return false;
  if(r.type==='section')return false;
  return !r.src;
}
export function replaceTextSelection(editor,text) {
  const start=editor.selectionStart ?? editor.value.length,end=editor.selectionEnd ?? start;
  editor.setRangeText(text,start,end,'end');
  editor.dispatchEvent(new Event('input',{bubbles:true}));
}

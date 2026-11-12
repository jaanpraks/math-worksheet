import {statements} from './groups.js';
import {serialize,deserialize} from './model.js';
import {moveGroup} from './layout.js';
export const OBJECT_CLIPBOARD_TYPE='application/x-orbit-worksheet+json';
export const OBJECT_CLIPBOARD_PREFIX='ORBIT-WORKSHEET-OBJECTS\n';
export async function writeClipboardText(text){
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}}catch{/* Fall back to the user-initiated copy command. */}
  const active=document.activeElement,input=document.createElement('textarea');input.value=text;input.style.cssText='position:fixed;left:-10000px;top:0';document.body.append(input);input.select();
  try{if(!document.execCommand('copy'))throw Error('Clipboard access was denied.');}finally{input.remove();active?.focus({preventScroll:true});}
}
export function readObjectClipboard(data){
  if(!data)return null;
  const custom=data.getData(OBJECT_CLIPBOARD_TYPE),text=data.getData('text/plain');
  if(custom)return deserialize(custom);
  return text.startsWith(OBJECT_CLIPBOARD_PREFIX)?deserialize(text.slice(OBJECT_CLIPBOARD_PREFIX.length)):null;
}
export function duplicateObjects(items,point){
  if(!items.length)return [];
  const clean=deserialize(serialize(items)),x=Math.min(...clean.map(r=>r.x)),y=Math.min(...clean.map(r=>r.y));
  const dx=clean.some(r=>r.type==='section')?0:point.x-x;
  const positions=moveGroup(clean,dx,point.y-y);
  return clean.map((r,index)=>({...r,id:crypto.randomUUID(),x:positions[index].x,y:positions[index].y}));
}
export function emptyRegion(r) {
  if(r.hiddenLabel?.trim().startsWith('#') && r.hiddenLabel.trim().slice(1).trim())return false;
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

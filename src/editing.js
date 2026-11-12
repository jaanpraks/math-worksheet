import { MathfieldElement, convertAsciiMathToLatex } from 'mathlive';
import { isUnit, unitToken, unitSource } from './units.js';
import {configureMatrixMenu} from './matrices.js';
import { requestsResult,evaluationSource,recognizesMath } from './equations.js';
import {writeClipboardText} from './clipboard.js';
import {groupRows,groupLatex,atStatementLevel} from './groups.js';
import {sourceToLatex} from './expressions.js';
import {functionShortcuts} from './function-mappings.js';
import {compileGraphical,projectMathjs} from './math-translation.js';

// Capture an actual space key/paste, not whitespace added by the ASCII exporter.
export function mathEditor(r, { change, toText, nextLine, previousLine }) {
  const field = new MathfieldElement();
  field.className = 'expression';
  let draftError;
  if(r.unitMode==='explicit')try{compileGraphical(r.latex);}catch(error){draftError=error.message;}
  field.value=draftError?r.latex:sourceToLatex(r.source);r.latex=field.value;
  if(draftError)r.conversionError=draftError;else {delete r.conversionError;r.unitMode='raw';}
  if(r.unitMode==='raw' || recognizesMath(r.latex))r.equationMode=true;
  let lastNotifiedLatex=field.value;
  function updateSource(){
    try{r.source=compileGraphical(r.latex);delete r.conversionError;}
    catch(error){r.conversionError=error.message;}
    r.unitMode='explicit';
  }
  field.synchronizeMathSource=source=>{
    r.source=source;r.unitMode='raw';delete r.conversionError;
    field.setValue(sourceToLatex(source),{silenceNotifications:true});r.latex=field.value;lastNotifiedLatex=field.value;
  };
  field.setAttribute('aria-label', 'Math expression');
  field.mathVirtualKeyboardPolicy = 'manual';
  field.smartMode = false;
  let templates;
  field.addEventListener('mount',()=>{
    templates={...field.inlineShortcuts,...functionShortcuts};
    field.inlineShortcuts=Object.fromEntries(Object.entries(templates).filter(([name])=>!/[A-Za-z]/.test(name)));
    field.onInlineShortcut=()=>'';
    configureMatrixMenu(field,async()=>{
      try{
        const ranges=field.selection.ranges.filter(([a,b])=>a!==b);
        const source=ranges.length?ranges.map(([a,b])=>evaluationSource(unitSource(field.getValue(Math.min(a,b),Math.max(a,b),'latex')))).join(';'):evaluationSource(r.source);
        if(!ranges.length && r.conversionError)throw Error(r.conversionError);
        await writeClipboardText(source);field.dispatchEvent(new CustomEvent('worksheet-message',{bubbles:true,detail:'Copied as Math.js.'}));
      }catch(error){field.dispatchEvent(new CustomEvent('worksheet-message',{bubbles:true,detail:`Cannot copy as Math.js: ${error.message}`}));}
    });
  });
  const hint = document.createElement('span'); hint.className = 'unit-hint'; hint.hidden = true;
  hint.setAttribute('role', 'status');
  field.unitHint = hint;
  function candidate() {
    if (field.selection?.ranges.some(([a,b]) => a !== b)) return null;
    // Inspect local caret ranges: exporting a prefix flattens fraction branches.
    const end = field.position;
    let token;
    for (let start = end-1; start >= Math.max(0,end-64); start--) {
      let text;try{text=unitSource(field.getValue(start,end,'latex')).replace(/[()\s]/g,'');}catch{if(token)break;continue;}
      const match=text.match(/^([A-Za-z]+)(\^[+-]?\d+)?$/);
      if (match) {
        if (!token || text.length > token.text.length) token={name:match[1],power:match[2] || '',start,end,text};
      } else if (token) break;
    }
    return token && isUnit(token.name) ? token : null;
  }
  function suggest() {
    const match = candidate();
    hint.hidden = !match;
    hint.textContent = match ? `${match.name} — Tab to accept unit` : '';
  }
  const changed = () => {
    if(field.value===lastNotifiedLatex)return;
    delete r.showAnswer;
    r.latex = field.value;
    if(recognizesMath(r.latex))r.equationMode=true;
    lastNotifiedLatex=field.value;
    updateSource();
    change({commit:false}); suggest();
  };
  field.addEventListener('input', changed);
  field.addEventListener('selection-change', suggest);
  function commitCalculation(force=false){
    if(r.unitMode==='raw' && field.value===lastNotifiedLatex){change({commit:true});return;}
    r.latex=field.value;updateSource();
    if(!r.conversionError && (force || field.position===field.lastOffset)){
      const projected=projectMathjs(r.source,{evaluationMarkers:true});
      if(projected!==null && projected!==field.value){field.setValue(projected,{silenceNotifications:true});field.position=field.lastOffset;}
    }
    r.latex=field.value;if(recognizesMath(r.latex))r.equationMode=true;lastNotifiedLatex=field.value;change({commit:true});
  }
  field.addEventListener('focus',()=>{if(r.unitMode==='raw')lastNotifiedLatex=field.value;});
  field.addEventListener('blur', () => { hint.hidden=true;commitCalculation(true); });
  field.addEventListener('keyup',event=>{if([')',']','}','='].includes(event.key))commitCalculation();},true);
  field.addEventListener('keydown', event => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if(/[=+\-*/^()[\]]/.test(event.key) && event.key.length===1)r.equationMode=true;
    const grouped=!!groupRows(field.value),depth=field.getElementInfo(field.position)?.depth ?? 0;
    if(event.key===';' && depth<=(grouped?1:0) && atStatementLevel(field.getValue(0,field.position,'latex'))) {
      event.preventDefault();event.stopImmediatePropagation();
      if(groupRows(field.value))field.executeCommand('addRowAfter');
      else {
        const prefix=field.getValue(0,field.position,'latex'),suffix=field.getValue(field.position,field.lastOffset,'latex');
        field.setValue(groupLatex([prefix,suffix]),{silenceNotifications:true});field.position=field.lastOffset-1;
      }
      changed();
    }else if(event.key==='Backspace' && !field.value.trim()) {
      event.preventDefault();event.stopImmediatePropagation();
      // MathLive can clear its value before its input notification arrives.
      // Use the visible editor state when closing a newly emptied field.
      r.latex='';r.source='';previousLine();
    } else if (event.key === 'Tab' && !event.shiftKey) {
      if(field.getElementInfo(field.position)?.data?.['worksheet-function']==='1')return;
      const match = candidate();
      if (!match) {
        const end=field.position;let found;
        for(let start=end-1;start>=Math.max(0,end-64);start--){const name=field.getValue(start,end,'latex');if(!/^[A-Za-z][A-Za-z0-9]*$/.test(name))break;found={name,start};}
        const shortcut=found && templates?.[found.name],value=typeof shortcut==='string'?shortcut:shortcut?.value;
        if(!value)return;
        event.preventDefault();event.stopImmediatePropagation();field.selection={ranges:[[found.start,end]],direction:'forward'};field.insert(value,{selectionMode:'placeholder',focus:true});changed();return;
      }
      event.preventDefault(); event.stopImmediatePropagation();
      const before = field.getValue(Math.max(0,match.start-1), match.start, 'latex').trim();
      const prefix = field.getValue(0, match.start, 'latex').trim();
      field.selection = { ranges: [[match.start,match.end]], direction: 'forward' };
      // Inline shortcuts may wrap 'kg' in an operator-name atom with an empty
      // leading offset. Only fall back to the prefix outside fraction branches.
      const wrappedNumber = !before && !/\\(?:frac|htmlData)/.test(prefix) && /[0-9)]$/.test(prefix);
      const multiply = /[0-9)]$/.test(before) || wrappedNumber ? '\\cdot ' : '';
      const power = match.power ? `^{${match.power.slice(1)}}` : '';
      field.insert(multiply + unitToken(match.name) + power, { format: 'latex', selectionMode: 'after' });
      field.applyStyle({ color: 'none', fontFamily: 'none' });
      changed(); hint.hidden=true;
    } else if (event.key === ' ') {
      event.preventDefault(); event.stopImmediatePropagation();if(!field.value.trim())toText('',0);else {field.insert('\\;',{format:'latex',selectionMode:'after'});changed();}
    } else if (event.key === 'Enter') {
      event.preventDefault(); event.stopImmediatePropagation();commitCalculation();nextLine();
    } else if (event.key === 'Escape') { field.blur(); }
  }, true);
  // Keyboard entry, mobile input, and MathLive's virtual space key.
  field.addEventListener('beforeinput', event => {
    if (event.data === ' ') {
      event.preventDefault(); event.stopImmediatePropagation();if(!field.value.trim())toText('',0);else {field.insert('\\;',{format:'latex',selectionMode:'after'});changed();}
    }
  });
  return field;
}

export function resultEditor() {
  const field = new MathfieldElement();
  field.className = 'result'; field.readOnly = true;
  field.tabIndex = -1; field.setAttribute('aria-hidden', 'true');
  return field;
}

export function updateResult(view, result, r) {
  const visible=r.type!=='math' || (!r.displayOnly && (r.displayMode==='source'?r.showNativeResult!==false:requestsResult(r.source)));
  view.output.classList.toggle('error', !!result.error);
  view.output.textContent = result.error || (visible && result.text ? `= ${result.text}` : '');
  const long=result.collection?.count>12;
  if(view.vectorToggle){view.vectorToggle.hidden=!visible||!long||!!result.error;view.vectorToggle.textContent=r.showVector?'Hide values':`Show ${result.collection?.count} values`;}
  view.resultText=result.text || '';
  if(r.displayMode==='source'){view.output.textContent=result.error || (visible && result.text?`→ ${long && !r.showVector?'[…]' : result.text}`:'');if(view.nativeStatus)view.nativeStatus.hidden=true;return;}
  if(!view.result)return;
  view.result.hidden = !visible || !!result.error || !result.text;
  // An explicitly typed trailing '=' is already rendered by the expression.
  const equal = requestsResult(r.source) ? '' : '=';
  const collapsed=long && !r.showVector && !result.error;
  view.result.dataset.collapsed=String(collapsed);
  view.result.value = visible && result.text ? equal + (collapsed?'\\left[\\cdots\\right]':resultLatex(result)) : '';
}
export function resultLatex(result) {
  // ASCII math treats 'e' as a symbol, so spell out scientific notation first.
  const display = result.text?.replace(/(\d+(?:\.\d*)?|\.\d+)[eE]([+-]?\d+)/g,
    (_, mantissa, exponent) => `${mantissa}*10^(${Number(exponent)})`);
  return result.latex || (display?convertAsciiMathToLatex(display):'');
}

import { MathfieldElement, convertAsciiMathToLatex } from 'mathlive';
import { isUnit, unitToken, unitSource } from './units.js';
import { squareMatrices,configureMatrixMenu } from './matrices.js';
import { requestsResult } from './equations.js';
import {groupRows,groupLatex,atStatementLevel} from './groups.js';

// Capture an actual space key/paste, not whitespace added by the ASCII exporter.
export function mathEditor(r, { change, toText, nextLine, previousLine }) {
  const field = new MathfieldElement();
  field.className = 'expression';
  const initial=squareMatrices(r.latex);
  if(initial!==r.latex){r.latex=initial;if(r.unitMode!=='raw')r.source=unitSource(initial);}
  field.value = r.latex;
  field.setAttribute('aria-label', 'Math expression');
  field.mathVirtualKeyboardPolicy = 'manual';
  field.smartMode = false;
  field.addEventListener('mount',()=>{
    field.inlineShortcuts={...field.inlineShortcuts,fft:'\\operatorname{fft}',ifft:'\\operatorname{ifft}'};
    configureMatrixMenu(field);
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
      const text=field.getValue(start,end,'ascii-math').replace(/[()\s]/g,'');
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
    const squared=squareMatrices(field.value);
    if(squared!==field.value){const selection=field.selection;field.setValue(squared,{silenceNotifications:true});field.selection=selection;}
    r.latex = field.value;
    r.source = unitSource(r.latex); r.unitMode='explicit';
    change(); suggest();
  };
  field.addEventListener('input', changed);
  field.addEventListener('selection-change', suggest);
  field.addEventListener('blur', () => { hint.hidden=true; });
  const plainText = latex => unitSource(latex).replace(/unit\("([A-Za-z]+)"\)/g, '$1').replace(/\s+/g, '');
  const asText = () => plainText(field.value);
  function insertText(text) {
    const prefix = plainText(field.getValue(0, field.position, 'latex'));
    const current = asText();
    toText(current.slice(0, prefix.length) + text + current.slice(prefix.length), prefix.length + text.length);
  }
  field.addEventListener('keydown', event => {
    if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
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
      const match = candidate();
      if (!match) return;
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
      event.preventDefault(); event.stopImmediatePropagation(); insertText(' ');
    } else if (event.key === 'Enter') {
      event.preventDefault(); event.stopImmediatePropagation(); nextLine();
    } else if (event.key === 'Escape') { field.blur(); }
  }, true);
  field.addEventListener('paste', event => {
    if ([...(event.clipboardData?.items || [])].some(item => item.type.startsWith('image/'))) return;
    const text = event.clipboardData?.getData('text/plain');
    if (text && /\s/.test(text)) {
      event.preventDefault(); event.stopImmediatePropagation(); insertText(text);
    }
  }, true);
  // Keyboard entry, mobile input, and MathLive's virtual space key.
  field.addEventListener('beforeinput', event => {
    if (event.data === ' ') {
      event.preventDefault(); event.stopImmediatePropagation(); insertText(' ');
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
  const visible=r.type!=='math' || (!r.displayOnly && requestsResult(r.source));
  view.output.classList.toggle('error', !!result.error);
  view.output.textContent = result.error || (visible && result.text ? `= ${result.text}` : '');
  if (!view.result) return;
  const long=result.collection?.count>12;
  if(view.vectorToggle){view.vectorToggle.hidden=!visible||!long||!!result.error;view.vectorToggle.textContent=r.showVector?'Hide values':`Show ${result.collection?.count} values`;}
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

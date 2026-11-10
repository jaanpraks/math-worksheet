import { renderMarkdown,linkTarget } from './markdown.js';

export function mountNote(region, host, container, layout, previousLine, head, remove) {
  const preview=document.createElement('div'); preview.className='note-preview';
  preview.tabIndex=0; preview.setAttribute('aria-label','Edit note'); preview.title='Click to edit Markdown';
  const editor=document.createElement('textarea');editor.value=region.text;editor.rows=1;editor.spellcheck=false;
  editor.setAttribute('aria-label','Note');editor.hidden=true;
  host.append(preview,editor);
  let editing=false,saved={start:region.text.length,end:region.text.length};
  const render=()=>{
    preview.replaceChildren(renderMarkdown(region.text));
    if (!region.text) { const hint=document.createElement('span');hint.className='note-placeholder';hint.textContent='Write a note…';preview.append(hint); }
  };
  function fit() {
    container.classList.toggle('is-empty',!region.text.trim());
    container.classList.toggle('manual-size',!!region.manualSize);
    if (editing) {
      const context=document.createElement('canvas').getContext('2d'),font=getComputedStyle(editor);
      context.font=`${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
      const width=Math.max(40,...region.text.split('\n').map(line=>context.measureText(line || ' ').width+8));
      container.style.width=`${region.manualSize?region.width:Math.min(region.width,width)}px`;
      editor.style.height='auto';editor.style.height=`${Math.max(26,editor.scrollHeight)}px`;
    } else {
      container.style.width=`${region.width}px`;
      if(!region.manualSize)container.style.width=`${Math.max(40,Math.min(region.width,preview.offsetWidth))}px`;
    }
    layout();
  }
  function activate() {
    editing=true;preview.hidden=true;editor.hidden=false;fit();
  }
  function edit() { activate();editor.focus();editor.setSelectionRange(editor.value.length,editor.value.length); }
  function finish() { editing=false;render();editor.hidden=true;preview.hidden=false;fit(); }
  preview.addEventListener('click',event=>{if(!event.target.closest('a'))edit();});
  preview.addEventListener('keydown',event=>{
    if(event.target!==preview)return;
    if(event.key==='Enter'||event.key==='F2'){event.preventDefault();edit();}
  });
  editor.addEventListener('input',()=>{region.text=editor.value;fit();});
  editor.addEventListener('blur',()=>{saved={start:editor.selectionStart,end:editor.selectionEnd};finish();});
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='↗';summary.title='Insert link (Ctrl+K)';summary.setAttribute('aria-label','Insert link');details.append(summary);head.insertBefore(details,remove);
  const panel=document.createElement('div');panel.className='region-settings link-settings';details.append(panel);
  const field=label=>{const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.setAttribute('aria-label',label);wrap.append(input);panel.append(wrap);return input;};
  const text=field('Link text'),url=field('Link address'),error=document.createElement('small');error.setAttribute('role','status');
  const add=document.createElement('button');add.type='button';add.textContent='Add link';panel.append(add,error);
  function open(){if(editing)saved={start:editor.selectionStart,end:editor.selectionEnd};details.open=true;text.value=region.text.slice(saved.start,saved.end);url.value='';error.textContent='';(text.value?url:text).focus();}
  summary.addEventListener('click',event=>{event.preventDefault();if(details.open)details.open=false;else open();});
  editor.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();event.stopPropagation();open();}});
  add.onclick=()=>{
    const address=url.value.trim(),label=text.value.trim() || address;
    if(!address || !linkTarget(address) || /[\r\n]/.test(address)){error.textContent='Enter an https://, http://, mailto: or relative link.';url.focus();return;}
    const target=address.replace(/\s/g,c=>encodeURIComponent(c)).replace(/\(/g,'%28').replace(/\)/g,'%29');
    activate();editor.focus();editor.setSelectionRange(saved.start,saved.end);editor.setRangeText(`[${label.replace(/\\/g,'\\\\').replace(/\]/g,'\\]').replace(/\r?\n/g,' ')}](${target})`,saved.start,saved.end,'end');
    editor.dispatchEvent(new Event('input',{bubbles:true}));saved={start:editor.selectionEnd,end:editor.selectionEnd};details.open=false;editor.blur();preview.focus();
  };
  editor.addEventListener('keydown',event=>{
    if(event.key==='Backspace' && !event.isComposing && !event.ctrlKey && !event.metaKey && !editor.value.trim()) {
      event.preventDefault();event.stopImmediatePropagation();previousLine();return;
    }
    if(event.key==='Escape'){event.preventDefault();editor.blur();preview.focus();}
  });
  render();requestAnimationFrame(fit);
  return {editor,fit,activate};
}

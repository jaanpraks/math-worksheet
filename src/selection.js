export function selectionTool(canvas, { elements, create, changed }) {
  const selected=new Set();
  function refresh() {
    for(const el of elements()) el.classList.toggle('selected',selected.has(el.dataset.id));
    changed(selected.size);
  }
  const clear=()=>{selected.clear();refresh();};
  let suppressClick=false;
  canvas.addEventListener('click',event=>{
    if(suppressClick){event.preventDefault();event.stopImmediatePropagation();suppressClick=false;}
  },true);
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const region=event.target.closest('.region');
    const additive=event.ctrlKey||event.metaKey||event.shiftKey;
    if(region && additive && !event.target.closest('.region-settings')) {
      event.preventDefault();event.stopImmediatePropagation();
      if(selected.has(region.dataset.id))selected.delete(region.dataset.id);else selected.add(region.dataset.id);
      suppressClick=true;refresh();canvas.focus();return;
    }
    if(region){if(!selected.has(region.dataset.id))clear();return;}
    if(event.target!==canvas)return;
    event.preventDefault();event.stopImmediatePropagation();canvas.focus();
    const box=canvas.getBoundingClientRect(),start={x:event.clientX-box.left,y:event.clientY-box.top};
    const original=new Set(additive?selected:[]);
    if(!additive)clear();
    canvas.setPointerCapture(event.pointerId);
    const marquee=document.createElement('div');marquee.className='selection-marquee';canvas.append(marquee);
    let dragged=false;
    const move=e=>{
      const current=canvas.getBoundingClientRect(),x=e.clientX-current.left,y=e.clientY-current.top;
      if(Math.hypot(x-start.x,y-start.y)>4)dragged=true;
      if(!dragged)return;
      const left=Math.min(x,start.x),top=Math.min(y,start.y),width=Math.abs(x-start.x),height=Math.abs(y-start.y);
      Object.assign(marquee.style,{left:`${left}px`,top:`${top}px`,width:`${width}px`,height:`${height}px`});
      selected.clear();for(const id of original)selected.add(id);
      for(const el of elements()) {
        const b=(el.querySelector('.section-bar') || el).getBoundingClientRect(),ex=b.left-current.left,ey=b.top-current.top;
        if(ex<left+width && ex+b.width>left && ey<top+height && ey+b.height>top)selected.add(el.dataset.id);
      }
      refresh();
    };
    const end=e=>{
      canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',end);canvas.removeEventListener('pointercancel',end);
      marquee.remove();if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
      if(e.type==='pointercancel'){selected.clear();for(const id of original)selected.add(id);refresh();return;}
      if(dragged){suppressClick=true;refresh();}
      else if(!additive)create(Math.max(0,start.x),Math.max(0,start.y));
    };
    canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  },true);
  return {selected,refresh,clear};
}

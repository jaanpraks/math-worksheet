const sizes=new Map();
const observed=new WeakSet();
export function positionPopovers(viewport) {
  const view=viewport.getBoundingClientRect();
  for(const details of document.querySelectorAll('.region-head > details[open]')){
    const panel=details.querySelector(':scope > .region-settings');if(!panel)continue;
    if(!panel.querySelector('.popover-close')){
      const close=document.createElement('button');close.type='button';close.className='popover-close';close.textContent='×';close.title='Close menu';close.setAttribute('aria-label',details.classList.contains('field-info')?'Close element information':'Close element settings');
      const dismiss=()=>{details.open=false;details.querySelector(':scope > summary')?.focus({preventScroll:true});};
      close.addEventListener('pointerdown',event=>event.preventDefault());close.onclick=dismiss;
      let heading=panel.querySelector(':scope > .properties-tabs');
      if(!heading){heading=document.createElement('div');heading.className='popover-heading';panel.prepend(heading);}
      heading.append(close);
      panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss();}});
    }
    const key=`${details.closest('.region')?.dataset.id}:${details.className}`;
    if(!observed.has(panel)){
      observed.add(panel);const size=sizes.get(key);if(size){panel.style.width=`${size.width}px`;panel.style.height=`${size.height}px`;}
      const observer=new ResizeObserver(()=>{if(!panel.isConnected){observer.disconnect();return;}if(details.open){const box=panel.getBoundingClientRect();sizes.set(key,{width:box.width,height:box.height});}});observer.observe(panel);
      details.addEventListener('toggle',()=>{if(!details.isConnected)observer.disconnect();});
    }
    const head=details.parentElement.getBoundingClientRect(),box=panel.getBoundingClientRect();
    if(!panel._anchor)panel._anchor={
      x:Math.max(view.left+8,Math.min(head.right-box.width,view.right-box.width-8)),
      y:Math.max(view.top+8,Math.min(head.bottom+6,view.bottom-Math.min(box.height,view.height-16)-8))
    };
    panel.style.position='fixed';panel.style.right='auto';panel.style.left=`${panel._anchor.x}px`;panel.style.top=`${panel._anchor.y}px`;
  }
}
export function snapshotPopovers(root){
  return [...root.querySelectorAll('.region-head > details[open]')].map(details=>{
    const panel=details.querySelector(':scope > .region-settings'),box=panel?.getBoundingClientRect();
    return {id:details.closest('.region').dataset.id,kind:details.className,anchor:box?{x:box.left,y:box.top}:undefined,width:box?.width,height:box?.height,tab:details.querySelector('[role="tab"][aria-selected="true"]')?.textContent};
  });
}
export function restorePopovers(root,saved){
  for(const state of saved){
    const region=[...root.querySelectorAll('.region')].find(el=>el.dataset.id===state.id);
    const details=[...(region?.querySelectorAll('.region-head > details') || [])].find(el=>el.className===state.kind);
    if(!details)continue;
    const panel=details.querySelector(':scope > .region-settings');
    if(panel && state.anchor){panel._anchor=state.anchor;panel.style.width=`${state.width}px`;panel.style.height=`${state.height}px`;}
    details.open=true;
    [...details.querySelectorAll('[role="tab"]')].find(tab=>tab.textContent===state.tab)?.click();
  }
}
export function mountPopovers(viewport) {
  document.addEventListener('toggle',event=>{if(event.target.matches?.('.region-head > details')){if(!event.target.open){const panel=event.target.querySelector(':scope > .region-settings');if(panel)delete panel._anchor;}positionPopovers(viewport);}},true);
  viewport.addEventListener('scroll',()=>positionPopovers(viewport));window.addEventListener('resize',()=>positionPopovers(viewport));
}

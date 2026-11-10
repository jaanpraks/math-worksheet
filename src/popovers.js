export function positionPopovers(viewport) {
  const view=viewport.getBoundingClientRect();
  for(const details of document.querySelectorAll('.region-head > details[open]')){
    const panel=details.querySelector(':scope > .region-settings');if(!panel)continue;
    const head=details.parentElement.getBoundingClientRect(),width=panel.getBoundingClientRect().width;
    const left=Math.max(view.left+8,Math.min(head.right-width,view.right-width-8));
    panel.style.right='auto';panel.style.left=`${left-head.left}px`;
  }
}
export function mountPopovers(viewport) {
  document.addEventListener('toggle',event=>{if(event.target.matches?.('.region-head > details'))positionPopovers(viewport);},true);
  viewport.addEventListener('scroll',()=>positionPopovers(viewport));window.addEventListener('resize',()=>positionPopovers(viewport));
}

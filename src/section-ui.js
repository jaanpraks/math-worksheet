export function mountSection(r,body,toggle,changed) {
  const bar=document.createElement('div');bar.className='section-bar';
  const button=document.createElement('button');button.type='button';button.textContent=r.collapsed?'□':'−';button.setAttribute('aria-label',r.collapsed?'Expand section':'Collapse section');button.setAttribute('aria-expanded',String(!r.collapsed));button.onclick=toggle;
  const title=document.createElement('input');title.value=r.title;title.setAttribute('aria-label','Section title');title.addEventListener('input',()=>{r.title=title.value;changed();});
  bar.append(button,title);body.append(bar);return {editor:title};
}

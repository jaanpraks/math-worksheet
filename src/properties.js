export function applyAppearance(r,element) {
  element.style.backgroundColor=r.type==='section'?'transparent':r.backgroundColor || 'transparent';
  element.style.setProperty('--field-line',r.borderColor || 'transparent');
  if(r.type==='section' && r.backgroundColor)element.style.setProperty('--section-fill',r.backgroundColor);
  else element.style.removeProperty('--section-fill');
}
export function mountProperties(r,element,head,remove,changed) {
  const details=document.createElement('details'),summary=document.createElement('summary');details.className='field-properties';summary.textContent='⋮';summary.title='Field properties';summary.setAttribute('aria-label','Field properties');details.append(summary);
  const panel=document.createElement('div');panel.className='region-settings properties-panel';details.append(panel);
  const color=(key,label,fallback)=>{
    const row=document.createElement('label'),enabled=document.createElement('input'),picker=document.createElement('input');
    enabled.type='checkbox';enabled.checked=!!r[key] && r[key]!=='transparent';enabled.setAttribute('aria-label',`Show ${label.toLowerCase()}`);
    picker.type='color';picker.value=enabled.checked?r[key]:fallback;picker.setAttribute('aria-label',`${label} color`);
    const update=()=>{r[key]=enabled.checked?picker.value:'transparent';applyAppearance(r,element);changed();};
    enabled.onchange=update;picker.oninput=()=>{enabled.checked=true;update();};row.append(enabled,document.createTextNode(label),picker);panel.append(row);
  };
  color('backgroundColor','Background','#fff4cc');color('borderColor','Box line','#718991');head.insertBefore(details,remove);
}

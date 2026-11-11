export function mountInformation(r,head,remove,changed) {
  const details=document.createElement('details');details.className='field-info';
  const summary=document.createElement('summary');summary.textContent='?';summary.title='Explanation / help';summary.setAttribute('aria-label','Field information');details.append(summary);
  const panel=document.createElement('div');panel.className='region-settings info-panel';
  const input=document.createElement('input');input.type='text';input.value=r.description || '';input.maxLength=250;input.placeholder='Write a short explanation...';input.setAttribute('aria-label','Field explanation');
  input.addEventListener('input',()=>{input.value=input.value.replace(/[^\x20-\x7e]/g,'').slice(0,250);r.description=input.value;changed();});panel.append(input);details.append(panel);head.insertBefore(details,remove);
}

export function applyAppearance(r,element) {
  element.style.backgroundColor=r.type==='section'?'transparent':r.backgroundColor || 'transparent';
  element.style.setProperty('--field-line',r.borderColor || 'transparent');
  if(r.type==='section' && r.backgroundColor)element.style.setProperty('--section-fill',r.backgroundColor);
  else element.style.removeProperty('--section-fill');
}
export function mountProperties(r,element,head,remove,changed) {
  const details=document.createElement('details'),summary=document.createElement('summary');details.className='field-properties';summary.title='Field properties';summary.setAttribute('aria-label','Field properties');details.append(summary);
  summary.textContent='⋮';
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

export const fieldNames={text:'Text',image:'Picture',math:'Equation',plot:'Plot',slider:'Slider',radio:'Options',section:'Section'};
const fieldHelp={
  math:'Define variables and calculate expressions. End an expression with = to show its answer. Variables are available to fields below. Use Settings for direct Math.js syntax, units, matrices and display-only formulas.',
  text:'Write notes with Markdown headings, lists, emphasis and links. Click the text to edit it. Drag a corner to resize the box.',
  image:'An embedded picture saved inside the worksheet. Drag a corner to resize it while keeping its proportions.',
  plot:'Plot functions of x or pairs of X and Y vectors. Settings control series, labels, ranges and styles. Worksheet variables defined above are available here.',
  slider:'Define a numeric variable with an interactive slider. Set its range, step and optional unit, or animate a vector of values. Fields below update as it changes.',
  radio:'Define a variable by choosing an option. Settings accept one numeric expression per line and an optional unit. Fields below use the selected value.',
  section:'Group fields between two horizontal boundaries. Collapse the section to hide its contents. Moving a section moves its contents; deleting it deletes them too.'
};
export function tabProperties(r,element,details,tools,changed){
  const panel=details.querySelector(':scope > .region-settings');panel.classList.remove('properties-panel');panel.classList.add('tabbed-properties');
  const colors=document.createElement('div');colors.className='properties-panel';colors.append(...panel.childNodes);
  const settings=document.createElement('div');settings.className='element-settings';
  for(const tool of tools){const content=tool.querySelector(':scope > .region-settings');if(content){content.classList.remove('region-settings');content.classList.add('embedded-settings');settings.append(content);}}
  const help=document.createElement('p');help.className='element-help';help.textContent=fieldHelp[r.type];
  const tabs=document.createElement('div');tabs.className='properties-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',`${fieldNames[r.type]} properties`);panel.append(tabs);
  const entries=[['Settings',settings],['Colors',colors],['Help',help]];
  const buttons=[];
  function activate(index){entries.forEach(([,content],i)=>{content.hidden=i!==index;buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;});}
  entries.forEach(([name,content],index)=>{
    const button=document.createElement('button');button.type='button';button.textContent=name;button.setAttribute('role','tab');button.id=`tab-${r.id}-${index}`;content.id=`panel-${r.id}-${index}`;button.setAttribute('aria-controls',content.id);content.setAttribute('role','tabpanel');content.setAttribute('aria-labelledby',button.id);button.onclick=()=>activate(index);
    button.onkeydown=event=>{let next;if(event.key==='ArrowRight')next=(index+1)%3;else if(event.key==='ArrowLeft')next=(index+2)%3;else if(event.key==='Home')next=0;else if(event.key==='End')next=2;if(next!==undefined){event.preventDefault();activate(next);buttons[next].focus();}};
    buttons.push(button);tabs.append(button);panel.append(content);
  });activate(0);
}

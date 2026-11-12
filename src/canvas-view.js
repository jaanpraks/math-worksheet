import {A4,MAX_CANVAS_Y,viewSettings,anchors} from './canvas-geometry.js';
import {contains,screenY,hiddenBySection} from './sections.js';
import {setButtonIcon} from './icons.js';

export function mountCanvasView({canvas,viewport,getRegions,render,changed}){
  let settings=viewSettings(),contentWidth=1,contentHeight=1,extraHeight=0,signature='',items=[],buttons=[],activeId;
  const tools=document.createElement('nav');tools.id='canvas-tools';tools.setAttribute('aria-label','Canvas view and navigation');
  viewport.before(tools);
  const actions=document.createElement('div');actions.className='document-actions';actions.setAttribute('role','group');actions.setAttribute('aria-label','File and editing');
  for(const [id,icon,label,title] of [['load','load','Load JSON','Load worksheet JSON'],['save','save','Save JSON','Save worksheet JSON'],['undo','undo','Undo','Undo (Ctrl/Cmd+Z)'],['redo','redo','Redo','Redo (Ctrl/Cmd+Shift+Z)']]){
    const action=document.getElementById(id);setButtonIcon(action,icon);action.classList.add('toolbar-icon');action.setAttribute('aria-label',label);action.title=title;actions.append(action);
  }tools.append(actions);
  const button=(text,label,action)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.setAttribute('aria-label',label);b.onclick=action;tools.append(b);return b;};
  const contents=button('☰ Contents','Toggle contents',()=>{sidebar.hidden=!sidebar.hidden;contents.setAttribute('aria-expanded',String(!sidebar.hidden));});contents.setAttribute('aria-expanded','false');contents.setAttribute('aria-controls','canvas-contents');
  const previous=button('◀','Previous anchor',()=>stepAnchor(-1)),next=button('▶','Next anchor',()=>stepAnchor(1));
  button('↑ Screen','Previous screen',()=>screen(-1));button('↓ Screen','Next screen',()=>screen(1));
  button('−','Zoom out',()=>setZoom(settings.zoom/1.2));
  const zoom=document.createElement('input');zoom.type='number';zoom.min='25';zoom.max='400';zoom.step='5';zoom.setAttribute('aria-label','Canvas zoom percent');zoom.value='100';tools.append(zoom,document.createTextNode('%'));
  zoom.onchange=()=>{if(Number.isFinite(zoom.valueAsNumber))setZoom(zoom.valueAsNumber/100);else zoom.value=String(Math.round(settings.zoom*100));};
  button('+','Zoom in',()=>setZoom(settings.zoom*1.2));button('Fit width','Fit canvas width',()=>setZoom((viewport.clientWidth-24)/(A4[settings.printArea]?A4[settings.printArea].width/settings.printScale:contentWidth)));
  const label=document.createElement('label');label.textContent='Print area ';const area=document.createElement('select');area.setAttribute('aria-label','Print area');
  for(const [value,text] of [['off','Off'],['portrait','A4 portrait'],['landscape','A4 landscape']]){const option=document.createElement('option');option.value=value;option.textContent=text;area.append(option);}label.append(area);tools.append(label);
  area.onchange=()=>{settings.printArea=area.value;layout();changed();};
  const scaleLabel=document.createElement('label');scaleLabel.textContent='Print scale ';const scale=document.createElement('input');scale.type='number';scale.min='25';scale.max='200';scale.step='5';scale.setAttribute('aria-label','Print scale percent');scaleLabel.append(scale,document.createTextNode('%'));tools.append(scaleLabel);
  scale.onchange=()=>{if(Number.isFinite(scale.valueAsNumber)){settings.printScale=Math.max(.25,Math.min(2,scale.valueAsNumber/100));layout();changed();}else scale.value=String(Math.round(settings.printScale*100));};
  button('Print / PDF','Print worksheet',()=>window.print());
  const fullscreen=document.getElementById('fullscreen');fullscreen.classList.add('toolbar-icon');tools.append(fullscreen);
  const sidebar=document.createElement('aside');sidebar.id='canvas-contents';sidebar.hidden=true;sidebar.setAttribute('aria-label','Worksheet contents');
  const heading=document.createElement('div');heading.className='contents-heading';heading.textContent='Contents';const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close contents');close.onclick=()=>{sidebar.hidden=true;contents.setAttribute('aria-expanded','false');contents.focus();};heading.append(close);
  const list=document.createElement('nav');list.setAttribute('aria-label','Anchors');const empty=document.createElement('p');empty.textContent='Start an element label with # to add it here.';sidebar.append(heading,list,empty);viewport.append(sidebar);
  const guide=document.createElement('div');guide.className='print-guides';guide.setAttribute('aria-hidden','true');
  const printStyle=document.createElement('style');document.head.append(printStyle);
  function layout(width=contentWidth,height=contentHeight){
    contentWidth=width;contentHeight=height;
    viewport.style.setProperty('--canvas-top',`${viewport.getBoundingClientRect().top}px`);
    canvas.dataset.zoom=String(settings.zoom);canvas.style.zoom=String(settings.zoom);canvas.style.setProperty('--canvas-zoom',settings.zoom);
    const page=A4[settings.printArea];
    canvas.style.width=`${Math.max(viewport.clientWidth/settings.zoom,contentWidth,page?page.width/settings.printScale:0)}px`;
    canvas.style.height=`${Math.min(MAX_CANVAS_Y,Math.max(contentHeight+viewport.clientHeight/settings.zoom,extraHeight,viewport.clientHeight*3/settings.zoom))}px`;
    if(!guide.isConnected)canvas.prepend(guide);guide.hidden=!page;
    if(page){const {width:w,height:h}=page;guide.style.width=`${w/settings.printScale}px`;guide.style.backgroundImage=`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x=".5" y=".5" width="${w-1}" height="${h-1}" fill="none" stroke="#b8cbd3"/><rect x="57" y="57" width="${w-114}" height="${h-114}" fill="none" stroke="#c9d8df" stroke-dasharray="5 5"/></svg>`)}")`;guide.style.backgroundSize=`${w/settings.printScale}px ${h/settings.printScale}px`;}
    const printPage=page || A4.portrait,printHeight=printPage.height/settings.printScale;canvas.style.setProperty('--print-scale',settings.printScale);canvas.style.setProperty('--print-width',`${printPage.width/settings.printScale}px`);canvas.style.setProperty('--print-height',`${Math.max(printHeight,Math.ceil(Math.max(1,contentHeight-32)/printHeight)*printHeight)}px`);
    printStyle.textContent=`@page { size: A4 ${settings.printArea==='landscape'?'landscape':'portrait'}; margin: 0; }`;
    zoom.value=String(Math.round(settings.zoom*100));scale.value=String(Math.round(settings.printScale*100));area.value=settings.printArea;highlight();
  }
  function setZoom(value){const old=settings.zoom,y=viewport.scrollTop/old,x=viewport.scrollLeft/old;settings.zoom=Math.max(.25,Math.min(4,Math.round(value*100)/100));layout();viewport.scrollTo(x*settings.zoom,y*settings.zoom);changed();canvas.dispatchEvent(new CustomEvent('canvas-zoom'));}
  function screen(direction){const top=Math.max(0,viewport.scrollTop+direction*viewport.clientHeight);extraHeight=Math.max(extraHeight,(top+viewport.clientHeight*2)/settings.zoom);layout();viewport.scrollTo({top,behavior:'instant'});}
  function updateContents(){
    const nextItems=anchors(getRegions()),nextSignature=JSON.stringify(nextItems);
    if(signature!==nextSignature){signature=nextSignature;items=nextItems;list.replaceChildren();buttons=items.map(item=>{const b=document.createElement('button');b.type='button';b.textContent=item.label;b.dataset.anchorId=item.id;b.onclick=()=>go(item.id);list.append(b);return b;});empty.hidden=items.length>0;}
    previous.disabled=next.disabled=items.length===0;highlight();
  }
  function highlight(){
    const regions=getRegions(),top=(viewport.scrollTop+24)/settings.zoom;
    const current=items.filter(item=>{const region=regions.find(r=>r.id===item.id);return region && !hiddenBySection(regions,region) && screenY(regions,item.y)<=top;}).at(-1);activeId=current?.id;
    buttons.forEach(b=>{if(b.dataset.anchorId===activeId)b.setAttribute('aria-current','location');else b.removeAttribute('aria-current');});
  }
  function go(id){
    const regions=getRegions(),target=regions.find(r=>r.id===id);if(!target)return;
    let reveal=false;for(const section of regions.filter(r=>r.type==='section' && r.collapsed && contains(r,target))){section.collapsed=false;reveal=true;}
    if(reveal){render();changed();}
    const top=Math.max(0,screenY(regions,target.y)*settings.zoom-16);extraHeight=Math.max(extraHeight,(top+viewport.clientHeight*2)/settings.zoom);layout();
    viewport.scrollTo({top,left:Math.max(0,target.x*settings.zoom-24),behavior:'instant'});highlight();
    if(matchMedia('(max-width: 800px)').matches){sidebar.hidden=true;contents.setAttribute('aria-expanded','false');}
  }
  function stepAnchor(direction){updateContents();const index=items.findIndex(item=>item.id===activeId);const nextIndex=index<0?(direction>0?0:items.length-1):Math.max(0,Math.min(items.length-1,index+direction));if(items[nextIndex])go(items[nextIndex].id);}
  viewport.addEventListener('scroll',()=>{if(viewport.scrollTop+viewport.clientHeight*2>canvas.offsetHeight*settings.zoom){extraHeight=(viewport.scrollTop+viewport.clientHeight*4)/settings.zoom;layout();}highlight();},{passive:true});
  new ResizeObserver(()=>layout()).observe(viewport);
  document.addEventListener('keydown',event=>{
    if(event.target.closest?.('input,textarea,math-field,[contenteditable="true"],.region-settings'))return;
    if(event.altKey && !event.ctrlKey && !event.metaKey && ['PageDown','PageUp'].includes(event.key)){event.preventDefault();stepAnchor(event.key==='PageDown'?1:-1);}
    if(event.key==='Escape' && !sidebar.hidden){sidebar.hidden=true;contents.setAttribute('aria-expanded','false');}
  });
  return {layout,updateContents,get settings(){return {...settings};},setSettings(value){settings=viewSettings(value);extraHeight=0;layout();},get zoom(){return settings.zoom;}};
}

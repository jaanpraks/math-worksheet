import { MathfieldElement,convertAsciiMathToLatex } from 'mathlive';
import { resultLatex } from './editing.js';
import { parse,unit } from 'mathjs';
import { unitResult } from './units.js';
import { advanceControl } from './control-values.js';

function notation(label) {
  const field=new MathfieldElement();field.readOnly=true;field.tabIndex=-1;field.className='control-notation';field.setAttribute('aria-label',label);return field;
}
export function mountControl(r,body,head,remove,changed) {
  let playing=false,timer,data,disposed=false;
  function pause(commit=true){playing=false;clearTimeout(timer);paintPlayback();if(commit && !disposed)changed();}
  function paintPlayback(){if(!play)return;play.textContent=playing?'❚❚':'▶';play.setAttribute('aria-label',playing?'Pause animation':'Play animation');play.setAttribute('aria-pressed',String(playing));slider.disabled=playing;control.classList.toggle('playing',playing);}
  function tick(){
    if(!playing || disposed)return;
    if(document.hidden || !data || !advanceControl(r,data)){pause();return;}
    changed({animation:true});
    if(playing)timer=setTimeout(tick,1000/data.fps);
  }
  const title=notation('Variable value'),domain=notation('Variable range');
  const control=document.createElement('div');control.className='variable-input';
  body.append(title,control,domain);
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='⚙';summary.title='Variable settings';summary.setAttribute('aria-label','Variable settings');details.append(summary);head.insertBefore(details,remove);
  const settings=document.createElement('div');settings.className='region-settings control-settings';details.append(settings);
  const inputs={};
  const edit=(key,label,multiline=false)=>{
    const wrap=document.createElement('label');wrap.textContent=label;
    const input=document.createElement(multiline?'textarea':'input');input.value=r[key] ?? (key==='fps'?'10':'');input.setAttribute('aria-label',label);input.spellcheck=false;
    input.addEventListener('input',()=>{pause(false);r[key]=input.value;if(key==='options')r.choice='0';if(key==='sequence')r.frame='0';changed();});wrap.append(input);settings.append(wrap);inputs[key]=input;
  };
  edit('name','Variable');
  if(r.type==='slider'){edit('min','Minimum');edit('max','Maximum');edit('step','Step Δ');edit('value','Current value');edit('sequence','Values vector (optional)');edit('fps','Frames per second');
    const label=document.createElement('label'),loop=document.createElement('input');loop.type='checkbox';loop.checked=r.loop!==false;loop.setAttribute('aria-label','Loop animation');label.append(loop,document.createTextNode('Loop animation'));settings.append(label);
    loop.onchange=()=>{r.loop=loop.checked;changed();};
    const help=document.createElement('small');help.textContent='Play scans the range by Δ, or a vector defined above. Pause to move the slider. The track stays still during playback; all dependent figures update. Loading starts paused.';help.style.gridColumn='1 / -1';settings.append(help);
  }
  else edit('options','Options — one expression per line',true);
  edit('unit','Unit (optional)');
  let slider,play,choices=[],optionsKey='';
  if(r.type==='slider') {
    slider=document.createElement('input');slider.type='range';slider.setAttribute('aria-label','Variable slider');
    play=document.createElement('button');play.type='button';play.className='animation-play';play.disabled=true;control.append(slider,play);paintPlayback();
    play.onclick=()=>{if(playing){pause();return;}if(!data)return;playing=true;paintPlayback();timer=setTimeout(tick,1000/data.fps);};
    slider.addEventListener('input',()=>{pause(false);if(data?.values)r.frame=slider.value;else r.value=slider.value;changed();});
  }
  function update(result) {
    data=result.control;
    if(!data){pause(false);if(play)play.disabled=true;control.hidden=true;domain.hidden=true;title.value=convertAsciiMathToLatex(r.name || '?');return;}
    control.hidden=false;domain.hidden=false;
    const name=convertAsciiMathToLatex(r.name);
    const quantity=value=>resultLatex({text:String(value),latex:r.unit.trim()?unitResult(unit(value,r.unit.trim())):undefined});
    const optionMath=option=>r.unit.trim()?quantity(option.value):parse(option.expression).toTex();
    title.value=`${name}=${resultLatex(result)}`;
    if(slider) {
      play.disabled=false;
      Object.assign(slider,{min:String(data.min),max:String(data.max),step:String(data.step)});
      if(!playing)slider.value=String(data.values?data.index:data.numericValue);
      slider.setAttribute('aria-label',`${r.name} slider`);
      r.value=String(data.numericValue);if(document.activeElement!==inputs.value)inputs.value.value=r.value;
      for(const key of ['min','max','step','value'])inputs[key].disabled=!!data.values;
      if(data.values){r.frame=String(data.index);domain.value=`${name}=\\left(${parse(r.sequence).toTex()}\\right)_{k},\\quad k=${data.index+1},\\quad 1\\le k\\le ${data.values.length}`;}
      else domain.value=`${name}\\in[${quantity(data.min)},${quantity(data.max)}],\\quad\\Delta ${name}=${quantity(data.step)}`;
    }else {
      const key=JSON.stringify([data.options,r.name,r.unit]);
      if(key!==optionsKey){
        optionsKey=key;control.replaceChildren();choices=[];
        data.options.forEach((option,index)=>{
          const label=document.createElement('label'),radio=document.createElement('input'),math=notation('Option');
          radio.type='radio';radio.name=`choice-${r.id}`;radio.value=String(index);radio.setAttribute('aria-label',`${r.name} = ${option.expression}`);
          radio.addEventListener('change',()=>{if(radio.checked){r.choice=String(index);changed();}});
          math.value=optionMath(option);label.append(radio,math);control.append(label);choices.push(radio);
        });
      }
      choices.forEach((choice,index)=>choice.checked=index===data.choice);
      domain.value=`${name}\\in\\{${data.options.map(optionMath).join(',')}\\}`;
    }
  }
  const visibility=()=>{if(document.hidden && playing)pause();};document.addEventListener('visibilitychange',visibility);
  return {updateControl:update,editor:slider || summary,dispose:()=>{disposed=true;pause(false);document.removeEventListener('visibilitychange',visibility);}};
}

import {seriesStyle,markerShapes} from './plot-styles.js';
export function mountSeriesStyles(r,settings,changed) {
  const panel=document.createElement('div');panel.className='series-styles';settings.append(panel);let key='';
  return points=>{
    const sources=r.series.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,250);
    const next=JSON.stringify([sources,sources.map((_,i)=>points?.[i]?.length===1)]);if(next===key)return;key=next;panel.replaceChildren();
    sources.forEach((source,index)=>{
      const row=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=`Series ${index+1}`;row.title=source;row.append(legend);panel.append(row);
      const style=seriesStyle(r,index,points?.[index]?.length),controls={};
      const edit=(name,label,choices)=>{
        const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement(choices?'select':'input');input.setAttribute('aria-label',`Series ${index+1} ${label.toLowerCase()}`);
        if(choices)for(const [value,text] of Object.entries(choices)){const option=document.createElement('option');option.value=value;option.textContent=text;input.append(option);}
        else if(name==='color')input.type='color';else {input.type='number';input.min='2';input.max='24';input.step='1';}
        input.value=String(style[name]);controls[name]=input;
        input.addEventListener('input',()=>{
          const size=Number(controls.size.value);if(!Number.isFinite(size)||size<2||size>24)return;
          r.seriesStyles ??=[];while(r.seriesStyles.length<=index)r.seriesStyles.push(null);
          r.seriesStyles[index]={mode:controls.mode.value,marker:controls.marker.value,size,color:controls.color.value};changed();
        });wrap.append(input);row.append(wrap);
      };
      edit('mode','Style',{line:'Line',markers:'Markers',both:'Line + markers'});edit('marker','Marker',markerShapes);edit('size','Marker size');edit('color','Color');
    });
  };
}

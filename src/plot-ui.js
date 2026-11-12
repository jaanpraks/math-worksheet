import {canvasZoom} from './canvas-geometry.js';
import {drawPlot} from './plot.js';
import {seriesStyle,drawMarker} from './plot-styles.js';
import {mountSeriesStyles} from './series-style-ui.js';
import {plotArea,zoomPlot,equalizePlot,panPlot} from './plot-view.js';

export function mountPlot(r,body,head,remove,changed) {
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='⚙';summary.title='Plot settings';summary.setAttribute('aria-label','Plot settings');details.append(summary);head.insertBefore(details,remove);
  const settings=document.createElement('div');settings.className='region-settings plot-settings';details.append(settings);
  const edit=(key,label,multiline=false,fit=false)=>{
    const wrap=document.createElement('label');wrap.textContent=label;
    const input=document.createElement(multiline?'textarea':'input');input.value=r[key] || '';input.setAttribute('aria-label',label);input.spellcheck=false;
    input.addEventListener('input',()=>{r[key]=input.value;if(fit)delete r.plotView;changed();});wrap.append(input);settings.append(wrap);
  };
  edit('series','Plot series: function of x or X ; Y',true,true);
  const styleEditor=mountSeriesStyles(r,settings,changed);
  const domain=document.createElement('div');domain.className='plot-domain';settings.append(domain);
  for(const [key,label] of [['min','X minimum'],['max','X maximum']]){
    const wrap=document.createElement('label');wrap.textContent=label;const input=document.createElement('input');input.value=r[key];input.setAttribute('aria-label',label);
    input.addEventListener('input',()=>{r[key]=input.value;delete r.plotView;changed();});wrap.append(input);domain.append(wrap);
  }
  edit('title','Plot title');edit('xLabel','X-axis label');edit('yLabel','Y-axis label');
  let canvas;
  const check=(key,label)=>{
    const wrap=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=!!r[key];input.setAttribute('aria-label',label);wrap.append(input,document.createTextNode(label));settings.append(wrap);
    input.addEventListener('change',()=>{r[key]=input.checked;if(key==='equalScale' && r.plotView && r.equalScale)equalizePlot(r.plotView,plotArea(canvas.clientWidth,canvas.clientHeight,r));changed();});return input;
  };
  const equal=check('equalScale','Equal axis scales');check('showLegend','Legend on left');edit('legendLabels','Legend names — one per series',true);
  const fit=document.createElement('button');fit.textContent='Fit data';fit.type='button';fit.onclick=()=>{delete r.plotView;changed();};settings.append(fit);
  const help=document.createElement('small');help.textContent='Drag the graph to pan. Wheel: zoom both · Ctrl+wheel: Y only · Shift+wheel: X only. Axis-only zoom releases equal scales.';settings.append(help);
  const frame=document.createElement('div');frame.className='plot-frame';
  const legend=document.createElement('div');legend.className='plot-legend';legend.setAttribute('aria-label','Plot legend');
  const surface=document.createElement('div');surface.className='plot-surface';
  canvas=document.createElement('canvas');canvas.setAttribute('aria-label','2D plot');surface.append(canvas);frame.append(legend,surface);body.append(frame);
  let series,queued=false;
  function refreshLegend() {
    legend.hidden=!r.showLegend;legend.replaceChildren();
    if(!r.showLegend)return;
    const names=(r.legendLabels || '').split('\n'),sources=r.series.split('\n').map(s=>s.trim()).filter(Boolean);
    sources.forEach((source,index)=>{const line=document.createElement('div'),swatch=document.createElement('img'),glyph=document.createElement('canvas'),label=document.createElement('span');
      const style=seriesStyle(r,index,series?.[index]?.length);line.className='legend-entry';swatch.className='legend-swatch';glyph.width=28;glyph.height=18;swatch.alt='';swatch.dataset.mode=style.mode;swatch.dataset.marker=style.marker;
      const ctx=glyph.getContext('2d');ctx.strokeStyle=ctx.fillStyle=style.color;ctx.lineWidth=1.7;if(style.mode!=='markers'){ctx.beginPath();ctx.moveTo(1,9);ctx.lineTo(27,9);ctx.stroke();}if(style.mode!=='line')drawMarker(ctx,14,9,style.marker,Math.min(14,style.size));swatch.src=glyph.toDataURL();
      label.textContent=names[index]?.trim() || source;line.title=label.textContent;line.append(swatch,label);legend.append(line);
    });
  }
  const draw=()=>{if(series && canvas.getBoundingClientRect().width>0)drawPlot(canvas,series,r);};
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;if(canvas.isConnected)changed();});}};
  const observer=new ResizeObserver(()=>{
    if(!canvas.isConnected)return;
    const before=r.plotView && [r.plotView.plotWidth,r.plotView.plotHeight];
    try{draw();}catch{/* Worksheet evaluation displays draw errors. */}
    if(before && r.plotView && (before[0]!==r.plotView.plotWidth||before[1]!==r.plotView.plotHeight))queue();
  });observer.observe(surface);
  canvas.addEventListener('wheel',event=>{
    if(!r.plotView)return;
    event.preventDefault();event.stopPropagation();
    const delta=(event.deltaY || event.deltaX)*(event.deltaMode===1?16:event.deltaMode===2?canvas.clientHeight:1);
    const factor=Math.exp(Math.max(-2,Math.min(2,delta*.0015))),axes=event.ctrlKey?'y':event.shiftKey?'x':'both';
    if(axes!=='both'){r.equalScale=false;equal.checked=false;}
    const box=canvas.getBoundingClientRect(),zoom=canvasZoom(canvas);zoomPlot(r.plotView,plotArea(box.width/zoom,box.height/zoom,r),(event.clientX-box.left)/zoom,(event.clientY-box.top)/zoom,factor,axes);changed();
  },{passive:false});
  let drag;
  canvas.addEventListener('pointerdown',event=>{
    if(event.button!==0 || event.ctrlKey || event.metaKey || event.shiftKey || !r.plotView)return;
    event.preventDefault();event.stopPropagation();canvas.setPointerCapture(event.pointerId);
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.classList.add('panning');
  });
  canvas.addEventListener('pointermove',event=>{
    if(!drag || event.pointerId!==drag.id)return;
    panPlot(r.plotView,(event.clientX-drag.x)/canvasZoom(canvas),(event.clientY-drag.y)/canvasZoom(canvas));drag.x=event.clientX;drag.y=event.clientY;changed();
  });
  const endDrag=event=>{
    if(!drag || event.pointerId!==drag.id)return;
    drag=undefined;canvas.classList.remove('panning');if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
  };
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,endDrag);
  return {plot:canvas,updatePlot:result=>{
    const before=r.plotView && [r.plotView.plotWidth,r.plotView.plotHeight];
    series=result.series;styleEditor(series);refreshLegend();
    if(result.error){series=undefined;canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);return;}
    draw();
    if(before && (before[0]!==r.plotView.plotWidth || before[1]!==r.plotView.plotHeight))queue();
  },dispose:()=>observer.disconnect()};
}

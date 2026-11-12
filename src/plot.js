import {plotArea,fitPlot,equalizePlot,plotTicks} from './plot-view.js';
import {seriesStyle,drawMarker} from './plot-styles.js';
export function drawPlot(canvas,series,r={}) {
  const ctx=canvas.getContext('2d'),width=Math.max(1,canvas.clientWidth),height=Math.max(1,canvas.clientHeight),dpr=window.devicePixelRatio||1;
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
  const area=plotArea(width,height,r);
  if(!r.plotView)r.plotView=fitPlot(series,area,r.equalScale);
  const view=r.plotView;view.plotWidth=area.width;view.plotHeight=area.height;
  if(r.equalScale && view.xScale!==view.yScale)equalizePlot(view,area);
  const X=x=>area.left+(x-view.xMin)/view.xScale,Y=y=>area.top+area.height-(y-view.yMin)/view.yScale;
  canvas.dataset.view=JSON.stringify({...view,xMax:view.xMin+area.width*view.xScale,yMax:view.yMin+area.height*view.yScale,...area});
  const label=v=>Math.abs(v)>=1e5 || (v!==0 && Math.abs(v)<.001)?v.toExponential(1):Number(v.toPrecision(4)).toString();
  ctx.font='11px Segoe UI, sans-serif';ctx.lineWidth=1;
  for(const x of plotTicks(view.xMin,view.xScale,area.width)) {
    ctx.strokeStyle='#e2e8eb';ctx.beginPath();ctx.moveTo(X(x),area.top);ctx.lineTo(X(x),area.top+area.height);ctx.stroke();
    ctx.fillStyle='#58717d';ctx.textAlign='center';ctx.fillText(label(x),Math.max(25,Math.min(width-25,X(x))),area.top+area.height+18);
  }
  for(const y of plotTicks(view.yMin,view.yScale,area.height)) {
    ctx.strokeStyle='#e2e8eb';ctx.beginPath();ctx.moveTo(area.left,Y(y));ctx.lineTo(area.left+area.width,Y(y));ctx.stroke();
    ctx.fillStyle='#58717d';ctx.textAlign='right';ctx.fillText(label(y),area.left-7,Y(y)+4,area.left-10);
  }
  ctx.strokeStyle='#c8d7dd';ctx.strokeRect(area.left,area.top,area.width,area.height);
  ctx.save();ctx.beginPath();ctx.rect(area.left,area.top,area.width,area.height);ctx.clip();
  series.forEach((points,index)=>{
    const style=seriesStyle(r,index,points.length);
    ctx.strokeStyle=ctx.fillStyle=style.color;ctx.lineWidth=1.7;ctx.beginPath();let previous=false;
    for(const [x,y] of points){
      if(!Number.isFinite(x)||!Number.isFinite(y)){previous=false;continue;}
      const px=X(x),py=Y(y);
      if(!Number.isFinite(px)||!Number.isFinite(py)){previous=false;continue;}
      if(style.mode!=='markers'){if(previous)ctx.lineTo(px,py);else ctx.moveTo(px,py);}previous=true;
    }
    if(style.mode!=='markers')ctx.stroke();
    if(style.mode!=='line')for(const [x,y] of points){const px=X(x),py=Y(y);if(Number.isFinite(px)&&Number.isFinite(py)&&px>=area.left-style.size&&px<=area.left+area.width+style.size&&py>=area.top-style.size&&py<=area.top+area.height+style.size)drawMarker(ctx,px,py,style.marker,style.size);}
  });ctx.restore();
  ctx.fillStyle='#203d4b';ctx.textAlign='center';ctx.font='600 15px Segoe UI, sans-serif';
  if(r.title)ctx.fillText(r.title,area.left+area.width/2,21,area.width);
  ctx.font='12px Segoe UI, sans-serif';
  if(r.xLabel)ctx.fillText(r.xLabel,area.left+area.width/2,height-7,area.width);
  if(r.yLabel){ctx.save();ctx.translate(13,area.top+area.height/2);ctx.rotate(-Math.PI/2);ctx.fillText(r.yLabel,0,0,area.height);ctx.restore();}
  return area;
}

export const plotColors=['#157d8c','#df7848','#8061ba','#4b8b4a','#b45d86','#8a713b'];
export const markerShapes={circle:'●',square:'■',triangle:'▲',diamond:'◆',plus:'+',cross:'×'};
export function seriesStyle(region,index,count=2) {
  return {mode:count===1?'markers':'line',marker:'circle',size:6,color:plotColors[index%plotColors.length],...region.seriesStyles?.[index]};
}
export function drawMarker(ctx,x,y,shape,size) {
  const h=size/2;ctx.beginPath();
  if(shape==='circle')ctx.arc(x,y,h,0,2*Math.PI);
  else if(shape==='square')ctx.rect(x-h,y-h,size,size);
  else if(shape==='triangle'){ctx.moveTo(x,y-h);ctx.lineTo(x+h,y+h);ctx.lineTo(x-h,y+h);ctx.closePath();}
  else if(shape==='diamond'){ctx.moveTo(x,y-h);ctx.lineTo(x+h,y);ctx.lineTo(x,y+h);ctx.lineTo(x-h,y);ctx.closePath();}
  else if(shape==='plus'){ctx.moveTo(x-h,y);ctx.lineTo(x+h,y);ctx.moveTo(x,y-h);ctx.lineTo(x,y+h);}
  else {ctx.moveTo(x-h,y-h);ctx.lineTo(x+h,y+h);ctx.moveTo(x-h,y+h);ctx.lineTo(x+h,y-h);}
  if(shape==='plus'||shape==='cross')ctx.stroke();else ctx.fill();
}

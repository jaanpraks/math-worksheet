export function plotArea(width,height,r={}) {
  const left=r.yLabel?68:54,top=r.title?36:14,bottom=r.xLabel?52:32;
  return {left,top,width:Math.max(1,width-left-16),height:Math.max(1,height-top-bottom)};
}
export function fitPlot(series,area,equal=false) {
  let xMin=Infinity,xMax=-Infinity,yMin=Infinity,yMax=-Infinity;
  for(const points of series)for(const [x,y] of points)if(Number.isFinite(x)&&Number.isFinite(y)){
    xMin=Math.min(xMin,x);xMax=Math.max(xMax,x);yMin=Math.min(yMin,y);yMax=Math.max(yMax,y);
  }
  if(!Number.isFinite(xMin))throw Error('No finite plot values.');
  if(xMin===xMax){const pad=Math.abs(xMin)*.1||1;xMin-=pad;xMax+=pad;}
  if(yMin===yMax){const pad=Math.abs(yMin)*.1||1;yMin-=pad;yMax+=pad;}
  const pad=(yMax-yMin)*.05;yMin-=pad;yMax+=pad;
  const view={xMin,yMin,xScale:(xMax-xMin)/area.width,yScale:(yMax-yMin)/area.height,plotWidth:area.width,plotHeight:area.height};
  if(equal)equalizePlot(view,area);
  return view;
}
export function equalizePlot(view,area) {
  const cx=view.xMin+area.width*view.xScale/2,cy=view.yMin+area.height*view.yScale/2,scale=Math.max(view.xScale,view.yScale);
  view.xScale=view.yScale=scale;view.xMin=cx-area.width*scale/2;view.yMin=cy-area.height*scale/2;
}
export function panPlot(view,dx,dy) {
  view.xMin-=dx*view.xScale;
  view.yMin+=dy*view.yScale;
}
export function zoomPlot(view,area,x,y,factor,axes='both') {
  const px=Math.max(0,Math.min(area.width,x-area.left)),py=Math.max(0,Math.min(area.height,area.top+area.height-y));
  if(axes!=='y') {
    const anchor=view.xMin+px*view.xScale,scale=Math.max(1e-15,Math.min(1e18,view.xScale*factor));
    view.xScale=scale;view.xMin=anchor-px*scale;
  }
  if(axes!=='x') {
    const anchor=view.yMin+py*view.yScale,scale=Math.max(1e-15,Math.min(1e18,view.yScale*factor));
    view.yScale=scale;view.yMin=anchor-py*scale;
  }
}
export function plotTicks(min,scale,pixels) {
  const rough=scale*75,power=10**Math.floor(Math.log10(rough)),fraction=rough/power;
  const step=(fraction<=1?1:fraction<=2?2:fraction<=5?5:10)*power;
  if(!Number.isFinite(step)||step<=0)return [];
  const first=Math.ceil(min/step),count=Math.min(400,Math.ceil(pixels*scale/step)+1),ticks=[];
  for(let i=0;i<count;i++){const value=(first+i)*step;if(value<=min+pixels*scale+step*1e-7)ticks.push(Math.abs(value)<step*1e-8?0:value);}
  return ticks;
}

export const MAX_CANVAS_Y=1_000_000;
export const canvasZoom=element=>Number((element.closest?.('#canvas') || element).dataset.zoom) || 1;
export function canvasPoint(canvas,event){const box=canvas.getBoundingClientRect(),zoom=canvasZoom(canvas);return {x:Math.max(0,(event.clientX-box.left)/zoom),y:Math.max(0,(event.clientY-box.top)/zoom)};}
export const A4={portrait:{width:794,height:1123},landscape:{width:1123,height:794}};
export function viewSettings(value={}){
  if(!value || typeof value!=='object' || Array.isArray(value))throw Error('Invalid canvas settings.');
  const printArea=value.printArea ?? 'off',zoom=value.zoom ?? 1,printScale=value.printScale ?? 1;
  if(!['off','portrait','landscape'].includes(printArea) || !Number.isFinite(zoom) || zoom<.25 || zoom>4 || !Number.isFinite(printScale) || printScale<.25 || printScale>2)throw Error('Invalid canvas settings.');
  return {printArea,zoom,printScale};
}
export const anchors=regions=>regions.filter(r=>r.hiddenLabel?.trim().startsWith('#') && r.hiddenLabel.trim().slice(1).trim()).map((r,index)=>({id:r.id,label:r.hiddenLabel.trim().slice(1).trim(),x:r.x,y:r.y,index})).sort((a,b)=>a.y-b.y || a.x-b.x || a.index-b.index);

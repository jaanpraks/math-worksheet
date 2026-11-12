import {MAX_CANVAS_Y} from './canvas-geometry.js';
import { ordered } from './engine.js';
export const ROW_HEIGHT=38;
export function insertRowAfter(regions,id,height=ROW_HEIGHT) {
  const order=ordered(regions),index=order.findIndex(r=>r.id===id);
  if(index<0)return;
  const later=order.slice(index+1);
  if(later.some(r=>r.y+height>MAX_CANVAS_Y))throw Error('No room to insert another row at the edge of the worksheet.');
  for(const r of later)r.y+=height;
}
export function removeRowAfter(regions,id,height=ROW_HEIGHT) {
  const order=ordered(regions),index=order.findIndex(r=>r.id===id);
  if(index<0)return 0;
  const later=order.slice(index+1);
  const distance=Math.min(height,...later.map(r=>r.y));
  for(const r of later)r.y-=distance;
  return distance;
}
export function removeCanvasRow(regions,point,height=ROW_HEIGHT) {
  const later=regions.filter(r=>r.y>=point.y);
  const distance=Math.min(height,point.y,...later.map(r=>r.y));
  for(const r of later)r.y-=distance;
  return {...point,y:point.y-distance};
}
export function moveGroup(items,dx,dy) {
  dx=Math.max(-Math.min(...items.map(item=>item.x)),Math.min(dx,20000-Math.max(...items.map(item=>item.x))));
  dy=Math.max(-Math.min(...items.map(item=>item.y)),Math.min(dy,MAX_CANVAS_Y-Math.max(...items.map(item=>item.y))));
  return items.map(item=>({...item,x:item.x+dx,y:item.y+dy}));
}

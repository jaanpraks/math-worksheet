import {MAX_CANVAS_Y} from './canvas-geometry.js';
export const SECTION_HEADER=32;
export const sections=regions=>regions.filter(r=>r.type==='section').sort((a,b)=>a.y-b.y);
export const contains=(section,r)=>r.id!==section.id && r.y>=section.y+SECTION_HEADER && r.y<section.y+section.height;
export const hiddenBySection=(regions,r)=>sections(regions).some(s=>s.collapsed && contains(s,r));
export function screenY(regions,y) {
  return y-sections(regions).filter(s=>s.collapsed && y>=s.y+s.height).reduce((sum,s)=>sum+s.height-SECTION_HEADER,0);
}
export function sheetY(regions,y) {
  for(const s of sections(regions))if(s.collapsed && y>=s.y+SECTION_HEADER)y+=s.height-SECTION_HEADER;
  return y;
}
export function sectionGroup(regions,ids) {
  const result=new Set(ids);
  for(const s of sections(regions))if(ids.has(s.id))for(const r of regions)if(contains(s,r))result.add(r.id);
  return result;
}
export function validateSections(regions) {
  const list=sections(regions);
  for(let i=0;i<list.length;i++){
    if(list[i].height<100 || list[i].y+list[i].height>MAX_CANVAS_Y)throw Error('Section is outside the sheet.');
    if(i && list[i].y<list[i-1].y+list[i-1].height)throw Error('Horizontal sections cannot overlap.');
  }
}
export function stretchSection(regions,y,delta) {
  for(const s of sections(regions))if(y>=s.y+SECTION_HEADER && y<s.y+s.height){
    if(s.y+s.height+delta>MAX_CANVAS_Y)throw Error('No room to extend the section.');
    s.height=Math.max(100,s.height+delta);
  }
}

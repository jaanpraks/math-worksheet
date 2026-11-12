const paths={
  undo:['M9 4 4 9l5 5','M4 9h9a7 7 0 0 1 0 14'],
  redo:['m15 4 5 5-5 5','M20 9h-9a7 7 0 0 0 0 14'],
  save:['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l4 4v12a2 2 0 0 1-2 2Z','M7 3v6h10V3','M7 21v-8h10v8'],
  load:['M3 8V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v2','M3 10h19l-3 10H2Z'],
  expand:['M8 3H3v5','M16 3h5v5','M3 16v5h5','M21 16v5h-5'],
  collapse:['M3 8h5V3','M21 8h-5V3','M8 21v-5H3','M16 21v-5h5']
};
export function setButtonIcon(button,name){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','18');svg.setAttribute('height','18');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');
  for(const d of paths[name]){const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);}button.replaceChildren(svg);
}

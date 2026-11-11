export function squareMatrices(latex) {
  return latex.replace(/\\(begin|end)\{(?:matrix|pmatrix|Bmatrix|smallmatrix)(?:\*)?\}/g,(_,command)=>`\\${command}{bmatrix}`);
}
export function matrixTemplate(rows,columns) {
  return `\\begin{bmatrix}${Array(rows).fill(Array(columns).fill('#?').join(' & ')).join('\\\\')}\\end{bmatrix}`;
}
export function configureMatrixMenu(field) {
  const removed=new Set(['variant','color','background-color','decoration','accent','insert-integral','insert-derivative','insert-nth-derivative','insert-argument','insert-conjugate']);
  const patch=items=>items.filter(item=>!removed.has(item.id)).map(item=>{
    const dimensions=item.id?.match(/^insert-matrix-(\d+)x(\d+)$/);
    if(dimensions)return {...item,onMenuSelect:()=>field.insert(matrixTemplate(Number(dimensions[1]),Number(dimensions[2])),{selectionMode:'placeholder',focus:true})};
    const templates={
      'insert-sum':'\\sum_{#?=#?}^{#?}\\left(#?\\right)',
      'insert-product':'\\prod_{#?=#?}^{#?}\\left(#?\\right)'
    };
    if(templates[item.id])return {...item,onMenuSelect:()=>field.insert(templates[item.id],{selectionMode:'placeholder',focus:true})};
    if(Array.isArray(item.submenu))return {...item,submenu:patch(item.submenu)};
    return item;
  }).filter((item,index,items)=>item.type!=='divider' || (index>0 && index<items.length-1 && items[index-1].type!=='divider'));
  field.menuItems=patch(field.menuItems);
}

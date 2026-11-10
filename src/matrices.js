export function squareMatrices(latex) {
  return latex.replace(/\\(begin|end)\{(?:matrix|pmatrix|Bmatrix|smallmatrix)(?:\*)?\}/g,(_,command)=>`\\${command}{bmatrix}`);
}
export function matrixTemplate(rows,columns) {
  return `\\begin{bmatrix}${Array(rows).fill(Array(columns).fill('#?').join(' & ')).join('\\\\')}\\end{bmatrix}`;
}
export function configureMatrixMenu(field) {
  const patch=items=>items.map(item=>{
    const dimensions=item.id?.match(/^insert-matrix-(\d+)x(\d+)$/);
    if(dimensions)return {...item,onMenuSelect:()=>field.insert(matrixTemplate(Number(dimensions[1]),Number(dimensions[2])),{selectionMode:'placeholder',focus:true})};
    if(Array.isArray(item.submenu))return {...item,submenu:patch(item.submenu)};
    return item;
  });
  field.menuItems=patch(field.menuItems);
}

export const greekLetters=[
  ['alpha','α'],['beta','β'],['gamma','γ'],['delta','δ'],['epsilon','ϵ'],['zeta','ζ'],
  ['eta','η'],['theta','θ'],['iota','ι'],['kappa','κ'],['lambda','λ'],['mu','μ'],
  ['nu','ν'],['xi','ξ'],['pi','π'],['rho','ρ'],['sigma','σ'],['tau','τ'],
  ['upsilon','υ'],['phi','ϕ'],['chi','χ'],['psi','ψ'],['omega','ω'],
  ['Gamma','Γ'],['Delta','Δ'],['Theta','Θ'],['Lambda','Λ'],['Xi','Ξ'],
  ['Pi','Π'],['Sigma','Σ'],['Upsilon','Υ'],['Phi','Φ'],['Psi','Ψ'],['Omega','Ω']
];

export function mountGreekMenu({canInsert,insert}){
  const rail=document.querySelector('#insertion-tools'),topics=rail.querySelector('.insertion-topics');
  const panel=document.createElement('section');panel.id='greek-palette';panel.hidden=true;panel.setAttribute('aria-label','Greek letters');
  const heading=document.createElement('div');heading.className='elements-heading';heading.textContent='Greek letters';
  const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Close Greek letters');heading.append(close);
  const grid=document.createElement('div');grid.className='greek-grid';
  const hint=document.createElement('p');
  for(const [name,symbol] of greekLetters){const button=document.createElement('button');button.type='button';button.textContent=symbol;button.title=`${name} (${symbol})`;button.setAttribute('aria-label',name);button.onclick=()=>{insert(name,symbol);update();};grid.append(button);}
  const toggle=document.createElement('button');toggle.id='greek-toggle';toggle.type='button';toggle.textContent='Greek';toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-expanded','false');
  function update(){const enabled=canInsert();for(const button of grid.children)button.disabled=!enabled;hint.textContent=enabled?'Insert at the cursor in the active editor.':'Select an equation or text note first.';}
  function setOpen(open){if(open)rail.dispatchEvent(new CustomEvent('insertion-topic',{detail:'greek'}));panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));update();}
  toggle.onclick=()=>setOpen(panel.hidden);close.onclick=()=>setOpen(false);
  panel.append(heading,grid,hint);rail.insertBefore(panel,topics);topics.append(toggle);
  // Pointer interaction must preserve the editor's caret and selected range.
  for(const host of [toggle,panel])host.addEventListener('pointerdown',event=>{if(event.target.closest('button'))event.preventDefault();});
  rail.addEventListener('insertion-topic',event=>{if(event.detail!=='greek')setOpen(false);});
  document.addEventListener('focusin',update);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !panel.hidden && rail.contains(event.target)){event.preventDefault();setOpen(false);}});
  update();
}

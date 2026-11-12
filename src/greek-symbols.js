const names='alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi pi rho sigma tau upsilon phi chi psi omega Gamma Delta Theta Lambda Xi Pi Sigma Upsilon Phi Psi Omega'.split(' ');
export const greekNames=new Set(names);
export function greekSymbol(name){
  const match=name.match(/^([A-Za-z]+)(?:_([A-Za-z0-9]+))?$/);
  if(!match || !greekNames.has(match[1]))return undefined;
  return `\\${match[1]}${match[2]?`_{${match[2]}}`:''}`;
}
// Commit only whole identifiers. Keeping a word at the live end of the input
// literal lets the user continue theta to thetaRate without prefix expansion.
export function greekIdentifiers(latex,complete=false){
  return latex.replace(/\\(?:begin|end|text|operatorname|mathrm|htmlData)\{[^{}]*\}|\\mathit\{([A-Za-z]+)\}|\\[A-Za-z]+|([A-Za-z][A-Za-z0-9]*)/g,(token,styled,plain,offset)=>{
    const name=styled || plain;if(!greekNames.has(name))return token;
    const next=latex[offset+token.length];if(!complete && !/[=([{]/.test(next || ''))return token;
    return `\\${name} `;
  });
}

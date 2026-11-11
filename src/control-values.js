import { unit } from 'mathjs';
import { evaluate } from './math-runtime.js';

function number(expression,scope,label) {
  if(!expression.trim())throw Error(`${label} is required.`);
  const value=evaluate(expression,new Map(scope));
  if(typeof value!=='number' || !Number.isFinite(value))throw Error(`${label} must be a finite number.`);
  return value;
}
export function evaluateControl(r,scope) {
  if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(r.name))throw Error('Use a variable name such as a, mass or theta.');
  let numericValue,details;
  if(r.type==='slider') {
    const fps=number(r.fps ?? '10',scope,'Frames per second');
    if(fps<1 || fps>30)throw Error('Frames per second must be between 1 and 30.');
    if(r.sequence?.trim()) {
      let values=evaluate(r.sequence,new Map(scope));values=values?.toArray?values.toArray():values;
      if(Array.isArray(values) && values.length===1 && Array.isArray(values[0]))values=values[0];
      else if(Array.isArray(values) && values.every(row=>Array.isArray(row)&&row.length===1))values=values.map(row=>row[0]);
      if(!Array.isArray(values) || values.length<2 || values.length>5000 || !values.every(Number.isFinite))throw Error('Values vector must contain 2–5000 finite numbers.');
      const raw=Number(r.frame ?? '0');if(!Number.isInteger(raw))throw Error('Vector position must be an integer.');
      const index=Math.max(0,Math.min(values.length-1,raw));numericValue=values[index];
      details={min:0,max:values.length-1,step:1,index,last:values.length-1,values,fps};
    }else {
    const min=number(r.min,scope,'Minimum'),max=number(r.max,scope,'Maximum'),step=number(r.step,scope,'Step');
    if(min>=max)throw Error('Minimum must be less than maximum.');
    if(step<=0 || step>max-min)throw Error('Step must be positive and no larger than the range.');
    if(!Number.isFinite((max-min)/step) || (max-min)/step>1e12)throw Error('The step is too small for this range.');
    const raw=number(r.value,scope,'Value'),last=Math.floor((max-min)/step+1e-10);
    const index=Math.max(0,Math.min(last,Math.round((raw-min)/step)));
    numericValue=Number((min+index*step).toPrecision(14));
    details={min,max,step,index,last,fps};
    }
  }else {
    const expressions=r.options.split('\n').map(s=>s.trim()).filter(Boolean);
    if(!expressions.length || expressions.length>30)throw Error('Provide 1–30 options, one numeric expression per line.');
    const options=expressions.map(expression=>({expression,value:number(expression,scope,'Option')}));
    const choice=Number(r.choice);
    if(!Number.isInteger(choice) || choice<0 || choice>=options.length)throw Error('Select an available option.');
    numericValue=options[choice].value;details={options,choice};
  }
  return {value:r.unit.trim()?unit(numericValue,r.unit.trim()):numericValue,control:{...details,numericValue,name:r.name}};
}
export function advanceControl(r,data) {
  if(data.index===data.last && r.loop===false)return false;
  const index=data.index===data.last?0:data.index+1;
  if(data.values){r.frame=String(index);r.value=String(data.values[index]);}
  else r.value=String(Number((data.min+index*data.step).toPrecision(14)));
  return true;
}

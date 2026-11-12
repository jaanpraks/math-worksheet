import { format } from 'mathjs';
import { evaluate } from './math-runtime.js';
import { requireAcceptedUnits, unitResult } from './units.js';
import { evaluateControl } from './control-values.js';
import { evaluationSource } from './equations.js';
import {statements} from './groups.js';

// MathLive's ASCII export is deliberately adapted only for elementary algebra.
export function normalize(source) {
  return source.replace(/:=/g, '=').replace(/π/g, 'pi').replace(/\\pi\b/g, 'pi')
    .replace(/\b([A-Za-z]+)_\((\w+)\)/g, '$1_$2');
}
export function ordered(regions) {
  return regions.map((r, i) => ({ r, i })).sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x || a.i - b.i).map(({ r }) => r);
}
export function worksheet(regions) {
  const scope = new Map();
  const results = new Map();
  for (const region of ordered(regions)) {
    // A failed region must not partially change the following scope.
    const local = new Map(scope);
    try {
      if (region.type === 'math') {
        if(region.conversionError && !region.displayOnly)throw Error(region.conversionError);
        if (region.displayOnly || !region.source.trim()) { results.set(region.id, { text: '' }); continue; }
        // A trailing equals sign asks for the value; interior '=' still assigns.
        let value;
        for(const row of statements(region.source)){
          const source=region.displayMode==='source'?row.trim():evaluationSource(row);if(!source || source.startsWith('#'))continue;
          if (region.unitMode === 'explicit' && region.displayMode!=='source') requireAcceptedUnits(normalize(source), local);
          value=evaluate(region.displayMode==='source'?source:normalize(source),local);
          if(value?.isResultSet && value.entries.length===1)value=value.entries[0];
        }
        for (const [key, val] of local) scope.set(key, val);
        const shape=value?.isMatrix?value.size():Array.isArray(value)?arrayShape(value):undefined;
        results.set(region.id, { text: value===undefined?'':format(value, { precision: 9 }), latex: unitResult(value),collection:shape?{shape,count:shape.reduce((a,b)=>a*b,1)}:undefined });
      } else if(region.type==='slider' || region.type==='radio') {
        const {value,control}=evaluateControl(region,local);
        scope.set(region.name,value);
        results.set(region.id,{text:format(value,{precision:9}),latex:unitResult(value),control});
      } else if (region.type === 'plot') {
        results.set(region.id, { series: plotSeries(region, local) });
      }
    } catch (error) { results.set(region.id, { error: error.message }); }
  }
  return results;
}
function arrayShape(value) {return Array.isArray(value)?[value.length,...(value.length?arrayShape(value[0]):[])]:[];}
function vector(value) {
  let result = value?.toArray ? value.toArray() : value;
  if(Array.isArray(result) && result.length===1 && Array.isArray(result[0]))result=result[0];
  else if(Array.isArray(result) && result.every(row=>Array.isArray(row)&&row.length===1))result=result.map(row=>row[0]);
  if (!Array.isArray(result) || result.length < 1 || result.length > 5000 || !result.every(Number.isFinite)) throw Error('Use a flat numeric vector with 1–5000 values.');
  return result;
}
export function plotSeries(region, scope) {
  return region.series.split('\n').map(s => s.trim()).filter(Boolean).map(line => {
    const parts=splitPlotSeries(line);
    if (parts.length>1) {
      if (parts.length !== 2) throw Error('Vector series: X expression ; Y expression');
      const x = vector(evaluate(parts[0], new Map(scope)));
      const y = vector(evaluate(parts[1], new Map(scope)));
      if (x.length !== y.length) throw Error('X and Y vectors must have equal length.');
      return x.map((v, i) => [v, y[i]]);
    }
    const min = region.plotView?region.plotView.xMin:Number(region.min), max = region.plotView?region.plotView.xMin+region.plotView.plotWidth*region.plotView.xScale:Number(region.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) throw Error('X minimum must be less than maximum.');
    const samples=region.plotView?Math.max(241,Math.min(2001,Math.ceil(region.plotView.plotWidth*1.5))):241;
    return Array.from({ length: samples }, (_, i) => {
      const x = min + (max - min) * i / (samples-1);
      const y = evaluate(line, new Map([...scope, ['x', x]]));
      return [x, typeof y === 'number' && Number.isFinite(y) ? y : NaN];
    });
  });
}
export function splitPlotSeries(line) {
  const parts=[];let depth=0,start=0,quote='';
  for(let i=0;i<line.length;i++){
    const c=line[i];
    if(quote){if(c==='\\')i++;else if(c===quote)quote='';continue;}
    if(c==='"' || (c==="'" && !/[\w)\]}]/.test(line[i-1] || ''))){quote=c;continue;}
    if('([{'.includes(c))depth++;
    else if(')]}'.includes(c))depth--;
    else if(c===';' && depth===0){parts.push(line.slice(start,i));start=i+1;}
  }
  parts.push(line.slice(start));return parts;
}

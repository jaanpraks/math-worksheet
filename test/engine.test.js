import { test } from 'node:test';
import assert from 'node:assert/strict';
import { worksheet, plotSeries, normalize } from '../src/engine.js';
import { starter, serialize, deserialize } from '../src/model.js';
const math = (id, source, y, x=0) => ({ id, type:'math', source, x, y });
test('geometry controls shared scope, including left-to-right ties', () => {
  const regions = [math('b','a*3',20),math('a','a=4',10),math('c','a=5',10,100)];
  assert.equal(worksheet(regions).get('b').text,'15');
  regions[2].y=30;
  assert.equal(worksheet(regions).get('b').text,'12');
});
test('recalculation clears deleted definitions and reports local errors', () => {
  assert.equal(worksheet([math('a','a=2',0), math('b','a+1',1)]).get('b').text,'3');
  assert.match(worksheet([math('b','a+1',1)]).get('b').error,/Undefined symbol/);
  assert.equal(worksheet([math('a','a=2',0),math('bad','a=8; missing',1),math('b','a',2)]).get('b').text,'2');
});
test('starter orbital results and JSON round trip', () => {
  const regions = starter(); const loaded=deserialize(serialize(regions));
  assert.deepEqual(loaded,regions);
  const results=worksheet(loaded); const mathRegions=loaded.filter(r=>r.type==='math');
  assert.ok(Math.abs(Number(results.get(mathRegions[2].id).text)-7672.59865)<0.01);
  assert.ok(Math.abs(Number(results.get(mathRegions[3].id).text)-5544.8551)<0.1);
});
test('function and vector plots use supplied scope', () => {
  const scope=new Map([['a',2]]);
  const series=plotSeries({series:'a*x\n[1,2,3];[4,5,6]',min:'0',max:'3'},scope);
  assert.deepEqual(series[0].at(-1),[3,6]); assert.deepEqual(series[1][1],[2,5]);
  assert.ok(!scope.has('x'));
  assert.throws(()=>plotSeries({series:'[1,2];[3,4,5]'},scope),/equal length/);
});
test('invalid loads are rejected before replacing state', () => {
  const doc=JSON.parse(serialize(starter())); doc.regions[0].x=-1;
  assert.throws(()=>deserialize(JSON.stringify(doc)),/geometry/);
  assert.throws(()=>deserialize('{"version":2,"regions":[]}'),/version 1/);
  const image={...starter()[0],type:'image',src:'javascript:alert(1)',alt:'bad'};
  assert.throws(()=>deserialize(serialize([image])),/embedded/);
});
test('elementary ASCII normalization',()=>assert.equal(normalize('a:=π'), 'a=pi'));

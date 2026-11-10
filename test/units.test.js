import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unitSource, unitToken, unitResult, requireAcceptedUnits } from '../src/units.js';
import { worksheet } from '../src/engine.js';
import { region, serialize, deserialize } from '../src/model.js';
import { unit } from 'mathjs';

test('accepted units retain their semantics in equations and JSON', () => {
  const latex=`5\\cdot${unitToken('kg')}`;
  const source=unitSource(latex);
  assert.match(source,/unit\("kg"\)/);
  const r={...region('math'),latex,source,unitMode:'explicit'};
  const loaded=deserialize(serialize([r]));
  assert.deepEqual(loaded,[r]);
  assert.match(worksheet(loaded).get(r.id).text,/5 kg/);
  assert.match(worksheet(loaded).get(r.id).latex,/textcolor/);
});
test('unaccepted units need Tab, but names can still be variables', () => {
  assert.throws(()=>requireAcceptedUnits('5kg',new Map()),/Press Tab/);
  assert.doesNotThrow(()=>requireAcceptedUnits('5*kg',new Map([['kg',3]])));
  assert.doesNotThrow(()=>requireAcceptedUnits('m=7',new Map()));
  assert.doesNotThrow(()=>requireAcceptedUnits('f(m)=2*m',new Map()));
});
test('accepted unit tokens coexist with same-named variables', () => {
  const a={...region('math',0,0),source:'m=7',unitMode:'explicit'};
  const b={...region('math',0,100),latex:`m\\cdot${unitToken('m')}`,unitMode:'explicit'};
  b.source=unitSource(b.latex);
  assert.match(worksheet([a,b]).get(b.id).text,/7 m/);
});
test('unit arithmetic supports products, quotients, powers and dimension errors', () => {
  const a={...region('math',0,0),source:'mass=5*unit("kg")',unitMode:'explicit'};
  const b={...region('math',0,100),source:'acc=2*unit("m")/unit("s")^2',unitMode:'explicit'};
  const c={...region('math',0,200),source:'mass*acc',unitMode:'explicit'};
  const result=worksheet([a,b,c]).get(c.id);
  assert.ok(!result.error,result.error); assert.match(result.latex,/textcolor/);
  assert.match(unitResult(unit('5 kg m / s^2')),/\\cdot/);
  const invalid={...region('math'),source:'unit("kg")+unit("m")',unitMode:'explicit'};
  assert.ok(worksheet([invalid]).get(invalid.id).error);
});

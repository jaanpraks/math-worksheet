import {test} from 'node:test';
import assert from 'node:assert/strict';
import {greekIdentifiers,greekNames} from '../src/greek-symbols.js';
import {sourceToLatex} from '../src/expressions.js';
import {unitSource} from '../src/units.js';
test('Greek names display and round trip with their original Math.js names',()=>{
  for(const name of greekNames){const latex=sourceToLatex(`${name}=3`);assert.ok(latex.includes(`\\${name}`),`${name}: ${latex}`);assert.equal(unitSource(latex),`${name}=3`);assert.equal(unitSource(greekIdentifiers(`${name}=3`)),`${name}=3`);}
  assert.equal(unitSource(sourceToLatex('theta_1=2')),'theta_1=2');
});
test('Greek names wait for a commit boundary and never expand identifier prefixes or text',()=>{
  for(const name of ['theta','thetaRate=3','alphaValue=4','GammaRay=2','sinc(x)'])assert.equal(greekIdentifiers(name),name);
  assert.equal(greekIdentifiers('theta+alpha'),'theta+alpha');assert.match(greekIdentifiers('theta+alpha',true),/\\theta.*\\alpha/);
  assert.equal(greekIdentifiers(String.raw`\text{alpha} \operatorname{theta}(x)`),String.raw`\text{alpha} \operatorname{theta}(x)`);
});

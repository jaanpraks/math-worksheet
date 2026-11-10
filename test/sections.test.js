import {test} from 'node:test';
import assert from 'node:assert/strict';
import {screenY,sheetY,hiddenBySection,sectionGroup,validateSections} from '../src/sections.js';
import {region,serialize,deserialize} from '../src/model.js';
import {worksheet} from '../src/engine.js';
test('collapse changes presentation coordinates while keeping calculation order and values',()=>{
  const section={...region('section',0,100),height:300,collapsed:true},inside={...region('math',100,150),source:'a=7',hidden:true},after={...region('math',100,450),source:'a*2='};
  const regions=[section,inside,after];assert.equal(hiddenBySection(regions,inside),true);assert.equal(hiddenBySection(regions,after),false);assert.equal(screenY(regions,450),182);assert.equal(sheetY(regions,182),450);assert.equal(worksheet(regions).get(after.id).text,'14');assert.deepEqual(deserialize(serialize(regions)),regions);
  assert.deepEqual(sectionGroup(regions,new Set([section.id])),new Set([section.id,inside.id]));
});
test('several collapsed sections round trip coordinates without drift and reject overlaps',()=>{
  const a={...region('section',0,50),height:200,collapsed:true},b={...region('section',0,350),height:300,collapsed:true};
  for(const y of [0,40,250,300,650,800])assert.equal(sheetY([a,b],screenY([a,b],y)),y);
  assert.doesNotThrow(()=>validateSections([a,b]));assert.throws(()=>validateSections([a,{...b,y:200}]),/overlap/);
  assert.throws(()=>deserialize(serialize([{...a,hidden:'yes'}])),/hidden/);assert.throws(()=>deserialize(serialize([{...a,collapsed:1}])),/section state/);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {region,serialize,deserialize} from '../src/model.js';
test('appearance and hidden labels persist independently from field content',()=>{
  for(const type of ['math','text','section','slider','radio','plot']){
    const r={...region(type),backgroundColor:'#ffeeaa',borderColor:'#334455',hiddenLabel:'My calculation'};assert.deepEqual(deserialize(serialize([r])),[r]);
  }
  assert.throws(()=>deserialize(serialize([{...region('math'),borderColor:'red; color: blue'}])),/field color/);
});

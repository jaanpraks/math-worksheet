import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyRegion} from '../src/clipboard.js';
test('empty fields include whitespace-only notes, cleared equations and plots',()=>{
  assert.equal(emptyRegion({type:'text',text:' \n\t'}),true);
  assert.equal(emptyRegion({type:'math',source:''}),true);
  assert.equal(emptyRegion({type:'plot',series:'  '}),true);
  assert.equal(emptyRegion({type:'image',src:'data:image/png;base64,AA=='}),false);
  assert.equal(emptyRegion({type:'math',source:'0'}),false);
});

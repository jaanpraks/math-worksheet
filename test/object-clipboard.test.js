import {test} from 'node:test';
import assert from 'node:assert/strict';
import {duplicateObjects,readObjectClipboard,OBJECT_CLIPBOARD_PREFIX} from '../src/clipboard.js';
import {region,serialize} from '../src/model.js';
test('object duplication preserves all field data, regenerates IDs and retains relative layout',()=>{
  const items=['math','text','plot','slider','radio','image'].map((type,index)=>({...region(type,100+index*40,200+index*30),backgroundColor:'#ffeeaa',description:'Copy me',hiddenLabel:'Label',...(type==='image'?{src:'data:image/png;base64,AAAA',alt:'Embedded picture'}:{})}));
  const before=structuredClone(items),copies=duplicateObjects(items,{x:400,y:500});assert.deepEqual(items,before);
  copies.forEach((copy,index)=>{assert.notEqual(copy.id,items[index].id);assert.equal(copy.x,400+index*40);assert.equal(copy.y,500+index*30);const {id,x,y,...data}=copy,{id:oldId,x:oldX,y:oldY,...original}=items[index];assert.deepEqual(data,original);});
  assert.equal(new Set(copies.map(r=>r.id)).size,copies.length);
});
test('clipboard data is explicitly tagged and validated before insertion',()=>{
  const doc=serialize([region('math')]);assert.equal(readObjectClipboard({getData:type=>type==='text/plain'?'{"version":1,"regions":[]}':''}),null);
  assert.equal(readObjectClipboard({getData:type=>type==='text/plain'?OBJECT_CLIPBOARD_PREFIX+doc:''}).length,1);
  assert.throws(()=>readObjectClipboard({getData:type=>type==='text/plain'?OBJECT_CLIPBOARD_PREFIX+'{"version":2,"regions":[]}':''}),/version 1/);
});

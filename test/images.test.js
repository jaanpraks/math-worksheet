import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitImage,resizeImage} from '../src/images.js';
import {region,serialize,deserialize} from '../src/model.js';
test('images start at native size and fit existing frames without letterboxing',()=>{
  assert.deepEqual(fitImage(120,60),{width:120,height:60});assert.deepEqual(fitImage(120,60,400,300),{width:400,height:200});
  assert.deepEqual(fitImage(600,300,100,200),{width:100,height:50});assert.deepEqual(fitImage(40000,20000),{width:20000,height:10000});
});
test('image resizing maintains aspect ratio for horizontal, vertical and diagonal motion and clamps safely',()=>{
  for(const [dx,dy] of [[100,0],[0,100],[40,80],[-999,-999],[99999,99999]]){
    const size=resizeImage(120,60,dx,dy);assert.ok(Math.abs(size.width/size.height-2)<1e-12);assert.ok(size.width>0 && size.height>0);assert.ok(Math.max(size.width,size.height)<=20000);
  }
});
test('tiny and proportionally resized images round trip without a minimum card size',()=>{
  const image={...region('image'),src:'data:image/png;base64,AAAA',width:1,height:.5};assert.deepEqual(deserialize(serialize([image])),[image]);
  assert.throws(()=>deserialize(serialize([{...image,width:0}])),/too small/);
});

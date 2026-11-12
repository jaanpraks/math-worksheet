import {test} from 'node:test';
import assert from 'node:assert/strict';
import {anchors,viewSettings,MAX_CANVAS_Y} from '../src/canvas-geometry.js';
import {region,serialize,deserialize} from '../src/model.js';
import {emptyRegion} from '../src/clipboard.js';
test('anchors use labels independently of minimization and keep worksheet order',()=>{
 const items=[{id:'late',x:0,y:200,hiddenLabel:'# Later',hidden:false},{id:'right',x:200,y:100,hiddenLabel:'# Same'},{id:'left',x:20,y:100,hiddenLabel:'# Same',hidden:true},{id:'empty',x:0,y:0,hiddenLabel:'# '},{id:'normal',hiddenLabel:'Text'}];assert.deepEqual(anchors(items).map(r=>r.id),['left','right','late']);assert.equal(anchors(items)[0].label,'Same');
});
test('canvas settings round trip without affecting coordinates; distant anchors remain valid',()=>{
 const r={...region('text',80,MAX_CANVAS_Y-500),text:'',hiddenLabel:'# Far away'},settings={printArea:'landscape',zoom:.75,printScale:.8};assert.equal(emptyRegion(r),false);assert.deepEqual(deserialize(serialize([r],settings)),[r]);assert.deepEqual(JSON.parse(serialize([r],settings)).canvas,settings);assert.throws(()=>viewSettings({zoom:0}));assert.throws(()=>deserialize(JSON.stringify({version:1,regions:[r],canvas:{printArea:'bad'}})));
});

test("legacy canvas settings use 100% print scale and invalid print scales are rejected",()=>{assert.equal(viewSettings({zoom:.5}).printScale,1);for(const printScale of [0,3,"80",NaN])assert.throws(()=>viewSettings({printScale}));});

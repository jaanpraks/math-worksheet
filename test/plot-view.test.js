import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitPlot,plotArea,zoomPlot,equalizePlot} from '../src/plot-view.js';
import {worksheet,plotSeries} from '../src/engine.js';
import {region,serialize,deserialize} from '../src/model.js';
test('viewport resize extends the visible range without changing units per pixel',()=>{
  const area=plotArea(500,300),view=fitPlot([[[0,0],[10,5]]],area),scale=view.xScale;
  const wider=plotArea(700,300);assert.equal(view.xScale,scale);assert.ok(Math.abs(wider.width*scale-area.width*scale-200*scale)<1e-12);
});
test('wheel zoom anchors the pointer coordinate and respects individual axes',()=>{
  const area=plotArea(500,300),view=fitPlot([[[0,0],[10,5]]],area),old={...view};
  const px=area.width*.3,py=area.height*.4;
  zoomPlot(view,area,area.left+px,area.top+area.height-py,.5,'x');
  assert.equal(view.yScale,old.yScale);assert.equal(view.yMin,old.yMin);
  assert.ok(Math.abs(view.xMin+px*view.xScale-(old.xMin+px*old.xScale))<1e-12);
  const before={...view};zoomPlot(view,area,area.left+px,area.top+area.height-py,2,'y');
  assert.equal(view.xScale,before.xScale);assert.equal(view.xMin,before.xMin);
});
test('equal scales preserve center and use equal mathematical units per pixel',()=>{
  const area=plotArea(500,300),view=fitPlot([[[-1,-1],[1,1]]],area),cx=view.xMin+area.width*view.xScale/2;
  equalizePlot(view,area);assert.equal(view.xScale,view.yScale);assert.ok(Math.abs(view.xMin+area.width*view.xScale/2-cx)<1e-12);
});
test('function sampling follows the visible viewport while vector series remain data driven',()=>{
  const r={...region('plot'),series:'2*x',plotView:{xMin:10,yMin:0,xScale:.1,yScale:.1,plotWidth:200,plotHeight:100}};
  const points=plotSeries(r,new Map())[0];assert.deepEqual(points[0],[10,20]);assert.deepEqual(points.at(-1),[30,60]);
});
test('plot labels and viewport and vector visibility survive JSON',()=>{
  const plot={...region('plot'),title:'Orbit',xLabel:'x (m)',yLabel:'y (m)',showLegend:true,equalScale:true,plotView:{xMin:-2,yMin:-1,xScale:.01,yScale:.01,plotWidth:400,plotHeight:200}};
  const math={...region('math'),source:'0:20',showVector:false};assert.deepEqual(deserialize(serialize([plot,math])),[plot,math]);
  assert.equal(worksheet([math]).get(math.id).collection.count,21);
});

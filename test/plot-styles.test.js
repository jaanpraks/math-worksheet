import {test} from 'node:test';
import assert from 'node:assert/strict';
import {plotSeries} from '../src/engine.js';
import {fitPlot,plotArea} from '../src/plot-view.js';
import {seriesStyle} from '../src/plot-styles.js';
import {region,serialize,deserialize} from '../src/model.js';
test('single point vectors, rows and columns plot with a finite viewport',()=>{
  for(const series of ['[2];[3]','[2;2];[3;4]','[[2]];[[3]]']){
    const points=plotSeries({series},new Map());const view=fitPlot(points,plotArea(400,300));assert.ok(view.xScale>0);assert.ok(view.yScale>0);
  }
  assert.deepEqual(plotSeries({series:'[2];[3]'},new Map()),[[[2,3]]]);assert.throws(()=>plotSeries({series:'[];[]'},new Map()),/1–5000/);
});
test('single-point default is a marker and per-series styles persist and validate',()=>{
  assert.equal(seriesStyle({},0,1).mode,'markers');assert.equal(seriesStyle({},0,2).mode,'line');
  const plot={...region('plot'),seriesStyles:[null,{mode:'both',marker:'diamond',color:'#cc2233',size:9}]};assert.deepEqual(deserialize(serialize([plot])),[plot]);assert.equal(seriesStyle(plot,1,2).marker,'diamond');
  assert.throws(()=>deserialize(serialize([{...plot,seriesStyles:[{...plot.seriesStyles[1],size:99}]}])),/series style/);
});

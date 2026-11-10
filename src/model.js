import example from "./example.json" with { type: "json" };
import {validateSections} from './sections.js';
import {markerShapes} from './plot-styles.js';
export const imagePattern = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=\r\n]+$/;
export function region(type, x = 60, y = 60) {
  return { id: crypto.randomUUID(), type, x, y, width: type === 'plot' ? 470 : 380, height: type === 'plot' ? 365 : type === 'image' ? 260 : 150,
    ...(type === 'math' ? { latex: '1+1', source: '1+1' } : type === 'section'?{x:0,width:1300,height:250,title:'Solution',collapsed:false}: type === 'text' ? { text: 'Write a note…' } : type === 'plot' ? { series: 'sin(x)\ncos(x)', min: '0', max: '6.28',title:'',xLabel:'',yLabel:'',legendLabels:'',showLegend:false,equalScale:false } : type==='slider'?{name:'a',value:'1',min:'0',max:'10',step:'0.1',unit:''}:type==='radio'?{name:'b',options:'1\n2\n3',choice:'0',unit:''}:{ src: '', alt: 'Pasted image' }) };
}
export function starter() {
  return deserialize(JSON.stringify(example));
}
export function serialize(regions) { return JSON.stringify({ version: 1, regions }, null, 2); }
export function deserialize(text) {
  if (text.length > 30_000_000) throw Error('Worksheet exceeds 30 MB.');
  const doc = JSON.parse(text);
  if (doc.version !== 1 || !Array.isArray(doc.regions) || doc.regions.length > 250) throw Error('Expected a version 1 worksheet with at most 250 regions.');
  const ids = new Set();
  const regions=doc.regions.map(r => {
    if (!r || !['math', 'text', 'image', 'plot','slider','radio','section'].includes(r.type) || typeof r.id !== 'string' || ids.has(r.id)) throw Error('Invalid region or duplicate ID.');
    ids.add(r.id);
    for (const key of ['x','y','width','height']) if (!Number.isFinite(r[key]) || r[key] < 0 || r[key] > 20000) throw Error('Invalid region geometry.');
    if (r.type==='image' ? r.width<=0 || r.height<=0 : r.width < (r.type==='text'?40:220) || r.height < (r.type==='text'?26:100)) throw Error('Region is too small.');
    const clean = { id: r.id, type: r.type, x: r.x, y: r.y, width: r.width, height: r.height };
    for(const key of ['backgroundColor','borderColor'])if(r[key]!==undefined){if(typeof r[key]!=='string' || (r[key]!=='transparent' && !/^#[0-9a-f]{6}$/i.test(r[key])))throw Error('Invalid field color.');clean[key]=r[key];}
    if(r.description!==undefined){if(typeof r.description!=='string' || r.description.length>250 || /[^\x20-\x7e]/.test(r.description))throw Error('Invalid field explanation.');clean.description=r.description;}
    if(r.hidden!==undefined){if(typeof r.hidden!=='boolean')throw Error('Invalid hidden field setting.');clean.hidden=r.hidden;}
    if(r.hiddenLabel!==undefined){if(typeof r.hiddenLabel!=='string' || r.hiddenLabel.length>120)throw Error('Invalid hidden field label.');clean.hiddenLabel=r.hiddenLabel;}
    if(r.type==='section'){if(typeof r.collapsed!=='boolean')throw Error('Invalid section state.');clean.collapsed=r.collapsed;clean.x=0;}
    if(r.type==='slider') {
      for(const key of ['sequence','frame','fps'])if(r[key]!==undefined){if(typeof r[key]!=='string')throw Error('Invalid animation setting.');clean[key]=r[key];}
      if(r.loop!==undefined){if(typeof r.loop!=='boolean')throw Error('Invalid animation loop.');clean.loop=r.loop;}
    }
    if(r.type==='math' && r.displayOnly!==undefined){if(typeof r.displayOnly!=='boolean')throw Error('Invalid equation mode.');clean.displayOnly=r.displayOnly;}
    if(r.type==='math' && r.showVector!==undefined){if(typeof r.showVector!=='boolean')throw Error('Invalid vector display setting.');clean.showVector=r.showVector;}
    if(r.type==='plot') {
      if(r.seriesStyles!==undefined){
        if(!Array.isArray(r.seriesStyles) || r.seriesStyles.length>250)throw Error('Invalid series styles.');
        clean.seriesStyles=r.seriesStyles.map(style=>{
          if(style===null)return null;
          if(!style || !['line','markers','both'].includes(style.mode) || !Object.hasOwn(markerShapes,style.marker) || !Number.isFinite(style.size) || style.size<2 || style.size>24 || !/^#[0-9a-f]{6}$/i.test(style.color))throw Error('Invalid series style.');
          return {mode:style.mode,marker:style.marker,size:style.size,color:style.color};
        });
      }
      for(const key of ['title','xLabel','yLabel','legendLabels'])if(r[key]!==undefined){if(typeof r[key]!=='string')throw Error('Invalid plot label.');clean[key]=r[key];}
      for(const key of ['showLegend','equalScale'])if(r[key]!==undefined){if(typeof r[key]!=='boolean')throw Error('Invalid plot option.');clean[key]=r[key];}
      if(r.plotView!==undefined){
        clean.plotView={};for(const key of ['xMin','yMin','xScale','yScale','plotWidth','plotHeight']){
          const value=r.plotView?.[key];if(!Number.isFinite(value) || (!['xMin','yMin'].includes(key)&&value<=0))throw Error('Invalid plot viewport.');clean.plotView[key]=value;
        }
      }
    }
    if(r.type==='text' && r.manualSize!==undefined) {
      if(typeof r.manualSize!=='boolean')throw Error('Invalid text sizing mode.');
      clean.manualSize=r.manualSize;
    }
    if (r.type === 'math' && r.unitMode !== undefined) {
      if (!['explicit','raw'].includes(r.unitMode)) throw Error('Invalid unit mode.');
      clean.unitMode = r.unitMode;
    }
    const fields = { math: ['source','latex'], text: ['text'], image: ['src','alt'], plot: ['series','min','max'],slider:['name','value','min','max','step','unit'],radio:['name','options','choice','unit'],section:['title'] }[r.type];
    for (const field of fields) {
      if (typeof r[field] !== 'string') throw Error(`Missing ${field}.`);
      clean[field] = r[field];
    }
    if (r.type === 'image' && !imagePattern.test(r.src)) throw Error('Only embedded PNG, JPEG, WebP and GIF images are supported.');
    return clean;
  });
  validateSections(regions);return regions;
}

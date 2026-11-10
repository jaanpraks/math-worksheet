import {test,expect} from '@playwright/test';
const r=(id,type,x,y,data)=>({id,type,x,y,width:type==='plot'?420:380,height:type==='plot'?260:150,...data});
const slider=r('s','slider',120,100,{name:'a',value:'0',min:'0',max:'2',step:'1',unit:'',fps:'4',loop:false});
const equation=r('eq','math',120,260,{source:'a=',latex:'a=',unitMode:'raw'});
async function load(page,regions){await page.goto('/');await page.locator('#file').setInputFiles({name:'animation.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions}))});}
const value=page=>page.locator('[data-id="eq"] output');
test('Play steps through a range, keeps the track still, pauses at the end and undoes as one change',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page,[slider,equation]);await expect(value(page)).toHaveText('= 0');
  await page.getByRole('button',{name:'Play animation',exact:true}).click();await expect(page.getByRole('slider')).toBeDisabled();
  await expect(value(page)).toHaveText('= 1');await expect(page.getByRole('slider')).toHaveValue('0');
  await expect(value(page)).toHaveText('= 2');await expect(page.getByRole('button',{name:'Play animation',exact:true})).toBeVisible();await expect(page.getByRole('slider')).toHaveValue('2');
  await page.keyboard.press('Control+z');await expect(value(page)).toHaveText('= 0');expect(errors).toEqual([]);
});
test('vector animation drives two plots with stable viewports and saves/loads paused',async({page})=>{
  await load(page,[r('v','math',120,30,{source:'values=[3,1,4]',latex:'values=[3,1,4]',unitMode:'raw'}),{...slider,y:160,sequence:'values',frame:'0',fps:'2'}, {...equation,y:320},r('p1','plot',540,360,{series:'a*x',min:'0',max:'2'}),r('p2','plot',980,360,{series:'sin(a*x)',min:'0',max:'2'})]);
  await expect(value(page)).toHaveText('= 3');await expect(page.locator('.plot.has-error')).toHaveCount(0);const plots=page.locator('.plot canvas');const before=await plots.evaluateAll(els=>els.map(el=>({image:el.toDataURL(),view:el.dataset.view})));
  await page.getByRole('button',{name:'Play animation',exact:true}).click();await expect(value(page)).toHaveText('= 1');await expect(value(page)).toHaveText('= 4');await expect(page.getByRole('button',{name:'Play animation',exact:true})).toBeVisible();
  const after=await plots.evaluateAll(els=>els.map(el=>({image:el.toDataURL(),view:el.dataset.view})));for(let i=0;i<2;i++){expect(after[i].image).not.toBe(before[i].image);expect(after[i].view).toBe(before[i].view);}
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;await page.reload();await page.locator('#file').setInputFiles(await download.path());await expect(value(page)).toHaveText('= 4');await expect(page.getByRole('button',{name:'Play animation',exact:true})).toBeVisible();
  await page.getByRole('slider').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});await expect(value(page)).toHaveText('= 3');
});
test('looping playback can be paused and deleting an active slider stops its timer',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await load(page,[{...slider,max:'1',fps:'2',loop:true},equation]);
  await page.getByRole('button',{name:'Play animation',exact:true}).click();await expect(value(page)).toHaveText('= 1');await expect(value(page)).toHaveText('= 0');await page.getByRole('button',{name:'Pause animation',exact:true}).click();await expect(page.getByRole('slider')).toBeEnabled();
  await page.getByRole('button',{name:'Play animation',exact:true}).click();await page.keyboard.press('Control+a');await page.keyboard.press('Delete');await expect(page.locator('.region')).toHaveCount(0);await page.waitForTimeout(600);expect(errors).toEqual([]);
});
test('dragging the plot pans both axes, preserves scale and position, and supports Undo',async({page})=>{
  await load(page,[r('p','plot',150,100,{series:'sin(x)',min:'-3',max:'3'})]);const plot=page.locator('.plot'),canvas=plot.locator('canvas');const before=await canvas.evaluate(el=>JSON.parse(el.dataset.view)),box=await canvas.boundingBox();
  await page.mouse.move(box.x+180,box.y+100);await page.mouse.down();await page.mouse.move(box.x+240,box.y+130,{steps:6});await page.mouse.up();const after=await canvas.evaluate(el=>JSON.parse(el.dataset.view));
  expect(after.xMin).toBeCloseTo(before.xMin-60*before.xScale,10);expect(after.yMin).toBeCloseTo(before.yMin+30*before.yScale,10);expect(after.xScale).toBe(before.xScale);expect(after.yScale).toBe(before.yScale);expect(await plot.evaluate(el=>el.style.left)).toBe('150px');
  await page.keyboard.press('Control+z');await expect.poll(()=>canvas.evaluate(el=>JSON.parse(el.dataset.view).xMin)).toBe(before.xMin);
});


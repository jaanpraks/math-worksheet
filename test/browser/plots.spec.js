import {test,expect} from '@playwright/test';
const plot={id:'p',type:'plot',x:150,y:100,width:540,height:340,series:'sin(x)\ncos(x)',min:'-3',max:'3'};
async function load(page,regions=[plot]){await page.goto('/');await page.locator('#file').setInputFiles({name:'plot.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions}))});await expect(page.locator('.plot canvas')).toHaveAttribute('data-view',/.+/);}
const view=page=>page.locator('.plot canvas').evaluate(el=>JSON.parse(el.dataset.view));
async function wheel(page,keys=[]){const c=page.locator('.plot canvas'),b=await c.boundingBox();await page.mouse.move(b.x+b.width*.6,b.y+b.height*.5);for(const k of keys)await page.keyboard.down(k);await page.mouse.wheel(0,-180);for(const k of keys)await page.keyboard.up(k);}
test('plot resizing expands coordinates while preserving scale and wheel modifiers affect only their axis',async({page})=>{
  await load(page);const before=await view(page),grip=await page.locator('.plot .corner-resize').boundingBox();
  await page.mouse.move(grip.x+7,grip.y+7);await page.mouse.down();await page.mouse.move(grip.x+167,grip.y+67,{steps:8});await page.mouse.up();
  await expect.poll(async()=> (await view(page)).plotWidth).toBeGreaterThan(before.plotWidth+140);
  const resized=await view(page);expect(resized.xScale).toBe(before.xScale);expect(resized.yScale).toBe(before.yScale);expect(resized.xMax).toBeGreaterThan(before.xMax);
  await wheel(page,['Control']);await expect.poll(async()=> (await view(page)).yScale).toBeLessThan(resized.yScale);let next=await view(page);expect(next.xScale).toBe(resized.xScale);
  const old=next;await wheel(page,['Shift']);await expect.poll(async()=> (await view(page)).xScale).toBeLessThan(old.xScale);next=await view(page);expect(next.yScale).toBe(old.yScale);
  const both=next;await wheel(page);await expect.poll(async()=> (await view(page)).xScale).toBeLessThan(both.xScale);expect((await view(page)).yScale).toBeLessThan(both.yScale);
});
test('equal scales, left legend, title and axis labels are configurable and saved',async({page})=>{
  await load(page);await page.locator('.plot').hover();await page.getByLabel('Field properties',{exact:true}).click();
  await page.getByLabel('Plot title',{exact:true}).fill('Harmonic functions');await page.getByLabel('X-axis label',{exact:true}).fill('Angle (rad)');await page.getByLabel('Y-axis label',{exact:true}).fill('Amplitude');
  await page.getByLabel('Legend on left',{exact:true}).check();await page.getByLabel('Legend names — one per series',{exact:true}).fill('Sine\nCosine');await page.getByLabel('Equal axis scales',{exact:true}).check();
  await page.getByRole('button',{name:'Fit data',exact:true}).click();
  await page.getByLabel('Field properties',{exact:true}).click();await expect.poll(async()=>{const v=await view(page);return v.xScale===v.yScale;}).toBe(true);
  await expect(page.locator('.plot-legend')).toContainText('Sine');const legend=await page.locator('.plot-legend').boundingBox(),canvas=await page.locator('.plot canvas').boundingBox();expect(legend.x+legend.width).toBeLessThanOrEqual(canvas.x+1);
  const saved=await view(page),pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;
  await page.reload();await page.locator('#file').setInputFiles(await download.path());await expect(page.locator('.plot-legend')).toContainText('Cosine');
  await expect.poll(async()=> (await view(page)).xScale).toBe(saved.xScale);
  await page.screenshot({path:'test-results/plot-viewport.png'});
});
test('long vector answers can be hidden without affecting plot data',async({page})=>{
  const t={id:'t',type:'math',x:100,y:60,width:380,height:150,source:'t=0:0.1:6.2=',latex:'t=0:0.1:6.2',unitMode:'raw'};
  await load(page,[t,{...plot,y:250,series:'map(t,cos);map(t,sin)'}]);
  const result=page.locator('.math .result');await expect(result).toHaveAttribute('data-collapsed','true');
  await page.getByRole('button',{name:'Show 63 values'}).click();await expect(result).toHaveAttribute('data-collapsed','false');
  await page.getByRole('button',{name:'Hide values',exact:true}).click();await expect(result).toHaveAttribute('data-collapsed','true');
  await expect(page.locator('.plot')).not.toHaveClass(/has-error/);
});



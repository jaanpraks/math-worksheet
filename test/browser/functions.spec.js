import {test,expect} from '@playwright/test';
async function fresh(page){await page.goto('/');await page.locator('#canvas').click({position:{x:1050,y:600}});const region=page.locator('.math').last();await expect(region.locator('.expression')).toBeFocused();return region;}
test('editing Math.js source updates the canvas equation and persists both views',async({page})=>{
  const region=await fresh(page);await page.keyboard.type('1');await region.hover();await region.getByLabel('Field properties',{exact:true}).click();
  const raw=region.getByLabel('Math.js expression',{exact:true});await raw.fill('fft([1,0,0,0])=');await raw.press('Control+Enter');
  await expect(region.locator('output')).toContainText('[1, 1, 1, 1]');
  await expect.poll(()=>region.locator('.expression').evaluate(el=>el.value)).toContain('\\operatorname{fft}');
  await region.getByLabel('Field properties',{exact:true}).click();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;
  await page.reload();await page.locator('#file').setInputFiles(await download.path());
  await expect.poll(()=>page.locator('.expression').last().evaluate(el=>el.value)).toContain('\\operatorname{fft}');
  await expect(page.locator('.math').last().locator('output')).toContainText('[1, 1, 1, 1]');
});
test('FFT and inverse FFT can be typed directly in visual math fields',async({page})=>{
  const region=await fresh(page);await page.keyboard.type('fft([1,0,0,0])=');
  await expect(region.locator('output')).toContainText('[1, 1, 1, 1]');await expect(region).not.toHaveClass(/has-error/);
  await page.keyboard.press('Enter');const inverse=page.locator('.math').last();await expect(inverse.locator('.expression')).toBeFocused();
  await page.keyboard.type('ifft([1,1,1,1])=');
  await expect(inverse.locator('output')).toContainText('[1, 0, 0, 0]');await expect(inverse).not.toHaveClass(/has-error/);
});
test('older saved raw expressions are also rebuilt as visible canvas equations',async({page})=>{
  await page.goto('/');
  const region={id:'old',type:'math',x:100,y:100,width:380,height:150,source:'fft([1,0,0,0])=',latex:'1+1',unitMode:'raw'};
  await page.locator('#file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[region]}))});
  await expect.poll(()=>page.locator('.expression').evaluate(el=>el.value)).toContain('\\operatorname{fft}');
  await expect(page.locator('output')).toContainText('[1, 1, 1, 1]');
});
test('raw multi-letter identifiers remain usable when editing the displayed equation',async({page})=>{
  const region=await fresh(page);await page.keyboard.type('1');await region.hover();await region.getByLabel('Field properties',{exact:true}).click();
  await region.getByLabel('Math.js expression',{exact:true}).fill('signal=[1,0,0,0]');await region.getByLabel('Field properties',{exact:true}).click();
  await region.locator('.expression').focus();await page.keyboard.press('Enter');const next=page.locator('.math').last();await expect(next.locator('.expression')).toBeFocused();
  await page.keyboard.type('1');await next.hover();await next.getByLabel('Field properties',{exact:true}).click();await next.getByLabel('Math.js expression',{exact:true}).fill('fft(signal)');await next.getByLabel('Field properties',{exact:true}).click();
  await next.locator('.expression').focus();await next.locator('.expression').evaluate(el=>{el.position=el.lastOffset;});await page.keyboard.type('*2=');
  await expect(next.locator('output')).toContainText('[2, 2, 2, 2]');await expect(next).not.toHaveClass(/has-error/);
  await page.screenshot({path:'test-results/fft-preview.png'});
});

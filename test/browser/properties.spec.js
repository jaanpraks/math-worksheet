import {test,expect} from '@playwright/test';
test('context menu has a left grab handle and compact right tool rows',async({page})=>{
  await page.goto('/');const region=page.locator('.math').first();await region.hover();
  const items=region.locator('.region-head > *');
  const positions=await items.evaluateAll(nodes=>nodes.map(node=>({text:node.matches('details')?node.querySelector('summary').textContent:node.textContent,top:node.getBoundingClientRect().top,left:node.getBoundingClientRect().left})));
  expect(positions.map(item=>item.text)).toEqual(['⋮','?','−','×']);
  expect(new Set(positions.map(item=>item.top)).size).toBe(1);
  expect((await region.locator('.move-handle').boundingBox()).x).toBeLessThan((await region.boundingBox()).x);
  await region.getByLabel('Field properties',{exact:true}).click();await expect(region.getByRole('tab')).toHaveText(['Settings','Colors','Help']);await region.getByRole('tab',{name:'Help',exact:true}).click();await expect(region.getByRole('tabpanel',{name:'Help',exact:true})).toContainText('Math.js');await region.getByLabel('Field properties',{exact:true}).click();
  await region.getByRole('button',{name:'Hide field',exact:true}).click();
  await region.hover();await expect(region.locator('.region-head')).toHaveCSS('opacity','1');
  await expect(region.locator('.move-handle')).toHaveCSS('opacity','1');
  await expect(region.locator('.region-head .resize')).toHaveCount(0);
});
test('field colors preserve equation content, results and geometry and support Undo and save/load',async({page})=>{
  await page.goto('/');const region=page.locator('.math').nth(2),expression=region.locator('.expression');const latex=await expression.evaluate(el=>el.value),before=await region.boundingBox(),answer=await region.locator('output').textContent();
  await region.hover();await region.getByLabel('Field properties',{exact:true}).click();await region.getByRole('tab',{name:'Colors',exact:true}).click();await region.getByLabel('Background color',{exact:true}).fill('#ffeeaa');await region.getByLabel('Box line color',{exact:true}).fill('#334455');await expect(region).toHaveCSS('background-color','rgb(255, 238, 170)');expect(await expression.evaluate(el=>el.value)).toBe(latex);expect(await region.locator('output').textContent()).toBe(answer);expect(await region.boundingBox()).toEqual(before);expect(await region.evaluate(el=>getComputedStyle(el,'::before').outlineColor)).toBe('rgb(51, 68, 85)');
  await page.keyboard.press('Control+z');expect(await region.evaluate(el=>getComputedStyle(el,'::before').outlineColor)).toBe('rgba(0, 0, 0, 0)');await page.keyboard.press('Control+y');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;await page.reload();await page.locator('#file').setInputFiles(await download.path());await expect(region).toHaveCSS('background-color','rgb(255, 238, 170)');expect(await region.evaluate(el=>getComputedStyle(el,'::before').outlineColor)).toBe('rgb(51, 68, 85)');expect(await expression.evaluate(el=>el.value)).toBe(latex);
});
test('minimize and restore use window symbols and properties exist on sections',async({page})=>{
  await page.goto('/');const region=page.locator('.math').first();await region.hover();await expect(region.getByRole('button',{name:'Hide field',exact:true})).toHaveText('−');await region.getByRole('button',{name:'Hide field',exact:true}).click();await region.hover();await expect(region.locator('.region-head')).toHaveCSS('opacity','1');await expect(region.getByLabel('Field properties',{exact:true})).toBeVisible();await page.getByRole('button',{name:'+ Section',exact:true}).click();await expect(page.getByRole('button',{name:'Collapse section',exact:true})).toHaveText('−');await page.locator('.section').getByLabel('Field properties',{exact:true}).click();await page.locator('.section').getByRole('tab',{name:'Colors',exact:true}).click();await page.locator('.section').getByLabel('Background color',{exact:true}).fill('#ddffee');await expect(page.locator('.section-bar')).toHaveCSS('background-color','rgb(221, 255, 238)');await page.locator('.section').getByLabel('Field properties',{exact:true}).click();await page.getByRole('button',{name:'Collapse section',exact:true}).click();await expect(page.getByRole('button',{name:'Expand section',exact:true})).toHaveText('□');
});





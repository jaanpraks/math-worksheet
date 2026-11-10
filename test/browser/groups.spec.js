import {test,expect} from '@playwright/test';
test('typing semicolons creates one editable vertical math group and evaluates sequentially',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#canvas').click({position:{x:1050,y:600}});const region=page.locator('.math').last(),field=region.locator('.expression');await expect(field).toBeFocused();await page.keyboard.type('a=3;b=4;a+b=');
  await expect(region).toHaveClass(/math-group/);await expect(region.locator('output')).toContainText('7');expect(await field.evaluate(el=>el.value)).toContain('\\begin{array}{l}');await expect(region.locator('.equation-line')).toHaveCSS('border-left-width','2px');
  await page.keyboard.press('Enter');await expect(page.locator('.expression').last()).toBeFocused();await page.keyboard.type('b*2=');await expect(page.locator('.math').last().locator('output')).toContainText('8');expect(errors).toEqual([]);
});
test('raw groups with matrices render vertically, move together, and survive save/load',async({page})=>{
  await page.goto('/');await page.locator('#canvas').click({position:{x:900,y:600}});const r=page.locator('.math').last();await expect(r.locator('.expression')).toBeFocused();await page.keyboard.type('1');await r.hover();await r.getByLabel('Edit Math.js expression',{exact:true}).click();await r.getByLabel('Math.js expression',{exact:true}).fill('A=[1,2;3,4];d=det(A);d*2=');await r.getByLabel('Edit Math.js expression',{exact:true}).click();await expect(r.locator('output')).toContainText('-4');await expect(r).toHaveClass(/math-group/);expect(await r.locator('.expression').evaluate(el=>el.value)).toContain('bmatrix');
  const before=await r.boundingBox(),handle=await r.locator('.region-head span').boundingBox();await page.mouse.move(handle.x+8,handle.y+8);await page.mouse.down();await page.mouse.move(handle.x+48,handle.y+38,{steps:5});await page.mouse.up();expect((await r.boundingBox()).x).toBe(before.x+40);await page.keyboard.press('Control+z');expect((await r.boundingBox()).x).toBe(before.x);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;await page.reload();await page.locator('#file').setInputFiles(await download.path());await expect(page.locator('.math').last()).toHaveClass(/math-group/);await expect(page.locator('.math').last().locator('output')).toContainText('-4');
});




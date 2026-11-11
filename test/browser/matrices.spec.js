import {test,expect} from '@playwright/test';
test('the built-in Insert matrix action uses a square grid and cells evaluate correctly',async({page})=>{
  await page.goto('/');await page.locator('#canvas').click({position:{x:1050,y:600}});
  const field=page.locator('.expression').last();await expect(field).toBeFocused();await page.keyboard.type('A=');
  await field.evaluate(el=>el.menuItems.find(item=>item.id==='insert-matrix').submenu.find(item=>item.id==='insert-matrix-2x2').onMenuSelect());
  await expect.poll(()=>field.evaluate(el=>el.value)).toContain('\\begin{bmatrix}');
  await page.keyboard.type('1');await page.keyboard.press('Tab');await page.keyboard.type('2');await page.keyboard.press('Tab');await page.keyboard.type('3');await page.keyboard.press('Tab');await page.keyboard.type('4');
  await field.evaluate(el=>{el.position=el.lastOffset;});await page.keyboard.type('=');
  await expect(page.locator('.math').last().locator('output')).toContainText('[[1, 2], [3, 4]]');
});
test('raw semicolon matrices render as grids and remain usable in visual calculations',async({page})=>{
  await page.goto('/');await page.locator('#canvas').click({position:{x:1050,y:600}});await expect(page.locator('.expression').last()).toBeFocused();await page.keyboard.type('1');
  let r=page.locator('.math').last();await r.hover();await r.getByLabel('Field properties',{exact:true}).click();await r.getByLabel('Math.js expression',{exact:true}).fill('A=[1,2;3,4]');await r.getByLabel('Field properties',{exact:true}).click();
  await expect.poll(()=>r.locator('.expression').evaluate(el=>el.value)).toContain('bmatrix');
  await r.locator('.expression').focus();await page.keyboard.press('Enter');r=page.locator('.math').last();await expect(r.locator('.expression')).toBeFocused();await page.keyboard.type('1');await r.hover();await r.getByLabel('Field properties',{exact:true}).click();await r.getByLabel('Math.js expression',{exact:true}).fill('det(A)=');
  await expect(r.locator('output')).toContainText('-2');
});



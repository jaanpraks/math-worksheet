import {test,expect} from '@playwright/test';
test('new equations show only the cursor until content is typed',async({page})=>{
  await page.goto('/');await page.locator('#canvas').click({position:{x:1050,y:600}});
  const field=page.locator('.math').last();await expect(field.locator('.expression')).toBeFocused();await field.hover();
  await expect(field.locator('.region-head')).toBeHidden();
  expect(await field.evaluate(el=>getComputedStyle(el).outlineColor)).toBe('rgba(0, 0, 0, 0)');
  await page.keyboard.type('7');await expect(field.locator('.region-head')).toBeVisible();
  expect(await field.evaluate(el=>getComputedStyle(el).outlineColor)).not.toBe('rgba(0, 0, 0, 0)');
  await page.keyboard.press('Backspace');await expect(field.locator('.region-head')).toBeHidden();
  expect(await field.evaluate(el=>getComputedStyle(el).outlineColor)).toBe('rgba(0, 0, 0, 0)');
});
test('empty text fields hide both left controls and the corner grip until typing starts',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'+ Text',exact:true}).click();
  const field=page.locator('.text').last();await expect(field.locator('textarea')).toBeFocused();await field.hover();
  await expect(field.locator('.region-head')).toBeHidden();await expect(field.locator('.corner-resize')).toBeHidden();
  await page.keyboard.type('A note');await expect(field.locator('.region-head')).toBeVisible();await expect(field.locator('.corner-resize')).toBeVisible();
  await field.locator('textarea').fill('');await expect(field.locator('.region-head')).toBeHidden();await expect(field.locator('.corner-resize')).toBeHidden();
});

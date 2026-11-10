import {test,expect} from '@playwright/test';
const geometry=page=>page.locator('.region').evaluateAll(els=>els.map(el=>({id:el.dataset.id,x:parseFloat(el.style.left),y:parseFloat(el.style.top)})));
test('Backspace reverses Enter and keeps the cursor on the canvas for repeated row deletion',async({page})=>{
  await page.goto('/');const before=await geometry(page),anchor=page.locator('.expression').first();
  await anchor.focus();await page.keyboard.press('Enter');
  await expect(page.locator('.expression').last()).toBeFocused();await expect(page.locator('.region')).toHaveCount(before.length+1);
  await page.keyboard.press('Backspace');
  await expect(page.locator('.region')).toHaveCount(before.length);expect(await geometry(page)).toEqual(before);await expect(page.locator('#canvas')).toBeFocused();
  const point=await page.locator('.canvas-caret').evaluate(el=>parseFloat(el.style.top));
  await page.keyboard.press('Backspace');await expect(page.locator('#canvas')).toBeFocused();
  expect(await page.locator('.canvas-caret').evaluate(el=>parseFloat(el.style.top))).toBeLessThan(point);
  await expect(page.locator('.region')).toHaveCount(before.length);
});
test('Backspace edits characters normally, then closes the emptied row on the next press',async({page})=>{
  await page.goto('/');const before=await geometry(page);await page.locator('.expression').first().focus();await page.keyboard.press('Enter');
  const field=page.locator('.expression').last();await expect(field).toBeFocused();await page.keyboard.type('7');await page.keyboard.press('Backspace');
  await expect(field).toHaveJSProperty('value','');await expect(page.locator('.region')).toHaveCount(before.length+1);
  await page.keyboard.press('Backspace');await expect(page.locator('.region')).toHaveCount(before.length);expect(await geometry(page)).toEqual(before);
});
test('Backspace on an empty text field pulls later objects up without changing earlier fields',async({page})=>{
  await page.goto('/');const before=await geometry(page);
  await page.getByRole('button',{name:'+ Text',exact:true}).click();await expect(page.locator('.text textarea').last()).toBeFocused();
  await page.keyboard.press('Backspace');await expect(page.locator('.region')).toHaveCount(before.length);
  const after=await geometry(page);expect(after.find(r=>r.id===before[0].id).y).toBe(before[0].y);
  expect(after.find(r=>r.id===before[1].id).y).toBe(before[1].y-38);
});

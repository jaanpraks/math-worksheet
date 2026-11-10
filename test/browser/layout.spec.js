import {test,expect} from '@playwright/test';
test('controls sit right of the first line and hover reveals a faint outline without changing field height',async({page})=>{
  await page.goto('/');
  const equation=page.locator('.math').first();
  const before=await equation.boundingBox();
  await equation.hover();
  const head=await equation.locator('.region-head').boundingBox();
  expect(head.x).toBeGreaterThanOrEqual(before.x+before.width-1);
  expect(Math.abs(head.y-before.y)).toBeLessThan(2);
  expect(await equation.evaluate(el=>getComputedStyle(el).outlineColor)).not.toBe('rgba(0, 0, 0, 0)');
  expect((await equation.boundingBox()).height).toBe(before.height);
  await page.getByLabel('Edit Math.js expression',{exact:true}).first().click();
  await expect(equation.locator('details:has(> summary[aria-label="Edit Math.js expression"]) > .region-settings')).toBeVisible();
  expect((await equation.boundingBox()).height).toBe(before.height);
  await page.getByLabel('Edit Math.js expression',{exact:true}).first().click();
  const image=page.locator('.plot'); await image.hover();
  const plotBox=await image.boundingBox();
  await expect(image.locator('.region-head .resize')).toHaveCount(0);
  const grip=await image.locator('.corner-resize').boundingBox();
  expect(Math.abs(grip.x+grip.width-plotBox.x-plotBox.width)).toBeLessThan(5);
});
test('a short note and equation can occupy a compact book-like line',async({page})=>{
  await page.goto('/');
  await page.locator('#canvas').click({position:{x:1030,y:90}});
  await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('Speed is');
  const note=page.locator('.text').last();
  await expect(note.locator('textarea')).toHaveValue('Speed is');
  await expect.poll(async()=> (await note.boundingBox()).width).toBeLessThan(120);
  expect((await note.boundingBox()).height).toBeLessThan(40);
  await page.locator('#canvas').click({position:{x:1300,y:90}});
  const equation=page.locator('.math').last();await expect(equation.locator('.expression')).toBeFocused();
  await page.keyboard.type('2+3=');
  await expect(equation.locator('output')).toContainText('5');
  expect(Math.abs((await note.boundingBox()).y-(await equation.boundingBox()).y)).toBeLessThan(2);
  await page.screenshot({path:'test-results/compact-layout.png'});
});


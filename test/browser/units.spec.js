import { test, expect } from '@playwright/test';

async function requestAnswer(page) {
  const field=page.locator('.expression').last();
  if(await field.evaluate(el=>/=\s*$/.test(el.value)))return;
  await field.evaluate(el=>{el.position=el.lastOffset;});await page.keyboard.type('=');
}
async function equation(page) {
  await page.locator('#canvas').click({position:{x:1030,y:80}});
  const field=page.locator('.expression').last(); await expect(field).toBeFocused(); return field;
}
test('5kg offers a unit, Tab accepts it, colors it, and persists its meaning',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/'); const field=await equation(page);
  await page.keyboard.type('5kg');
  const r=page.locator('.math').last();
  await expect(r.locator('.unit-hint')).toContainText('kg — Tab');
  await expect(r.locator('output')).toContainText('Press Tab');
  expect(await field.evaluate(el=>el.value)).not.toContain('worksheet-unit');
  await page.keyboard.press('Tab');
  await expect(field).toBeFocused();
  await requestAnswer(page);
  await expect(r.locator('output')).toContainText('5 kg');
  await expect.poll(()=>field.evaluate(el=>el.value)).toContain('worksheet-unit=kg');
  await expect.poll(()=>field.evaluate(el=>el.value)).toContain('\\cdot');
  const color=await field.evaluate(el=>{
    const span=el.shadowRoot.querySelector('[data-worksheet-unit="kg"]');
    return span && [...span.querySelectorAll('*')].some(node=>getComputedStyle(node).color==='rgb(19, 127, 120)');
  });
  expect(color).toBe(true);
  await expect.poll(()=>r.locator('.result').evaluate(el=>el.value)).toContain('textcolor');
  await page.keyboard.press('Backspace');await page.keyboard.type('*2');
  await requestAnswer(page);
  await expect(r.locator('output')).toContainText('10 kg');
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();
  const download=await downloadPromise;await page.reload();await page.locator('#file').setInputFiles(await download.path());
  await expect(page.locator('.math').last().locator('output')).toContainText('10 kg');
  await expect.poll(()=>page.locator('.expression').last().evaluate(el=>el.value)).toContain('worksheet-unit=kg');
  expect(errors).toEqual([]);
});
test('explicit multiplication works, ordinary Space still converts to text',async({page})=>{
  await page.goto('/');await equation(page);
  await page.keyboard.type('2*5kg');await page.keyboard.press('Tab');await requestAnswer(page);
  await expect(page.locator('.math').last().locator('output')).toContainText('10 kg');
  await page.keyboard.press('Enter');await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('5*kg');await page.keyboard.press('Tab');
  await requestAnswer(page);
  await expect(page.locator('.math').last().locator('output')).toContainText('5 kg');
  await page.keyboard.press('Space');
  await expect(page.locator('.text textarea').last()).toBeFocused();
});

test('compound units and an identically named variable remain distinct',async({page})=>{
  await page.goto('/');await equation(page);
  await page.keyboard.type('5m');await page.keyboard.press('Tab');
  await page.keyboard.type('/s');await page.keyboard.press('Tab');
  await page.keyboard.type('^2');
  await requestAnswer(page);
  await expect(page.locator('.math').last().locator('output')).toContainText('5 m / s^2');
  await page.keyboard.press('Enter');await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('m=7');
  await requestAnswer(page);
  await expect(page.locator('.math').last().locator('output')).toContainText('7');
  await page.keyboard.press('Enter');await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('m*5m');
  await expect(page.locator('.math').last().locator('.unit-hint')).toContainText('m — Tab');
  await page.keyboard.press('Tab');
  await requestAnswer(page);
  await expect(page.locator('.math').last().locator('output')).toContainText('35 m');
});

test('units may be squared before or after Tab acceptance',async({page})=>{
  await page.goto('/');await equation(page);
  await page.keyboard.type('5m^2');
  await expect(page.locator('.math').last().locator('.unit-hint')).toContainText('m — Tab');
  await page.keyboard.press('Tab');
  await requestAnswer(page);
  await expect(page.locator('.math').last().locator('output')).toContainText('5 m^2');
  await page.keyboard.press('Enter');await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('5m');await page.keyboard.press('Tab');await page.keyboard.type('^2');
  await requestAnswer(page);
  await expect(page.locator('.math').last().locator('output')).toContainText('5 m^2');
  await page.keyboard.press('Enter');await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('5m');await page.keyboard.press('Tab');await page.keyboard.type('/s^2');await page.keyboard.press('Tab');
  await requestAnswer(page);
  await expect(page.locator('.math').last().locator('output')).toContainText('5 m / s^2');
});


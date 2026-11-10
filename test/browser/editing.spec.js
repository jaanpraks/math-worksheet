import { test, expect } from '@playwright/test';

test('blank-page typing creates math, renders inline results, and enters the next line', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.math .result').first()).toBeHidden();
  await expect.poll(() => page.locator('.text textarea').first().evaluate(el=>el.clientHeight >= el.scrollHeight)).toBe(true);
  await page.locator('#canvas').click({ position: { x: 1020, y: 100 } });
  const equation = page.locator('.math').last();
  await expect(equation.locator('.expression')).toBeFocused();
  await page.keyboard.type('2+3=');
  await expect(equation.locator('output')).toContainText('5');
  await expect(equation.locator('.result')).toHaveJSProperty('value', '5');
  const expressionBox=await equation.locator('.expression').boundingBox();
  const resultBox=await equation.locator('.result').boundingBox();
  expect(Math.abs(expressionBox.y-resultBox.y)).toBeLessThan(8);
  expect(resultBox.x-expressionBox.x-expressionBox.width).toBeLessThan(8);
  expect(await equation.evaluate(el=>getComputedStyle(el).borderTopWidth)).toBe('0px');
  expect(await equation.locator('.result').evaluate(el=>getComputedStyle(el).fontSize)).toBe(await equation.locator('.expression').evaluate(el=>getComputedStyle(el).fontSize));
  const before=await page.locator('.math').count();
  await page.keyboard.press('Enter');
  await expect(page.locator('.math')).toHaveCount(before+1);
  await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('7*6=');
  await expect(page.locator('.math').last().locator('output')).toContainText('42');
});

test('an actual space converts writing into editable text and persists it', async ({ page }) => {
  await page.goto('/');
  await page.locator('#canvas').click({ position: { x: 1020, y: 100 } });
  await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('hello world');
  const note=page.locator('.text textarea').last();
  await expect(note).toHaveValue('hello world');
  await page.keyboard.type(' again');
  await expect(note).toHaveValue('hello world again');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Save JSON'}).click();
  const download=await downloadPromise;
  await page.reload(); await page.locator('#file').setInputFiles(await download.path());
  await expect(page.locator('.text textarea').last()).toHaveValue('hello world again');
});

test('pasted words become text while rendered math whitespace stays math', async ({ page }) => {
  await page.goto('/');
  await page.locator('#canvas').click({ position: { x: 1020, y: 100 } });
  const field=page.locator('.expression').last();
  await field.evaluate(el=>{
    const data=new DataTransfer(); data.setData('text/plain','orbital speed');
    el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  });
  await expect(page.locator('.text textarea').last()).toHaveValue('orbital speed');
  // The starter's '2pi sqrt(...)' ASCII export is still a math expression.
  await expect(page.locator('.math')).toHaveCount(4);
  await expect(page.locator('.math output').last()).toContainText('5544.855');
});

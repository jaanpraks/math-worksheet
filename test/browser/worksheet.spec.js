import { test, expect } from '@playwright/test';
test('edit, reorder, save/load, plot, and paste an independent image', async ({ page }) => {
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('.math output').nth(2)).toContainText('7672.598');
  const field=page.locator('math-field.expression').nth(1);
  await field.evaluate(el => { el.value='r=7000000'; el.dispatchEvent(new Event('input',{bubbles:true})); });
  await expect(page.locator('.math output').nth(2)).toContainText('7546.053');
  // Check native MathLive input events, including fraction/sqrt ASCII export.
  await field.evaluate(el => { el.value='r=\\frac{14000000}{2}'; el.dispatchEvent(new Event('input',{bubbles:true})); });
  await expect(page.locator('.math output').nth(2)).toContainText('7546.053');
  const region=page.locator('.math').nth(1); const handle=region.locator('.region-head > span');await handle.hover();
  const box=await handle.boundingBox();
  await page.mouse.move(box.x+8,box.y+10); await page.mouse.down(); await page.mouse.move(box.x+808,box.y+400,{steps:10}); await page.mouse.up();
  await expect(page.locator('.math output').nth(2)).toContainText('Undefined symbol r');
  const moved=await handle.boundingBox();
  await page.mouse.move(moved.x+8,moved.y+10); await page.mouse.down(); await page.mouse.move(box.x+8,box.y+10,{steps:10}); await page.mouse.up();
  await expect(page.locator('.math output').nth(2)).toContainText('7546.053');
  await page.evaluate(() => {
    const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='), c=>c.charCodeAt(0));
    const data=new DataTransfer(); data.items.add(new File([bytes],'pixel.png',{type:'image/png'}));
    document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  });
  await expect(page.locator('.image img')).toHaveCount(1);
  await expect(page.locator('.image img')).toHaveJSProperty('complete',true);
  const image=page.locator('.image'), before=await image.boundingBox(), grip=await image.locator('.corner-resize').boundingBox();
  await page.mouse.move(grip.x+8,grip.y+8); await page.mouse.down(); await page.mouse.move(grip.x+88,grip.y+58,{steps:5}); await page.mouse.up();
  expect((await image.boundingBox()).width).toBeGreaterThan(before.width+60);
  const downloadPromise=page.waitForEvent('download'); await page.getByRole('button',{name:'Save JSON'}).click();
  const download=await downloadPromise; const path=await download.path();
  await page.getByRole('button',{name:'Delete image region'}).click();
  await page.locator('#file').setInputFiles(path);
  await expect(page.locator('.image img')).toHaveCount(1);
  await expect(page.locator('.math output').nth(2)).toContainText('7546.053');
  await page.getByRole('button',{name:'Delete image region'}).click();
  await page.locator('.plot').hover();
  await page.getByLabel('Field properties',{exact:true}).click();
  await page.getByLabel('Plot series: function of x or X ; Y',{exact:true}).fill('[1,2,3] ; [4,2,6]\nx/1000000');
  await expect(page.locator('.plot output')).toBeEmpty();
  await page.waitForTimeout(300);
  expect(await page.locator('.plot canvas').evaluate(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(v=>v!==0))).toBe(true);
  await page.reload();
  await expect(page.locator('.math output').nth(2)).toContainText('7672.598');
  await page.screenshot({path:'test-results/worksheet-preview.png',fullPage:true});
  expect(errors).toEqual([]);
});



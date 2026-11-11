import {test,expect} from '@playwright/test';
test('information is a compact popup, persists, and supports Undo and hidden fields',async({page})=>{
  await page.goto('/');const region=page.locator('.math').first();await region.hover();await region.getByLabel('Field information',{exact:true}).click();const input=region.getByLabel('Field explanation',{exact:true});await expect(input).toBeVisible();await expect(input).toHaveValue('');await input.fill('Earth gravitational parameter, in SI units.');
  await page.keyboard.press('Control+z');await expect(input).toHaveValue('');await page.keyboard.press('Control+y');await expect(input).toHaveValue('Earth gravitational parameter, in SI units.');
  await region.getByLabel('Field information',{exact:true}).click();await region.getByRole('button',{name:'Hide field',exact:true}).click();await region.getByLabel('Hidden field label',{exact:true}).dblclick();await region.hover();await region.getByLabel('Field information',{exact:true}).click();await expect(input).toBeVisible();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;await page.reload();await page.locator('#file').setInputFiles(await download.path());await region.getByLabel('Field information',{exact:true}).click();await expect(input).toHaveValue('Earth gravitational parameter, in SI units.');
});
test('each area type has an information control',async({page})=>{
  await page.goto('/');await expect(page.locator('.field-info')).toHaveCount(await page.locator('.region').count());await page.getByRole('button',{name:'+ Section',exact:true}).click();await expect(page.locator('.section').getByLabel('Field information',{exact:true})).toBeVisible();
});


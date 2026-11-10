import {test,expect} from '@playwright/test';
test('hidden field labels edit directly, undo, and persist through reveal and save/load',async({page})=>{
  await page.goto('/');const region=page.locator('.math').first();await region.hover();await region.getByRole('button',{name:'Hide field',exact:true}).click();const label=region.getByLabel('Hidden field label',{exact:true});await expect(label).toHaveValue('Hidden math');await label.fill('Orbital constants');await page.keyboard.press('Control+z');await expect(label).toHaveValue('Hidden math');await page.keyboard.press('Control+y');await expect(label).toHaveValue('Orbital constants');
  await region.getByRole('button',{name:'Show field',exact:true}).click();await expect(label).toBeHidden();await region.getByRole('button',{name:'Hide field',exact:true}).click();await expect(label).toHaveValue('Orbital constants');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;await page.reload();await page.locator('#file').setInputFiles(await download.path());await expect(label).toHaveValue('Orbital constants');
});

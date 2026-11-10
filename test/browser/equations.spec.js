import {test,expect} from '@playwright/test';
async function load(page){
  await page.goto('/');const math=(id,source,y)=>({id,type:'math',source,latex:source,unitMode:'raw',x:150,y,width:380,height:150});
  await page.locator('#file').setInputFiles({name:'equations.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[math('definition','a=3',100),math('answer','a*2=',250)]}))});
}
test('only trailing equals displays answers, and removing it preserves downstream calculations',async({page})=>{
  await load(page);const definition=page.locator('[data-id="definition"]'),answer=page.locator('[data-id="answer"]');
  await expect(definition.locator('.result')).toBeHidden();await expect(definition.locator('output')).toBeEmpty();await expect(answer.locator('.result')).toHaveJSProperty('value','6');
  await definition.hover();await definition.getByLabel('Edit Math.js expression',{exact:true}).click();const raw=definition.getByLabel('Math.js expression',{exact:true});await raw.fill('a=4=');
  await expect(definition.locator('.result')).toBeVisible();await expect(definition.locator('.result')).toHaveJSProperty('value','4');await expect(answer.locator('output')).toContainText('8');
  await raw.fill('a=4');await expect(definition.locator('.result')).toBeHidden();await expect(answer.locator('output')).toContainText('8');
});
test('display-only formulas do not execute; mode persists and supports Undo',async({page})=>{
  await load(page);const definition=page.locator('[data-id="definition"]'),answer=page.locator('[data-id="answer"]');
  await definition.hover();await definition.getByLabel('Edit Math.js expression',{exact:true}).click();const mode=definition.getByLabel('Display only — do not evaluate',{exact:true});await mode.check();
  await expect(answer).toHaveClass(/has-error/);await page.keyboard.press('Control+z');await expect(mode).not.toBeChecked();await expect(answer).not.toHaveClass(/has-error/);
  await mode.check();await definition.getByLabel('Math.js expression',{exact:true}).fill('unknown(x)=');await expect(definition).not.toHaveClass(/has-error/);await expect(definition.locator('.result')).toBeHidden();
  await definition.getByLabel('Edit Math.js expression',{exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;
  await page.reload();await page.locator('#file').setInputFiles(await download.path());await expect(definition).not.toHaveClass(/has-error/);await definition.hover();await definition.getByLabel('Edit Math.js expression',{exact:true}).click();await expect(mode).toBeChecked();
});


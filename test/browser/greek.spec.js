import {test,expect} from '@playwright/test';
async function setup(page){await page.goto('/');await page.locator('#file').setInputFiles({name:'greek.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[{id:'greek',type:'math',x:100,y:100,width:380,height:150,source:'1',latex:'1'}]}))});await expect(page.locator('[data-id=greek]')).toHaveCount(1);return page.locator('.expression');}
test('Greek names commit on equals while longer names remain intact',async({page})=>{
  const field=await setup(page);
  for(const [source,symbol] of [['alpha=3',String.raw`\alpha`],['theta=4',String.raw`\theta`],['Delta=5',String.raw`\Delta`]]){
    await field.evaluate(el=>el.setValue('',{silenceNotifications:true}));await field.focus();await page.keyboard.type(source);await expect.poll(()=>field.evaluate(el=>el.value)).toContain(symbol);
  }
  await field.evaluate(el=>el.setValue('',{silenceNotifications:true}));await field.focus();await page.keyboard.type('eta_1');await page.keyboard.press('ArrowRight');await page.keyboard.type('=2');await expect.poll(()=>field.evaluate(el=>el.value)).toContain(String.raw`\eta`);
  await field.evaluate(el=>el.setValue('',{silenceNotifications:true}));await field.focus();await page.keyboard.type('thetaRate=3');expect(await field.evaluate(el=>el.value)).not.toContain(String.raw`\theta`);
  await page.locator('.math').hover();await page.getByLabel('Field properties',{exact:true}).click();await expect(page.getByLabel('Math.js expression',{exact:true})).toHaveValue('thetaRate=3');
});
test('Math.js Settings renders Greek names and edited notation saves and loads',async({page})=>{
  const field=await setup(page);await page.locator('.math').hover();await page.getByLabel('Field properties',{exact:true}).click();await page.getByLabel('Math.js expression',{exact:true}).fill('eta=3;xi=2;eta+xi=');await page.getByLabel('Math.js expression',{exact:true}).press('Control+Enter');await expect.poll(()=>field.evaluate(el=>el.value)).toContain(String.raw`\eta`);await expect.poll(()=>field.evaluate(el=>el.value)).toContain(String.raw`\xi`);await expect(page.locator('.math output')).toHaveText('= 5');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON',exact:true}).click();const saved=await pending;await page.reload();await page.locator('#file').setInputFiles(await saved.path());await expect(page.locator('.math output')).toHaveText('= 5');await expect.poll(()=>page.locator('.expression').evaluate(el=>el.value)).toContain(String.raw`\eta`);
});

import {test,expect} from '@playwright/test';
async function setup(page){
  const math=(id,source,y)=>({id,type:'math',source,latex:source,x:100,y,width:380,height:150});
  await page.goto('/');await page.locator('#file').setInputFiles({name:'commit.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[math('definition','a=2',100),math('dependent','a*3=',200),math('watch','random()=',300)]}))});await expect(page.locator('[data-id=dependent] output')).toHaveText('= 6');
}
test('typing ordinary values pauses evaluation until equals or leaving the editor',async({page})=>{
  await setup(page);const field=page.locator('[data-id=definition] .expression'),watch=page.locator('[data-id=watch] output');await field.focus();await field.evaluate(el=>{el.position=el.lastOffset;});const before=await watch.textContent();await page.keyboard.type('7');await page.waitForTimeout(250);await expect(watch).toHaveText(before);await expect(page.locator('[data-id=dependent] output')).toHaveText('= 6');
  await page.keyboard.type('=');await expect(page.locator('[data-id=dependent] output')).toHaveText('= 81');expect(await watch.textContent()).not.toBe(before);
  await field.evaluate(el=>{el.setValue('a=4',{silenceNotifications:true});el.dispatchEvent(new Event('input',{bubbles:true}));});const current=await watch.textContent();await page.waitForTimeout(200);await expect(watch).toHaveText(current);await field.blur();await expect(page.locator('[data-id=dependent] output')).toHaveText('= 12');
});
test('closing brackets and Enter commit the current calculation',async({page})=>{
  await setup(page);const field=page.locator('[data-id=definition] .expression');await field.focus();await field.evaluate(el=>{el.setValue(String.raw`a=\sqrt{16}`,{silenceNotifications:true});el.dispatchEvent(new Event('input',{bubbles:true}));});await field.dispatchEvent('keyup',{key:')'});await expect(page.locator('[data-id=dependent] output')).toHaveText('= 12');
  await page.locator('[data-id=definition]').hover();await page.locator('[data-id=definition]').getByLabel('Field properties',{exact:true}).click();const raw=page.getByLabel('Math.js expression',{exact:true}).first();await raw.fill('a=8');await expect(page.locator('[data-id=dependent] output')).toHaveText('= 12');await raw.press('Control+Enter');await expect(page.locator('[data-id=dependent] output')).toHaveText('= 24');
});
test('Space remains available for plain words but cannot convert committed equations to notes',async({page})=>{
  await setup(page);const field=page.locator('[data-id=definition] .expression');await field.focus();await field.evaluate(el=>{el.position=el.lastOffset;});await page.keyboard.press('Space');await expect(page.locator('[data-id=definition]')).toHaveClass(/math/);expect(await field.evaluate(el=>el.value)).toContain('\\;');
  await page.getByRole('button',{name:'+ Math',exact:true}).click();const added=page.locator('.expression').last();await expect(added).toBeFocused();await page.keyboard.press('Space');await expect(page.locator('.text').last().getByLabel('Note',{exact:true})).toBeFocused();await page.keyboard.type('word ');await expect(page.locator('.text').last().getByLabel('Note',{exact:true})).toHaveValue('word ');
});

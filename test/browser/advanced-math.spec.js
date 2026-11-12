import {test,expect} from '@playwright/test';
async function setup(page){
  await page.goto('/');await page.locator('#file').setInputFiles({name:'math.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[{id:'math',type:'math',x:100,y:100,width:380,height:150,source:'1',latex:'1',unitMode:'explicit'}]}))});await expect(page.locator('.region')).toHaveCount(1);await expect(page.locator('.math')).toHaveAttribute('data-id','math');return page.locator('.expression');
}
test('advanced visual operators calculate and survive Save/Load',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));const field=await setup(page);
  for(const [latex,answer] of [[String.raw`\log_2(8)`,3],[String.raw`\ln(1)`,0],[String.raw`\sqrt[3]{27}`,3],[String.raw`\lvert 3+4i\rvert`,5],[String.raw`\Re(3+4i)`,3],[String.raw`\Im(3+4i)`,4],[String.raw`\sum_{k=1}^{3}\left(k^2\right)`,14],[String.raw`\prod_{k=1}^{4}\left(k\right)`,24]]){
    await field.evaluate((el,latex)=>{el.setValue(latex+'=',{silenceNotifications:true});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new KeyboardEvent('keyup',{key:'=',bubbles:true}));},latex);
    await expect(page.locator('.math output')).toHaveText(`= ${answer}`);
  }
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON',exact:true}).click();const file=await pending;await page.reload();await page.locator('#file').setInputFiles(await file.path());await expect(page.locator('.math output')).toHaveText('= 24');expect(errors).toEqual([]);
});
test('simplified MathLive menu retains editing and supported insertion tools',async({page})=>{
  const field=await setup(page);const ids=await field.evaluate(el=>{const visit=items=>items.flatMap(item=>[item.id,...(Array.isArray(item.submenu)?visit(item.submenu):[])]).filter(Boolean);return visit(el.menuItems);});
  for(const id of ['copy','copy-latex','paste','mode-latex','insert-matrix','insert-sum','insert-product','insert-abs','insert-nth-root','insert-log-base','insert-modulus','insert-real-part','insert-imaginary-part'])expect(ids).toContain(id);
  for(const id of ['variant','color','background-color','decoration','insert-integral','insert-derivative','insert-nth-derivative'])expect(ids).not.toContain(id);
});
test('abs, re, im and modulo can be typed directly without the insert menu',async({page})=>{
  const field=await setup(page);
  for(const [source,answer] of [['abs(-3)=',3],['abs(3+4i)=',5],['re(3+4i)=',3],['im(3+4i)=',4],['mod(17,5)=',2]]){
    await field.evaluate(el=>el.setValue('',{silenceNotifications:true}));await field.focus();await page.keyboard.type(source);await expect(page.locator('.math output')).toHaveText(`= ${answer}`);
  }
});
test('sum menu template supports typing through the index, bounds and body',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));const field=await setup(page);
  await field.evaluate(el=>{el.setValue('',{silenceNotifications:true});el.menuItems.find(item=>item.id==='insert').submenu.find(item=>item.id==='insert-sum').onMenuSelect();});await expect(field).toBeFocused();
  for(const text of ['k','1','3','k^2']){await page.keyboard.type(text);if(text!=='k^2')await page.keyboard.press('Tab');}
  await field.evaluate(el=>{el.position=el.lastOffset;});await page.keyboard.type('=');await expect(page.locator('.math output')).toHaveText('= 14');expect(errors).toEqual([]);
});
test('typing map opens vector and function placeholders and keeps Math.js source syntax',async({page})=>{
  const field=await setup(page);await field.evaluate(el=>el.setValue('',{silenceNotifications:true}));await field.focus();await page.keyboard.type('map');await page.keyboard.press('Tab');await expect.poll(()=>field.evaluate(el=>el.value)).toContain('\\overrightarrow');
  await page.keyboard.type('sqrt');await page.keyboard.press('Tab');await page.keyboard.type('[1,4,9]');await field.evaluate(el=>{el.position=el.lastOffset;});await page.keyboard.type('=');await expect(page.locator('.math output')).toHaveText('= [1, 2, 3]');
  await page.locator('.math').hover();await page.getByLabel('Field properties',{exact:true}).click();await expect(page.getByLabel('Math.js expression',{exact:true})).toHaveValue('map([1,4,9],sqrt)=');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON',exact:true}).click();const saved=await pending;await page.reload();await page.locator('#file').setInputFiles(await saved.path());await expect(page.locator('.math output')).toHaveText('= [1, 2, 3]');await expect.poll(()=>page.locator('.expression').evaluate(el=>el.value)).toContain('worksheet-function=1');
});
test('function names are not expanded prematurely and completed calls become graphical',async({page})=>{
  const field=await setup(page);await field.evaluate(el=>el.setValue('',{silenceNotifications:true}));await field.focus();await page.keyboard.type('sinc(x)=sin(x)/x');
  expect(await field.evaluate(el=>el.value)).not.toMatch(/\\sin\s*c/);
  await page.locator('.math').hover();await page.getByLabel('Field properties',{exact:true}).click();await expect(page.getByLabel('Math.js expression',{exact:true})).toHaveValue('sinc(x)=(sin(x))/(x)');await page.getByLabel('Field properties',{exact:true}).click();
  for(const [source,answer,notation] of [['abs(-3)=','= 3',String.raw`\left|`],['map([1,4,9],sqrt)=','= [1, 2, 3]',String.raw`\overrightarrow`]]){
    await field.evaluate(el=>el.setValue('',{silenceNotifications:true}));await field.focus();await page.keyboard.type(source);await expect(page.locator('.math output')).toHaveText(answer);expect(await field.evaluate(el=>el.value)).toContain(notation);
  }
});
test('a seeded first character still permits real-part function typing',async({page})=>{
  const field=await setup(page);await field.evaluate(el=>el.setValue('r',{silenceNotifications:true}));await field.focus();await field.evaluate(el=>{el.position=el.lastOffset;});await page.keyboard.type('e(3+4i)=');await expect(page.locator('.math output')).toHaveText('= 3');await expect.poll(()=>field.evaluate(el=>el.value)).toContain('\\Re');
});
test('incomplete operators show recoverable errors without browser exceptions',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));const field=await setup(page);
  await field.evaluate(el=>{el.setValue(String.raw`\sum_{k}^{3}k`,{silenceNotifications:true});el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new KeyboardEvent('keyup',{key:'=',bubbles:true}));});await expect(page.locator('.math output')).toContainText('index definition');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON',exact:true}).click();const file=await pending;await page.reload();await page.locator('#file').setInputFiles(await file.path());await expect(page.locator('.math')).toHaveCount(1);await expect(page.locator('.math output')).toContainText('index definition');
  await page.locator('.math').hover();await page.getByLabel('Field properties',{exact:true}).click();await page.getByLabel('Math.js expression',{exact:true}).fill('sumOver(k,k,1,3)=');await page.getByLabel('Math.js expression',{exact:true}).press('Control+Enter');await expect(page.locator('.math output')).toHaveText('= 6');expect(errors).toEqual([]);
});

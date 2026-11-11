import {test,expect} from '@playwright/test';
async function blank(page){
  await page.goto('/');await page.locator('#file').setInputFiles({name:'empty.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[]}))});
}
test('new toolbar fields start at the last worksheet pointer position',async({page})=>{
  await blank(page);
  for(const type of ['Math','Text','Plot','Slider','Options']){
    const canvas=await page.locator('#canvas').boundingBox();await page.mouse.move(canvas.x+500,canvas.y+350);
    await page.getByRole('button',{name:`+ ${type}`,exact:true}).click();
    const field=page.locator('.region').last();await expect(field).toHaveCSS('left','500px');await expect(field).toHaveCSS('top','350px');
  }
});
test('capital-letter identifiers stay contiguous and calculate after typing',async({page})=>{
  await blank(page);await page.getByRole('button',{name:'+ Math',exact:true}).click();
  const field=page.locator('.math');await field.locator('.expression').focus();await page.keyboard.type('ABC=12');
  await field.hover();await field.getByLabel('Field properties',{exact:true}).click();
  await expect(field.getByLabel('Math.js expression',{exact:true})).toHaveValue('ABC=12');
  await field.getByLabel('Field properties',{exact:true}).click();await field.locator('.expression').focus();await field.locator('.expression').evaluate(el=>{el.position=el.lastOffset;});await page.keyboard.press('Enter');await expect(page.locator('.expression').last()).toBeFocused();await page.keyboard.type('ABC+1=');
  await expect(page.locator('.math').last().locator('output')).toHaveText('= 13');
});
test('an unlabeled minimized field reveals its handles on hover and restores with its button',async({page})=>{
  await blank(page);await page.getByRole('button',{name:'+ Math',exact:true}).click();const field=page.locator('.math');await field.locator('.expression').focus();await page.keyboard.type('a=2');await field.hover();await field.getByRole('button',{name:'Hide field',exact:true}).click();
  await expect(field.getByLabel('Hidden field label',{exact:true})).toHaveValue('Equation');await field.getByLabel('Hidden field label',{exact:true}).fill('');
  await page.mouse.move(900,600);await page.locator('#canvas').focus();
  await expect(field.locator('.region-head')).toHaveCSS('opacity','0');await expect(field.locator('.move-handle')).toHaveCSS('opacity','0');
  await page.locator('#canvas').focus();await page.keyboard.press('Control+a');await expect(field).toHaveClass(/selected/);
  await field.hover();await expect(field.locator('.region-head')).toHaveCSS('opacity','1');await expect(field.locator('.move-handle')).toHaveCSS('opacity','1');
  await field.getByRole('button',{name:'Show field',exact:true}).click();await expect(field.locator('.expression')).toBeVisible();
});
test('dragging a field edge moves it without editing its content',async({page})=>{
  await blank(page);await page.getByRole('button',{name:'+ Math',exact:true}).click();const field=page.locator('.math');await field.locator('.expression').focus();await page.keyboard.type('a=2');
  const before=await field.boundingBox(),edge=await field.locator('.move-edge-top').boundingBox();await page.mouse.move(edge.x+edge.width/2,edge.y+2);await page.mouse.down();await page.mouse.move(edge.x+edge.width/2+50,edge.y+32,{steps:5});await page.mouse.up();
  const after=await field.boundingBox();expect(after.x).toBe(before.x+50);expect(after.y).toBe(before.y+30);expect(await field.locator('.expression').evaluate(el=>el.value)).toBe('a=2');
});
test('section insertion uses the pointer after an old caret position was left behind',async({page})=>{
  await blank(page);await page.getByRole('button',{name:'+ Math',exact:true}).click();await expect(page.locator('.expression')).toBeFocused();await page.keyboard.press('Backspace');
  const canvas=await page.locator('#canvas').boundingBox();await page.mouse.move(canvas.x+550,canvas.y+400);await page.getByRole('button',{name:'+ Section',exact:true}).click();await expect(page.locator('.section')).toHaveCSS('top','400px');
});
test('text has padding and a blinking caret alone does not show handles',async({page})=>{
  await blank(page);await page.getByRole('button',{name:'+ Text',exact:true}).click();const field=page.locator('.text');await field.getByLabel('Note',{exact:true}).fill('A padded note');await page.mouse.move(900,600);
  await expect(field.locator('.region-body')).toHaveCSS('padding','6px 8px');await expect(field.locator('.move-handle')).toHaveCSS('opacity','0');await expect(field.locator('.region-head')).toHaveCSS('opacity','0');await expect(field.locator('.corner-resize')).toHaveCSS('opacity','0');
  await field.hover();await expect(field.locator('.move-handle')).toHaveCSS('opacity','1');
});



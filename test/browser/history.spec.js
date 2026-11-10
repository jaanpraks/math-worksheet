import {test,expect} from '@playwright/test';
const regions=[{id:'note',type:'text',x:150,y:100,width:300,height:120,text:'Before'},{id:'eq',type:'math',x:500,y:200,width:380,height:150,source:'2+3',latex:'2+3'}];
async function load(page){await page.goto('/');await page.locator('#file').setInputFiles({name:'history.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions}))});}
test('Undo and Redo restore edits through toolbar and keyboard',async({page})=>{
  await load(page);await page.locator('.note-preview').click();await page.locator('.text textarea').fill('After');
  await page.keyboard.press('Control+z');await expect(page.locator('.text textarea')).toHaveValue('Before');
  await page.keyboard.press('Control+Shift+z');await expect(page.locator('.text textarea')).toHaveValue('After');
  await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('.text textarea')).toHaveValue('Before');
  await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.locator('.text textarea')).toHaveValue('After');
});
test('a group drag undoes as one command, and deletion can be undone and redone',async({page})=>{
  await load(page);await page.locator('.text').click({modifiers:['Control']});await page.locator('.math').click({modifiers:['Control']});
  const handle=await page.locator('.math .region-head').boundingBox();await page.mouse.move(handle.x+8,handle.y+10);await page.mouse.down();await page.mouse.move(handle.x+98,handle.y+60,{steps:12});await page.mouse.up();
  expect(await page.locator('.math').evaluate(el=>parseFloat(el.style.left))).toBe(590);
  await page.keyboard.press('Control+z');expect(await page.locator('.math').evaluate(el=>parseFloat(el.style.left))).toBe(500);expect(await page.locator('.text').evaluate(el=>parseFloat(el.style.left))).toBe(150);
  await page.keyboard.press('Control+y');expect(await page.locator('.math').evaluate(el=>parseFloat(el.style.left))).toBe(590);
  await page.keyboard.press('Control+a');await page.keyboard.press('Delete');await expect(page.locator('.region')).toHaveCount(0);
  await page.keyboard.press('Control+z');await expect(page.locator('.region')).toHaveCount(2);await page.keyboard.press('Control+y');await expect(page.locator('.region')).toHaveCount(0);
});
test('history starts with no undo command and a new edit after undo clears redo',async({page})=>{
  await page.goto('/');await expect(page.getByRole('button',{name:'Undo',exact:true})).toBeDisabled();
  await load(page);await page.locator('.note-preview').click();await page.locator('.text textarea').fill('First edit');await page.keyboard.press('Control+z');
  await page.locator('.text textarea').fill('Different edit');await expect(page.getByRole('button',{name:'Redo',exact:true})).toBeDisabled();
});

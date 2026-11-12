import {test,expect} from '@playwright/test';
async function paste(locator,text) {
  await locator.evaluate((el,text)=>{const data=new DataTransfer();data.setData('text/plain',text);el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},text);
}
test('empty fields disappear on leaving or Escape but a new active field stays available',async({page})=>{
  await page.goto('/');const count=await page.locator('.region').count();
  await page.locator('#canvas').click({position:{x:1050,y:600}});await expect(page.locator('.region')).toHaveCount(count+1);
  await expect(page.locator('.expression').last()).toBeFocused();await page.getByRole('button',{name:'Save JSON'}).focus();
  await expect(page.locator('.region')).toHaveCount(count);
  await page.getByRole('button',{name:'+ Text',exact:true}).click();await expect(page.locator('.text textarea').last()).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.locator('.region')).toHaveCount(count);
  await page.getByRole('button',{name:'+ Text',exact:true}).click();const field=page.locator('.text').last();
  await field.locator('textarea').fill('delete me');await field.locator('textarea').fill('');
  await page.getByRole('button',{name:'Save JSON'}).focus();await expect(page.locator('.region')).toHaveCount(count);
});
test('text paste creates a note on paper, fills an empty field, and replaces a selected text range',async({page})=>{
  await page.goto('/');await page.locator('#canvas').focus();
  const before=await page.locator('.text').count();await paste(page.locator('#canvas'),'Pasted **text**');
  await expect(page.locator('.text')).toHaveCount(before+1);const editor=page.locator('.text textarea').last();await expect(editor).toHaveValue('Pasted **text**');
  await editor.evaluate(el=>el.setSelectionRange(0,6));await paste(editor,'Inserted');await expect(editor).toHaveValue('Inserted **text**');
  await page.locator('#canvas').click({position:{x:1050,y:600}});const count=await page.locator('.region').count();
  await paste(page.locator('.expression').last(),'singleword');
  await expect(page.locator('.region')).toHaveCount(count);await expect(page.locator('.text textarea').last()).toHaveValue('singleword');
  await page.keyboard.press('Escape');await page.locator('.text .note-preview').last().focus();
  await paste(page.locator('.text .note-preview').last(),' plus');await expect(page.locator('.text textarea').last()).toHaveValue('singleword plus');
});
test('image paste into an empty field replaces the placeholder with a separate image',async({page})=>{
  await page.goto('/');const count=await page.locator('.region').count(),images=await page.locator('.image').count();
  await page.locator('#canvas').click({position:{x:1050,y:600}});
  await page.locator('.expression').last().evaluate(el=>{
    const bytes=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='),c=>c.charCodeAt(0));
    const data=new DataTransfer();data.items.add(new File([bytes],'pixel.png',{type:'image/png'}));
    el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  });
  await expect(page.locator('.image')).toHaveCount(images+1);await expect(page.locator('.region')).toHaveCount(count+1);
  expect(await page.locator('.image').last().evaluate(el=>[parseFloat(el.style.left),parseFloat(el.style.top)])).toEqual([1050,600]);
});
test('Control-A selects all fields and Delete removes the selection together',async({page})=>{
  await page.goto('/');const count=await page.locator('.region').count();
  await page.keyboard.press('Control+a');await expect(page.locator('.selected')).toHaveCount(count);await page.keyboard.press('Escape');
  await page.locator('.expression').first().focus();await page.keyboard.press('Control+a');
  await expect(page.locator('.selected')).toHaveCount(count);await page.keyboard.press('Delete');await expect(page.locator('.region')).toHaveCount(0);
  await paste(page.locator('#canvas'),'A fresh worksheet');await expect(page.locator('.text textarea')).toHaveValue('A fresh worksheet');
});

test('pasting into a committed equation keeps it in math mode',async({page})=>{
  await page.goto('/');await page.locator('#canvas').click({position:{x:1050,y:600}});
  const field=page.locator('.expression').last();await expect(field).toBeFocused();await page.keyboard.type('2+3');
  await field.evaluate(el=>{el.position=1;});
  await paste(field,' apples ');
  await expect(field).toBeFocused();expect(await field.evaluate(el=>el.value)).toContain('apples');await expect(page.locator('.math').last()).toHaveClass(/math/);
});

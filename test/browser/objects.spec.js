import {test,expect} from '@playwright/test';
const r=(id,type,x,y,content)=>({id,type,x,y,width:300,height:120,...content});
async function load(page,regions) {
  await page.goto('/');await page.locator('#file').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions}))});
}
const geometry=locator=>locator.evaluate(el=>({x:parseFloat(el.style.left),y:parseFloat(el.style.top)}));
test('corner resizing sets a note’s width and height and preserves them on load',async({page})=>{
  await load(page,[r('a','text',150,120,{text:'**A note**'})]);
  const note=page.locator('.text');await note.hover();const box=await note.boundingBox(),corner=await note.locator('.corner-resize').boundingBox();
  await page.mouse.move(corner.x+7,corner.y+7);await page.mouse.down();await page.mouse.move(corner.x+127,corner.y+87,{steps:8});await page.mouse.up();
  const after=await note.boundingBox();expect(after.width).toBeCloseTo(box.width+120,0);expect(after.height).toBeCloseTo(box.height+80,0);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;
  await page.reload();await page.locator('#file').setInputFiles(await download.path());
  const restored=page.locator('[data-id="a"]');await expect(restored).toBeVisible();
  expect((await restored.boundingBox()).height).toBeCloseTo(after.height,0);
});
test('Ctrl-click and a marquee select multiple objects; dragging moves the group',async({page})=>{
  await load(page,[r('a','math',150,100,{latex:'a=2',source:'a=2'}),r('b','text',350,180,{text:'A note'}),r('c','math',700,300,{latex:'q+1=',source:'q+1='})]);
  const a=page.locator('[data-id="a"]'),b=page.locator('[data-id="b"]'),c=page.locator('[data-id="c"]');
  await a.click({modifiers:['Control']});await b.click({modifiers:['Control']});
  await expect(page.locator('.selected')).toHaveCount(2);
  const first=await geometry(a),second=await geometry(b),other=await geometry(c),handle=await a.locator('.move-handle').boundingBox();
  await page.mouse.move(handle.x+8,handle.y+10);await page.mouse.down();await page.mouse.move(handle.x+88,handle.y+70,{steps:8});await page.mouse.up();
  expect(await geometry(a)).toEqual({x:first.x+80,y:first.y+60});expect(await geometry(b)).toEqual({x:second.x+80,y:second.y+60});expect(await geometry(c)).toEqual(other);
  await page.keyboard.press('Escape');await expect(page.locator('.selected')).toHaveCount(0);
  const count=await page.locator('.region').count(),canvas=await page.locator('#canvas').boundingBox();
  await page.mouse.move(canvas.x+120,canvas.y+120);await page.mouse.down();await page.mouse.move(canvas.x+600,canvas.y+280,{steps:8});await page.mouse.up();
  await expect(page.locator('.selected')).toHaveCount(2);await expect(page.locator('.region')).toHaveCount(count);
  await page.screenshot({path:'test-results/object-tools.png'});
});
test('Enter opens space for a definition and errors keep their red outline when not hovered',async({page})=>{
  await load(page,[r('a','math',150,100,{latex:'a=2',source:'a=2'}),r('b','math',500,100,{latex:'a+1',source:'a+1'}),r('c','math',150,250,{latex:'q+1=',source:'q+1='})]);
  const a=page.locator('[data-id="a"]'),b=page.locator('[data-id="b"]'),c=page.locator('[data-id="c"]');
  await expect(c).toHaveClass(/has-error/);await page.mouse.move(20,20);
  expect(await c.evaluate(el=>getComputedStyle(el).outlineColor)).toBe('rgba(211, 107, 107, 0.533)');
  await a.locator('.expression').focus();await page.keyboard.press('Enter');
  const inserted=await geometry(page.locator('.math').last()),shift=inserted.y-100;
  expect(shift).toBeGreaterThanOrEqual(38);
  expect(await geometry(a)).toEqual({x:150,y:100});expect(await geometry(b)).toEqual({x:500,y:100+shift});expect(await geometry(c)).toEqual({x:150,y:250+shift});
  await expect(page.locator('.expression').last()).toBeFocused();await page.keyboard.type('q=4');
  await expect(c).not.toHaveClass(/has-error/);await expect(c.locator('output')).toContainText('5');
});

test('Enter on a selected note inserts a definition after it, while Markdown keeps newlines',async({page})=>{
  await load(page,[r('a','text',150,100,{text:'A note'}),r('b','math',150,250,{latex:'2+2',source:'2+2'})]);
  await page.locator('[data-id="a"]').click({modifiers:['Control']});await page.keyboard.press('Enter');
  await expect(page.locator('.math')).toHaveCount(2);await expect(page.locator('.expression').last()).toBeFocused();
  expect((await geometry(page.locator('[data-id="b"]'))).y).toBeGreaterThan(250);
  await page.locator('[data-id="a"] .note-preview').click();
  await page.keyboard.press('Enter');await page.keyboard.type('Second line');
  await expect(page.locator('[data-id="a"] textarea')).toHaveValue('A note\nSecond line');
});



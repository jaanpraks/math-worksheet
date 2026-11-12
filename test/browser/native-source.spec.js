import {test,expect} from '@playwright/test';
async function load(page,source='a=2\na*3',mode='source'){
 await page.goto('/');await page.locator('#file').setInputFiles({name:'native.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[{id:'native',type:'math',source,latex:'a=2',displayMode:mode,unitMode:'raw',x:100,y:100,width:380,height:150}]}))});
}
test('native source evaluates multiline text, pauses edits and commits with Ctrl+Enter',async({page})=>{
 await load(page);const editor=page.getByLabel('Math.js source',{exact:true}),out=page.locator('[data-id=native] output');await expect(out).toHaveText('→ 6');await editor.fill('a=4\na*3');await expect(out).toHaveText('');await expect(page.locator('.source-pending')).toBeVisible();await editor.press('Control+Enter');await expect(out).toHaveText('→ 12');await editor.press('Control+a');await editor.press('End');await editor.press('Enter');await expect(editor).toHaveValue('a=4\na*3\n');await expect(page.locator('.region.selected')).toHaveCount(0);
});
test('switching modes does not append graphical results and refuses a lossy conversion',async({page})=>{
 await load(page,'2+3');await page.locator('[data-id=native]').hover();await page.getByLabel('Field properties',{exact:true}).click();await page.getByRole('checkbox',{name:'Native Math.js',exact:true}).uncheck();await expect(page.locator('.expression')).toBeVisible();await expect(page.locator('[data-id=native] output')).toBeEmpty();
 await load(page,'x>0 ? x : -x');await page.locator('[data-id=native]').hover();await page.getByLabel('Field properties',{exact:true}).click();await page.getByRole('checkbox',{name:'Native Math.js',exact:true}).click();await expect(page.getByRole('checkbox',{name:'Native Math.js',exact:true})).toBeChecked();await expect(page.getByLabel('Math.js source',{exact:true})).toHaveValue('x>0 ? x : -x');
});
test('leading Space starts a note; later spaces stay in an equation',async({page})=>{
 await load(page,'2','math');await page.getByRole('button',{name:'+ Math',exact:true}).click();await expect(page.locator('.expression').last()).toBeFocused();await page.keyboard.press('Space');await expect(page.locator('.text').last().getByLabel('Note',{exact:true})).toBeFocused();await expect(page.locator('.text').last()).toHaveCSS('outline-color','rgb(171, 194, 201)');await page.keyboard.type('hello world');await expect(page.locator('.text').last().getByLabel('Note',{exact:true})).toHaveValue('hello world');
 await page.getByRole('button',{name:'+ Math',exact:true}).click();await page.keyboard.type('sinc x');await expect(page.locator('.expression').last()).toBeVisible();
});
test('native source size, exact text and display mode survive save/load',async({page})=>{
 const source='a=2\nlabel="hello world"\n# comment\na*3';await load(page,source);const editor=page.getByLabel('Math.js source',{exact:true});await editor.evaluate(el=>{el.style.width='520px';el.style.height='170px';});await expect.poll(()=>editor.evaluate(el=>el.offsetWidth)).toBe(520);await page.waitForTimeout(100);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON',exact:true}).click();const file=await download;await page.reload();await page.locator('#file').setInputFiles(await file.path());await expect(editor).toHaveValue(source);await expect(page.locator('[data-id=native] output')).toHaveText('→ 6');expect(await editor.evaluate(el=>el.offsetWidth)).toBe(520);
});
test('settings stays fixed while source grows and resizes independently',async({page})=>{
 await load(page,'2','math');await page.locator('[data-id=native]').hover();await page.getByLabel('Field properties',{exact:true}).click();const panel=page.locator('.tabbed-properties');await expect(panel).toBeVisible();const before=await panel.boundingBox();const raw=page.getByLabel('Math.js expression',{exact:true});await raw.fill('reallyLongVariableName'.repeat(8)+'=2');await raw.press('Control+Enter');const after=await panel.boundingBox();expect(Math.abs(before.x-after.x)).toBeLessThan(2);expect(Math.abs(before.y-after.y)).toBeLessThan(2);await panel.evaluate(el=>{el.style.width='480px';el.style.height='420px';});await expect.poll(()=>panel.evaluate(el=>el.offsetWidth)).toBe(480);await page.screenshot({path:'test-results/native-settings.png'});
});
test('typed graphical boolean keywords remain separated and calculate',async({page})=>{
 await load(page,'2','math');const field=page.locator('.expression');await field.evaluate(el=>el.setValue('',{silenceNotifications:true}));await field.focus();await page.keyboard.type('1 xor 0=');await expect(page.locator('[data-id=native] output')).toHaveText('= true');
});
test('native result is separate and collapses large vectors',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);await load(page,'1:20');const out=page.locator('[data-id=native] output');await expect(out).toHaveText('→ […]');await expect(page.getByRole('button',{name:'Copy result',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Show 20 values',exact:true}).click();await expect(out).toContainText('19, 20');await expect(page.getByLabel('Math.js source',{exact:true})).toHaveValue('1:20');await page.screenshot({path:'test-results/native-source.png'});
});

test('native single lines fit text, allow a one-line manual size and use field background',async({page})=>{
 await load(page,'2+3');const editor=page.getByLabel('Math.js source',{exact:true});expect((await editor.boundingBox()).height).toBe(34);expect((await editor.boundingBox()).width).toBeLessThan(100);await editor.fill('longVariableName=123');expect((await editor.boundingBox()).width).toBeGreaterThan(180);await editor.evaluate(el=>{el.style.width='300px';el.style.height='34px';});await expect.poll(()=>editor.evaluate(el=>el.offsetWidth)).toBe(300);await page.locator('[data-id=native]').hover();await page.getByLabel('Field properties',{exact:true}).click();await page.getByRole('tab',{name:'Colors',exact:true}).click();await page.getByLabel('Background color',{exact:true}).fill('#ffeeaa');await expect(editor).toHaveCSS('background-color','rgb(255, 238, 170)');
});

test('native answer visibility persists and definitions never acquire a graphical answer',async({page})=>{
 await load(page,'a=3');await page.locator('[data-id=native]').hover();await page.getByLabel('Field properties',{exact:true}).click();const show=page.getByRole('checkbox',{name:'Show Math.js result',exact:true});await show.uncheck();await expect(page.locator('[data-id=native] output')).toBeEmpty();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON',exact:true}).click();const file=await download;await page.reload();await page.locator('#file').setInputFiles(await file.path());await expect(page.locator('[data-id=native] output')).toBeEmpty();await page.locator('[data-id=native]').hover();await page.getByLabel('Field properties',{exact:true}).click();await expect(show).not.toBeChecked();await show.check();await expect(page.locator('[data-id=native] output')).toHaveText('→ 3');await page.getByRole('checkbox',{name:'Native Math.js',exact:true}).uncheck();await expect(page.locator('[data-id=native] output')).toBeEmpty();await expect(page.locator('.result')).toBeHidden();
});

test('all equation checkboxes follow source input and guidance lives in Help',async({page})=>{
 await load(page,'2','math');await page.locator('[data-id=native]').hover();await page.getByLabel('Field properties',{exact:true}).click();const panel=page.getByRole('tabpanel',{name:'Settings',exact:true});const source=await panel.getByLabel('Math.js expression',{exact:true}).boundingBox();for(const box of await panel.getByRole('checkbox').all()){expect((await box.boundingBox()).y).toBeGreaterThan(source.y+source.height);}
 await expect(page.getByRole('checkbox',{name:'Show Math.js result',exact:true})).toBeDisabled();await expect(panel).not.toContainText('closing bracket');await page.getByRole('tab',{name:'Help',exact:true}).click();await expect(page.getByRole('tabpanel',{name:'Help',exact:true})).toContainText('Ctrl/Cmd+Enter');
});
test('open menus retain coordinates through checkboxes, mode rebuilds and tab changes',async({page})=>{
 await load(page,'a=3','math');await page.locator('[data-id=native]').hover();await page.getByLabel('Field properties',{exact:true}).click();const panel=page.locator('.tabbed-properties');const before=await panel.boundingBox();
 for(const name of ['Native Math.js','Show Math.js result','Show long vector/matrix results','Display only — do not evaluate']){await page.getByRole('checkbox',{name,exact:true}).click();const box=await panel.boundingBox();expect(box.x).toBeCloseTo(before.x,1);expect(box.y).toBeCloseTo(before.y,1);}
 await page.getByRole('checkbox',{name:'Native Math.js',exact:true}).uncheck();expect((await panel.boundingBox()).x).toBeCloseTo(before.x,1);expect((await panel.boundingBox()).y).toBeCloseTo(before.y,1);
 for(const tab of ['Colors','Help','Settings']){await page.getByRole('tab',{name:tab,exact:true}).click();expect((await panel.boundingBox()).x).toBeCloseTo(before.x,1);expect((await panel.boundingBox()).y).toBeCloseTo(before.y,1);}
});

import {test,expect} from '@playwright/test';
async function setup(page,source='2+3='){
 await page.goto('/');await page.locator('#file').setInputFiles({name:'translation.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[{id:'math',type:'math',x:100,y:100,width:380,height:150,source,latex:source,unitMode:'raw'}]}))});return page.locator('.expression');
}
async function graphical(field,latex,commit=false){await field.evaluate((el,{latex,commit})=>{el.setValue(latex,{silenceNotifications:true});el.dispatchEvent(new Event('input',{bubbles:true}));if(commit)el.dispatchEvent(new KeyboardEvent('keyup',{key:'=',bubbles:true}));},{latex,commit});}
async function open(page){await page.locator('.math').hover();await page.getByLabel('Field properties',{exact:true}).click();return page.getByLabel('Math.js expression',{exact:true});}
test('typing does not rewrite the editor or inject source spaces; identifiers can be edited in place',async({page})=>{
 const field=await setup(page);await graphical(field,'');await field.focus();const raw=page.getByLabel('Math.js expression',{exact:true});await page.keyboard.type('sinc');await expect(raw).toHaveValue('sinc');expect(await field.evaluate(el=>el.value)).not.toContain('\\sin');await page.keyboard.press('ArrowLeft');await page.keyboard.type('X');await expect(raw).toHaveValue('sinXc');await page.keyboard.press('ArrowRight');await page.keyboard.type('(x)=sin(x)/x');await expect(raw).toHaveValue('sinXc(x)=(sin(x))/(x)');await page.waitForTimeout(150);await expect(raw).toHaveValue('sinXc(x)=(sin(x))/(x)');
});
test('native source text stays authoritative through display changes, focus and delayed input',async({page})=>{
 const field=await setup(page);const raw=await open(page);for(const source of ['label = "two  spaces"; label','a==3','unit("m")','fft(','x>0 ? x : -x']){await raw.fill(source);await field.focus();await field.blur();await field.dispatchEvent('input');await expect(raw).toHaveValue(source);}
});
test('unsupported and partial visual notation retains last valid Math.js and cannot silently switch modes',async({page})=>{
 const field=await setup(page);await graphical(field,String.raw`\int x`,true);const raw=await open(page);await expect(raw).toHaveValue('2+3=');await expect(raw).toHaveAttribute('aria-invalid','true');await expect(page.locator('.source-conversion-status')).toContainText('Unsupported graphical command');await page.getByRole('checkbox',{name:'Native Math.js',exact:true}).click();await expect(page.getByRole('checkbox',{name:'Native Math.js',exact:true})).not.toBeChecked();await raw.fill('7+1=');await raw.press('Control+Enter');await expect(page.locator('.math output')).toHaveText('= 8');await expect(page.locator('.source-conversion-status')).toBeHidden();
 await graphical(field,'1+');await expect(raw).toHaveValue('7+1=');await expect(raw).toHaveAttribute('aria-invalid','true');await graphical(field,'1+2=',true);await expect(raw).toHaveValue('1+2=');await expect(page.locator('.math output')).toHaveText('= 3');
});
test('explicit word spaces stay single and visual fraction powers keep the correct base',async({page})=>{
 const field=await setup(page);await graphical(field,'');await field.focus();await page.keyboard.type('1 xor 0=');await expect(page.locator('.math output')).toHaveText('= true');await expect(page.getByLabel('Math.js expression',{exact:true})).toHaveValue('1 xor 0=');await graphical(field,String.raw`\frac{6}{3}^2=`,true);await expect(page.locator('.math output')).toHaveText('= 4');await expect(page.getByLabel('Math.js expression',{exact:true})).toHaveValue('((6)/(3))^(2)=');
});

test('saved Math.js overrides stale graphical caches while incomplete drafts remain recoverable',async({page})=>{
 await page.goto('/');await page.waitForFunction(()=>typeof document.querySelector('#file').onchange==='function');
 const load=async(latex,unitMode)=>{await page.locator('#file').setInputFiles({name:'authority.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[{id:'math',type:'math',x:100,y:100,width:380,height:150,source:'2+3=',latex,unitMode,displayMode:'math'}]}))});};
 for(const mode of ['raw','explicit']){await load('99=',mode);await expect(page.locator('.math output')).toHaveText('= 5');await expect.poll(()=>page.locator('.expression').evaluate(el=>el.value)).not.toContain('99');const raw=await open(page);await expect(raw).toHaveValue('2+3=');}
 await load('1+','explicit');const raw=await open(page);await expect(raw).toHaveValue('2+3=');await expect(raw).toHaveAttribute('aria-invalid','true');expect(await page.locator('.expression').evaluate(el=>el.value)).toBe('1+');
});

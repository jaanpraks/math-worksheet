import {test,expect} from '@playwright/test';
const r=(id,type,x,y,data)=>({id,type,x,y,width:type==='plot'?470:380,height:type==='plot'?300:150,...data});
async function load(page,regions){await page.goto('/');await page.locator('#file').setInputFiles({name:'controls.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions}))});}
const slider=r('slider','slider',100,100,{name:'q',value:'1',min:'0',max:'5',step:'0.5',unit:''});
test('slider interaction updates equations and a graph; range and step are editable',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await load(page,[slider,r('eq','math',100,300,{latex:'q^2=',source:'q^2='}),r('plot','plot',560,300,{series:'q*x',min:'0',max:'2'})]);
  const input=page.getByRole('slider',{name:'q slider'}),eq=page.locator('[data-id="eq"] output'),plot=page.locator('.plot canvas');
  await expect(eq).toContainText('1');const before=await plot.evaluate(el=>el.toDataURL());
  await input.evaluate(el=>{el.value='3';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await expect(eq).toContainText('9');expect(await plot.evaluate(el=>el.toDataURL())).not.toBe(before);
  await input.focus();await page.keyboard.press('ArrowRight');await expect(eq).toContainText('12.25');
  await page.locator('.slider').hover();await page.getByLabel('Variable settings',{exact:true}).click();
  await page.getByLabel('Maximum',{exact:true}).fill('10');await page.getByLabel('Step Δ',{exact:true}).fill('1');
  await expect(input).toHaveAttribute('max','10');await expect(input).toHaveAttribute('step','1');
  await page.getByLabel('Current value',{exact:true}).fill('6');await expect(eq).toContainText('36');
  await page.getByLabel('Variable settings',{exact:true}).click();
  await page.screenshot({path:'test-results/slider-preview.png'});expect(errors).toEqual([]);
});
test('radio options define a variable, recalculate, and persist selected values and settings',async({page})=>{
  await load(page,[r('radio','radio',100,80,{name:'b',options:'1\n2\n3',choice:'0',unit:''}),{...slider,y:220},r('eq','math',100,390,{latex:'bq=',source:'b*q='})]);
  await page.getByRole('radio',{name:'b = 2',exact:true}).check();await expect(page.locator('[data-id="eq"] output')).toContainText('2');
  await page.getByRole('slider').evaluate(el=>{el.value='4';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await expect(page.locator('[data-id="eq"] output')).toContainText('8');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;
  await page.reload();await page.locator('#file').setInputFiles(await download.path());
  await expect(page.getByRole('radio',{name:'b = 2',exact:true})).toBeChecked();await expect(page.getByRole('slider')).toHaveValue('4');
  await expect(page.locator('[data-id="eq"] output')).toContainText('8');
  await page.locator('.radio').hover();await page.locator('.radio').getByLabel('Variable settings',{exact:true}).click();
  await page.getByLabel('Options — one expression per line',{exact:true}).fill('pi/2\npi');
  await page.locator('.radio').getByLabel('Variable settings',{exact:true}).click();
  await page.getByRole('radio',{name:'b = pi',exact:true}).check();
  await expect(page.locator('[data-id="eq"] output')).toContainText('12.5663706');
  await page.screenshot({path:'test-results/radio-preview.png'});
});
test('controls can be added from the toolbar and invalid settings get an error outline',async({page})=>{
  await load(page,[]);await page.getByRole('button',{name:'+ Slider',exact:true}).click();await expect(page.locator('.slider')).toHaveCount(1);
  await page.getByRole('button',{name:'+ Options',exact:true}).click();await expect(page.locator('.radio')).toHaveCount(1);
  await page.locator('.slider').hover();await page.locator('.slider').getByLabel('Variable settings',{exact:true}).click();
  await page.getByLabel('Minimum',{exact:true}).fill('20');await expect(page.locator('.slider')).toHaveClass(/has-error/);
  await page.getByLabel('Minimum',{exact:true}).fill('0');await expect(page.locator('.slider')).not.toHaveClass(/has-error/);
  await page.locator('.slider').getByLabel('Unit (optional)',{exact:true}).fill('kg');
  await expect.poll(()=>page.locator('.slider math-field[aria-label="Variable value"]').evaluate(el=>el.value)).toContain('\\mathrm{kg}');
  await expect.poll(()=>page.locator('.slider math-field[aria-label="Variable range"]').evaluate(el=>el.value)).toContain('\\mathrm{kg}');
});



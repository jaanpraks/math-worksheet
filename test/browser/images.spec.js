import {test,expect} from '@playwright/test';
async function paste(page,width,height){
  await page.evaluate(async({width,height})=>{
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle='#157d8c';ctx.fillRect(0,0,width,height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve));const data=new DataTransfer();data.items.add(new File([blob],'test.png',{type:'image/png'}));document.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));
  },{width,height});await expect(page.locator('.image')).toHaveCount(1);
}
const dimensions=image=>image.evaluate(el=>{const b=el.getBoundingClientRect(),img=el.querySelector('img').getBoundingClientRect();return {width:b.width,height:b.height,imageWidth:img.width,imageHeight:img.height};});
test('pasted images use native size, resize proportionally with a tight frame, and keep scale on save/load and Undo',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await paste(page,120,60);const image=page.locator('.image');
  expect(await dimensions(image)).toEqual({width:120,height:60,imageWidth:120,imageHeight:60});await image.hover();const corner=await image.locator('.corner-resize').boundingBox();
  await page.mouse.move(corner.x+6,corner.y+6);await page.mouse.down();await page.mouse.move(corner.x+106,corner.y+56,{steps:6});await page.mouse.up();const resized=await dimensions(image);
  expect(resized.width).toBeCloseTo(220,1);expect(resized.width/resized.height).toBeCloseTo(2,8);expect(resized.imageWidth).toBe(resized.width);expect(resized.imageHeight).toBe(resized.height);
  await page.keyboard.press('Control+z');await expect.poll(()=>dimensions(image)).toEqual({width:120,height:60,imageWidth:120,imageHeight:60});await page.keyboard.press('Control+y');await expect.poll(()=>dimensions(image)).toEqual(resized);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();const download=await pending;await page.reload();await page.locator('#file').setInputFiles(await download.path());await expect(image).toHaveCount(1);expect(await dimensions(image)).toEqual(resized);expect(errors).toEqual([]);
});
test('old images with loose frames become tight while keeping their aspect ratio',async({page})=>{
  await page.goto('/');const src=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=60;c.height=120;return c.toDataURL();});
  const region={id:'old-image',type:'image',x:150,y:100,width:380,height:260,src,alt:'Old image'};
  await page.locator('#file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:1,regions:[region]}))});const image=page.locator('.image');await expect(image).toHaveCount(1);expect(await dimensions(image)).toEqual({width:130,height:260,imageWidth:130,imageHeight:260});
});

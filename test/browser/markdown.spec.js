import {test,expect} from '@playwright/test';

test('notes format simple Markdown and preserve the source through editing and JSON',async({page})=>{
  await page.goto('/');
  await page.locator('#canvas').click({position:{x:100,y:550}});
  await expect(page.locator('.expression').last()).toBeFocused();
  await page.keyboard.type('Markdown note');
  const note=page.locator('.text').last(), editor=note.locator('textarea'), preview=note.locator('.note-preview');
  const source='# Heading\n\nA **bold** and *italic* note with `v=r/t`.\n\n- First\n- Second\n\n1. Step one\n2. Step two\n\n> A quotation\n\n[Reference](https://example.com)';
  await expect(editor).toBeFocused();await editor.fill(source);await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();await expect(preview.locator('h1')).toHaveText('Heading');
  await expect(preview.locator('strong')).toHaveText('bold');await expect(preview.locator('em')).toHaveText('italic');
  await expect(preview.locator('code')).toHaveText('v=r/t');await expect(preview.locator('ul li')).toHaveCount(2);
  await expect(preview.locator('ol li')).toHaveCount(2);await expect(preview.locator('blockquote')).toHaveText('A quotation');
  await expect(preview.locator('a')).toHaveAttribute('href','https://example.com');
  await preview.locator('h1').click();await expect(editor).toBeFocused();await expect(editor).toHaveValue(source);
  await editor.fill(source+'\n\nUpdated **text**.');await page.keyboard.press('Escape');
  await expect(preview.locator('strong').last()).toHaveText('text');
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON'}).click();
  const download=await pending;await page.reload();await page.locator('#file').setInputFiles(await download.path());
  await expect(page.locator('.text').last().locator('.note-preview h1')).toHaveText('Heading');
  await expect(page.locator('.text').last().locator('textarea')).toHaveValue(source+'\n\nUpdated **text**.');
  await page.screenshot({path:'test-results/markdown-preview.png'});
});

test('HTML is literal text and unsupported link schemes never become active links',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'+ Text',exact:true}).click();
  const note=page.locator('.text').last();
  await note.locator('textarea').fill('<img src=x onerror=alert(1)>\n\n[Bad](javascript:alert)\n\n```\n<strong>literal code</strong>\n```');
  await page.keyboard.press('Escape');
  const preview=note.locator('.note-preview');
  await expect(preview).toContainText('<img src=x onerror=alert(1)>');
  await expect(preview.locator('img,script,a')).toHaveCount(0);
  await expect(preview.locator('pre code')).toHaveText('<strong>literal code</strong>');
});

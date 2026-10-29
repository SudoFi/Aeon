import { chromium } from 'playwright-core';
const video = process.argv.includes('--video');
const browser = await chromium.launch({ executablePath:'/usr/bin/google-chrome', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
const ctx = await browser.newContext({ viewport:{width:1280,height:720}, deviceScaleFactor:1, ...(video?{recordVideo:{dir:'vid',size:{width:1280,height:720}}}:{}) });
const page = await ctx.newPage();
const errs=[];
page.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type()+': '+m.text()); });
page.on('pageerror', e => errs.push('pageerror: '+e.message));
await page.goto('file:///workspace/aeon/aeon.html'+(video?'?cycle=2.2':''));
if (video) { await page.waitForTimeout(14500); }
else {
  await page.waitForTimeout(5000);
  const states=['idle','listening','thinking','speaking','error'];
  for (let i=0;i<5;i++){
    await page.keyboard.press(String(i+1));
    await page.waitForTimeout(4000);
    const fps = await page.evaluate(()=>window.__aeon?.fps);
    console.log(states[i],'fps',fps?.toFixed(1));
    await page.screenshot({path:`shots/${states[i]}.png`});
  }
  // hover+click a panel
  await page.hover('.item[data-root="2"]'); await page.click('.item[data-root="2"]'); await page.waitForTimeout(600);
  await page.keyboard.press('1'); await page.waitForTimeout(2500);
  await page.screenshot({path:'shots/panel-click.png'});
}
console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
await ctx.close(); await browser.close();

// AEON v2 capture: node shoot-v2.mjs [fps|shots|video]
import { chromium } from 'playwright-core';
import { mkdirSync, rmSync } from 'fs';
const mode = process.argv[2] || 'shots';
const browser = await chromium.launch({ executablePath:'/usr/bin/google-chrome', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--no-sandbox'] });
const ctx = await browser.newContext({ viewport:{width:1280,height:720}, deviceScaleFactor:1 });
const page = await ctx.newPage();
const errs=[];
page.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.type()+': '+m.text()); });
page.on('pageerror', e => errs.push('pageerror: '+e.message));
const url='file:///workspace/aeon/aeon.html';
const step=(n)=>page.evaluate(n=>window.__aeon.step(n),n);
const stepUntil=async(fn,max=300)=>{for(let i=0;i<max;i++){await step(1);if(await page.evaluate(fn))return i+1}return -1};
const S=()=>page.evaluate(()=>window.__aeon.cmd.s);

if (mode==='fps') {
  await page.goto(url+'?cycle=3');
  await page.waitForFunction(()=>window.__aeon?.ready);
  const fps=[];
  for(let i=0;i<14;i++){await page.waitForTimeout(1000);fps.push(await page.evaluate(()=>({f:window.__aeon.fps,s:window.__aeon.state,c:window.__aeon.cmd.on})))}
  console.log(fps.map(x=>x.f.toFixed(1)+':'+x.s+(x.c?'*':'')).join(' '));
  await page.click('#cmds button[data-cmd="Email"]'); await page.waitForTimeout(4000);
  await page.fill('#cmdIn','deploy the web container please'); await page.press('#cmdIn','Enter'); await page.waitForTimeout(500);
  console.log('typed cmd ->', await page.evaluate(()=>window.__aeon.cmd.c?.title));
  await page.click('.item[data-root="1"]'); await page.waitForTimeout(800);
  await page.keyboard.press('5'); await page.waitForTimeout(3000);
  console.log('after err fps', (await page.evaluate(()=>window.__aeon.fps)).toFixed(1));
}
if (mode==='shots') {
  mkdirSync('shots-v2',{recursive:true});
  await page.goto(url+'?manual&noauto');
  await page.waitForFunction(()=>window.__aeon?.ready);
  const shot=async n=>{await page.screenshot({path:`shots-v2/${n}.png`});console.log('shot',n,'t=',(await page.evaluate(()=>window.__aeon.t)).toFixed(2),'s=',(await S()).toFixed(2))};
  await step(110); await stepUntil(()=>window.__aeon.bolts.some(b=>b.on&&b.ph===1),60);
  await shot('01-idle');
  await page.click('#cmds button[data-cmd="Calendar"]'); await step(31);
  await shot('02-command-typed');
  await stepUntil(()=>{const b=window.__aeon.cmd.bolt;return b&&b.ph===0&&b.prog>.55});
  await shot('03-arc-growing');
  await stepUntil(()=>window.__aeon.cmd.s>3.3); await stepUntil(()=>window.__aeon.cmd.bolt.fl>.4,30);
  await shot('04-arc-connected-calendar');
  await stepUntil(()=>window.__aeon.cmd.s>5.3);
  await shot('05-speaking-answer');
  await stepUntil(()=>!window.__aeon.cmd.on);
  await page.evaluate(()=>window.__aeon.setState('thinking')); await step(40);
  await stepUntil(()=>window.__aeon.bolts.filter(b=>b.on&&b.ph===1&&b.tgt.type==='ring').length>=2,200);
  await shot('06-ambient-ring-hits');
  await page.evaluate(()=>window.__aeon.setState('error')); await step(75);
  await stepUntil(()=>window.__aeon.bolts.some(b=>b.on&&b.ph===1),200);
  await shot('07-error');
}
if (mode==='video') {
  rmSync('frames',{recursive:true,force:true}); mkdirSync('frames');
  await page.goto(url+'?manual&noauto');
  await page.waitForFunction(()=>window.__aeon?.ready);
  let f=0; const N=420; // 14 s @ 30 fps
  for(;f<N;f++){
    if(f===35) await page.evaluate(()=>window.__aeon.strike('ring'));
    if(f===62) await page.evaluate(()=>window.__aeon.strike('panel'));
    if(f===80) await page.evaluate(()=>window.__aeon.strike('ring'));
    if(f===95) await page.click('#cmds button[data-cmd="Calendar"]');
    if(f===372) await page.evaluate(()=>window.__aeon.strike('panel'));
    if(f===392) await page.evaluate(()=>window.__aeon.strike('ring'));
    await step(1);
    await page.screenshot({path:`frames/f${String(f).padStart(4,'0')}.png`});
  }
  console.log('frames',f);
}
console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
await ctx.close(); await browser.close();

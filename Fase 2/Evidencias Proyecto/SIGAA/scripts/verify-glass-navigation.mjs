import { chromium } from '../apps/web/node_modules/playwright/index.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const origin=process.env.SIGAA_ORIGIN;
assert(origin?.startsWith('https://'));
const accounts={...JSON.parse(await readFile('.secrets/hosted-accounts.json','utf8')),...JSON.parse(await readFile('.secrets/operations-accounts.json','utf8'))};
const out=new URL('../tmp/glass-evidence/',import.meta.url);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const report={date:new Date().toISOString(),origin,browser:'Chromium',checks:[],academicWrites:false};
try {
 for(const role of ['admin','inspector','teacher','student']) {
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);
  await page.getByLabel('Correo institucional',{exact:true}).fill(accounts[role].email);
  await page.getByLabel('Contraseña',{exact:true}).fill(accounts[role].password);
  await page.getByRole('button',{name:'Ingresar al portal'}).click();
  await page.getByRole('heading',{name:'Mi inicio',exact:true}).waitFor();
  const buttons=page.getByRole('navigation').getByRole('button'), labels=await buttons.allTextContents();
  await buttons.nth(1).hover();
  await page.waitForFunction(()=>Number(document.querySelector('nav button:nth-of-type(2)').style.getPropertyValue('--icon-scale'))>1.1);
  const before=await page.locator('.glass-active-lens').evaluate(e=>getComputedStyle(e).transform);
  await buttons.nth(1).click();
  await page.waitForFunction(old=>getComputedStyle(document.querySelector('.glass-active-lens')).transform!==old,before);
  assert.equal(await buttons.nth(1).getAttribute('aria-current'),'page');
  await page.screenshot({path:fileURLToPath(new URL(role+'-desktop.png',out)),animations:'disabled',fullPage:true});
  for(const [width,height] of [[768,1024],[390,844],[320,740],[844,390]]) {
   await page.setViewportSize({width,height});
   const mobile=width<=700,trigger=page.getByRole('button',{name:'Abrir menú',exact:true});
   if(mobile) {
    await page.waitForFunction(()=>document.querySelector('#school-navigation').inert && document.querySelector('.glass-menu-trigger').getAttribute('aria-expanded')==='false');
    await trigger.click();
    await page.waitForFunction(()=>document.querySelector('main').inert);
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('main').inert);
    assert.equal(await trigger.evaluate(e=>document.activeElement===e),true);
    await trigger.click();
    await page.waitForFunction(()=>document.activeElement===document.querySelector('nav [aria-current="page"]'));
    await page.getByRole('button',{name:'Cerrar menú',exact:true}).focus();
    await page.keyboard.press('Tab');
    assert.equal(await buttons.first().evaluate(e=>document.activeElement===e),true);
    await page.getByRole('button',{name:'Cerrar sesión',exact:true}).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('button',{name:'Cerrar menú',exact:true}).evaluate(e=>document.activeElement===e),true);
    await page.screenshot({path:fileURLToPath(new URL(`${role}-menu-${width}.png`,out)),animations:'disabled',fullPage:true});
   }
   for(let i=0;i<labels.length;i++) {
    if(mobile&&await trigger.isVisible())await trigger.click();
    await buttons.nth(i).click();
    await page.getByRole('heading',{name:labels[i].trim(),exact:true,level:1}).waitFor();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${role} ${width} ${labels[i]}`);
   }
   await page.screenshot({path:fileURLToPath(new URL(`${role}-page-${width}.png`,out)),animations:'disabled',fullPage:true});
   report.checks.push({role,width,height,navigation:true,overflow:false,keyboard:mobile?'escape,focus return,focus containment':'desktop'});
   console.log('PASS',role,width,height);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await buttons.first().click();
  assert.equal(await page.locator('.glass-active-lens').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
  assert.equal(await page.locator('.glass-view').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.deepEqual(errors,[]);
  await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
  await page.getByRole('heading',{name:'Bienvenido de vuelta'}).waitFor();
  await context.close();console.log('PASS',role,'all navigation sizes, magnification, shared indicator, keyboard, reduced motion');
 }
 report.result='passed';
} catch(error) {
 const page=browser.contexts().at(-1)?.pages()[0];
 if(page){await page.screenshot({path:fileURLToPath(new URL('failure.png',out)),animations:'disabled',fullPage:true});console.log(await page.evaluate(()=>({focus:document.activeElement?.outerHTML.slice(0,400),open:document.querySelector('.glass-menu-trigger')?.getAttribute('aria-expanded'),mobile:innerWidth,panel:getComputedStyle(document.querySelector('#school-navigation')).visibility})))}
 throw error;
} finally {
 await browser.close();
 await writeFile(new URL('../output/evidence/glass-navigation-tests.json',import.meta.url),JSON.stringify(report,null,2));
}

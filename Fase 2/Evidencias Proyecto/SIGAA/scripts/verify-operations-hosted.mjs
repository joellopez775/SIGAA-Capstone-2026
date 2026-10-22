import { chromium } from '../apps/web/node_modules/playwright/index.mjs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=process.env.SIGAA_ORIGIN;
assert(origin?.startsWith('https://'));
const accounts=JSON.parse(await readFile(process.env.SIGAA_ACCOUNTS_FILE,'utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const checks=[];
try {
  for(const role of ['admin','inspector']) for(const width of [1440,390]) {
    const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin);
    await page.getByLabel('Correo institucional',{exact:true}).fill(accounts[role].email);
    await page.getByLabel('Contraseña',{exact:true}).fill(accounts[role].password);
    await page.getByRole('button',{name:'Ingresar al portal'}).click();
    await page.getByRole('heading',{name:'Mi inicio',exact:true}).waitFor();
    assert.equal((await(await context.request.get(origin+'/api/auth/me')).json()).user.role,role);
    for(const [route,status] of [['/structure',role==='admin'?200:403],['/risk/alerts',200],['/risk/rules',200],['/support/justifications',200],['/support/absences',200]])
      assert.equal((await context.request.get(origin+'/api'+route)).status(),status,role+route);
    for(const name of [...(role==='admin'?['Estructura escolar']:[]),'Alertas y seguimiento','Justificaciones']) {
      if(width===390)await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
      await page.getByRole('navigation').getByRole('button',{name,exact:true}).click();
      await page.getByRole('heading',{name,exact:true}).waitFor();
      await page.getByRole('button',{name:'Actualizar datos',exact:true}).click();
      const alerts=(await page.getByRole('alert').allTextContents()).filter(t=>t.trim());
      assert.deepEqual(alerts,[],role+': '+name);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
    assert.deepEqual(errors,[]);
    if(width===390)await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
    await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
    await page.getByRole('heading',{name:'Bienvenido de vuelta'}).waitFor();
    checks.push({role,width,result:'pass',academicWrites:false});await context.close();
  }
} finally {await browser.close();}
await mkdir(new URL('../output/evidence/',import.meta.url),{recursive:true});
await writeFile(new URL('../output/evidence/operations-hosted-tests.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),origin,checks,result:'passed'},null,2));
console.log(JSON.stringify({passed:checks.length,checks}));

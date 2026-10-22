import { chromium } from '../apps/web/node_modules/playwright/index.mjs';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const origin = process.env.SIGAA_ORIGIN;
assert(origin?.startsWith('https://'));
const accounts = JSON.parse(await readFile(process.env.SIGAA_ACCOUNTS_FILE, 'utf8'));
const out = new URL('../tmp/hosted-evidence/', import.meta.url);
await mkdir(out, {recursive:true});
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
const checks=[];
try {
  for (const width of [1440,390]) for (const role of ['teacher','student']) {
    const context = await browser.newContext({viewport:{width,height:900}});
    const page = await context.newPage();
    await page.goto(origin);
    assert.equal((await context.request.get(origin+'/api/courses')).status(),401);
    await page.getByLabel('Correo institucional',{exact:true}).fill(accounts[role].email);
    await page.getByLabel('Contraseña',{exact:true}).fill(accounts[role].password);
    await page.getByRole('button',{name:'Ingresar al portal'}).click();
    await page.getByRole('heading',{name:'Mi inicio',exact:true}).waitFor();
    const me=await (await context.request.get(origin+'/api/auth/me')).json();
    assert.equal(me.user.role,role);
    const cookie=(await context.cookies()).find(c=>c.name==='__Host-sigaa_session');
    assert(cookie?.secure && cookie.httpOnly && cookie.sameSite==='Strict');
    const courses=await (await context.request.get(origin+'/api/courses')).json();
    assert(courses.courses.length===1);
    if(role==='student') {
      assert.equal((await context.request.get(origin+'/api/teacher/workspace')).status(),403);
      assert.equal((await context.request.get(origin+'/api/student/workspace/'+me.user.studentId)).status(),200);
    } else assert.equal((await context.request.get(origin+'/api/teacher/workspace')).status(),200);
    assert.equal((await context.request.post(origin+'/api/auth/logout',{headers:{Origin:origin},data:{}})).status(),403);
    await page.reload();
    await page.getByRole('heading',{name:'Mi inicio',exact:true}).waitFor();
    await page.getByRole('button',{name:'Actualizar datos',exact:true}).waitFor();
    assert.equal(await page.getByRole('alert').count(),0);
    assert.deepEqual(await page.locator('.secure-metrics strong').allTextContents(),['1','1','1']);
    const navigate = async name => {
      if(width===390) await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
      await page.getByRole('navigation').getByRole('button',{name,exact:true}).click();
    };
    if(role==='teacher') {
      const workspace=await (await context.request.get(origin+'/api/teacher/workspace')).json();
      const records=await context.request.get(origin+'/api/teacher/assignments/'+workspace.assignments[0].id+'/records');
      assert.equal(records.status(),200);
      assert.equal((await records.json()).students.length,1);
      for(const [menu,heading] of [['Asistencia','Registro de asistencia'],['Notas','Calificaciones'],['Anotaciones','Nueva anotación']]) {
        await navigate(menu);await page.getByRole('heading',{name:heading,exact:true}).waitFor();
        assert.equal(await page.getByRole('alert').count(),0);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
      }
    } else {
      for(const [menu,heading] of [['Mi asistencia','Mi asistencia registrada'],['Mis notas','Notas publicadas'],['Mis anotaciones','Mis anotaciones publicadas']]) {
        await navigate(menu);await page.getByRole('heading',{name:heading,exact:true}).waitFor();
      }
    }
    await navigate('Mi inicio');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    await page.screenshot({path:fileURLToPath(new URL(`${role}-${width}.png`,out)),fullPage:true});
    if(width===390) await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
    await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();
    await page.getByRole('heading',{name:'Bienvenido de vuelta'}).waitFor();
    assert.equal((await context.request.get(origin+'/api/auth/me')).status(),401);
    checks.push({role,width,login:true,cookieSecure:true,courseLinked:true,sessionReload:true,csrfReject:true,logout:true,noHorizontalOverflow:true,academicScreens:true});
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(new URL('results.json',out),JSON.stringify({origin,date:new Date().toISOString(),checks},null,2));
console.log(JSON.stringify({origin,passed:checks.length,checks}));

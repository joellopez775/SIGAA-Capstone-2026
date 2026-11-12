import {chromium} from '../apps/web/node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import https from 'node:https';
const origin=process.env.SIGAA_ORIGIN,expected=process.env.SIGAA_VERSION||'0.9.1';
assert(origin?.startsWith('https://'),'SIGAA_ORIGIN must use HTTPS');
const accounts=JSON.parse(await readFile(process.env.SIGAA_ACCOUNTS_FILE,'utf8'));
const tls=await new Promise((resolve,reject)=>https.get(origin,r=>{const cert=r.socket.getPeerCertificate();resolve({authorized:r.socket.authorized,status:r.statusCode,protocol:r.socket.getProtocol(),issuer:cert.issuer?.O,validFrom:cert.valid_from,validTo:cert.valid_to,subjectAltName:cert.subjectaltname});r.resume();}).on('error',reject));
assert(tls.authorized);assert.equal(tls.status,200);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),checks=[];
try {
 for(const role of ['admin','inspector','teacher','student'])for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const get=async(path,status=200)=>{const r=await context.request.get(origin+'/api'+path);assert.equal(r.status(),status,role+':'+path);return status===200?r.json():null;};
  assert.equal((await get('/health')).version,expected);await get('/students',401);
  await page.goto(origin);await page.getByLabel('Correo institucional',{exact:true}).fill(accounts[role].email);await page.getByLabel('Contraseña',{exact:true}).fill(accounts[role].password);await page.getByRole('button',{name:'Ingresar al portal',exact:true}).click();await page.getByRole('heading',{name:'Mi inicio',exact:true}).waitFor();
  const me=await get('/auth/me');assert.equal(me.user.role,role);
  const cookie=(await context.cookies()).find(c=>c.name==='__Host-sigaa_session');assert(cookie?.secure&&cookie.httpOnly&&cookie.sameSite==='Strict');
  assert.equal((await context.request.post(origin+'/api/auth/logout',{headers:{Origin:origin,'X-CSRF-Token':'invalid'},data:{}})).status(),403);
  await page.reload();await page.getByRole('heading',{name:'Mi inicio',exact:true}).waitFor();assert.equal((await get('/auth/me')).user.role,role);
  const students=await get('/students');const rows=students.students;assert(rows.length>0);
  if(role==='student'){
   assert.equal(rows.length,1);assert.equal(rows[0].id,me.user.studentId);
   const w=await get('/student/workspace/'+me.user.studentId);assert(w.subjects.length>0);await get('/student/calendar/'+me.user.studentId+'?from=2026-10-01&to=2026-10-31');
   const d=await get('/students/'+me.user.studentId+'/dossier');assert.equal(d.guardians.length,0);assert.equal(d.cases.length,0);
   const inbox=await get('/notifications');assert.equal(inbox.total,0);assert.equal(inbox.unread,0);assert.deepEqual(inbox.notifications,[]);
   for(const p of ['/guardians','/followup/cases','/structure'])await get(p,403);
  }else{
   await get('/notifications');await get('/followup/cases');await get('/risk/alerts');await get('/students/'+rows[0].id+'/dossier');
   if(role==='teacher'){const w=await get('/teacher/workspace');assert(w.assignments.length>0);await get('/teacher/assignments/'+w.assignments[0].id+'/records');await get('/guardians',403);}
   else await get('/guardians');
   await get('/structure',role==='admin'?200:403);
  }
  const names=role==='student'?['Mis asignaturas','Mi calendario','Ficha integral','Mi asistencia','Mis notas','Mis anotaciones']:['Avisos','Casos de seguimiento','Ficha integral',...(role==='teacher'?['Asistencia','Notas','Anotaciones']:['Apoderados','Alertas y seguimiento','Justificaciones']),...(role==='admin'?['Estructura escolar']:[])];
  for(const name of names){
   if(width===390)await page.getByRole('button',{name:'Abrir menú',exact:true}).click();
   await page.getByRole('navigation').getByRole('button',{name,exact:true}).click();await page.getByRole('heading',{name,exact:true,level:1}).waitFor();
   await page.waitForLoadState('networkidle');
   assert.deepEqual((await page.getByRole('alert').allTextContents()).filter(t=>t.trim()),[],role+': '+name);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),role+': overflow '+name);
  }
  assert.deepEqual(errors,[]);
  if(width===390)await page.getByRole('button',{name:'Abrir menú',exact:true}).click();await page.getByRole('button',{name:'Cerrar sesión',exact:true}).click();await page.getByRole('heading',{name:'Bienvenido de vuelta',exact:true}).waitFor();await get('/auth/me',401);
  checks.push({role,width,version:expected,panels:names,result:'passed',sessionCookie:'Secure; HttpOnly; SameSite=Strict',sessionReload:true,logoutRevoked:true,invalidCsrfRejected:true,roleRestrictions:true,academicWrites:false});console.log(JSON.stringify({role,width,result:'passed'}));await context.close();
 }
}finally{await browser.close();}
const evidence={date:new Date().toISOString(),origin,version:expected,tls,checks,result:'passed',scope:'Four roles, two emulated viewports, one physical Mac. Read-only academic checks; login/logout update session and audit records.'};
await mkdir(new URL('../output/evidence/deployment-0.9.1/',import.meta.url),{recursive:true});await writeFile(new URL('../output/evidence/deployment-0.9.1/https-verification.json',import.meta.url),JSON.stringify(evidence,null,2));
console.log(JSON.stringify({result:'passed',sessions:checks.length,tls}));

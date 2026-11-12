import { chromium } from "../apps/web/node_modules/playwright/index.mjs";
import pg from "../apps/api/node_modules/pg/lib/index.js";
import { sampleData } from "../apps/api/src/sample-data.js";
import { provisionUser } from "../apps/api/src/manage-user.js";
import { randomBytes } from "node:crypto";
import { readFile,readdir,mkdir,writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root=new URL("../",import.meta.url),output=new URL("tmp/portal-notifications-evidence/",root);
if(!process.env.TEST_DATABASE_URL)throw Error("Isolated TEST_DATABASE_URL required");
const dbName="sigaa_followup_browser_"+randomBytes(6).toString("hex"),dbUrl=new URL(process.env.TEST_DATABASE_URL);dbUrl.pathname="/"+dbName;
const manager=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL}),origin="http://127.0.0.1:8106";
const passwords=Object.fromEntries(["admin","teacher","teacher2","student","student2","inspector"].map(k=>[k,randomBytes(20).toString("hex")]));
let pool,browser,api,web,page,fixture;
const report={date:new Date().toISOString(),browser:"Chromium",environment:"Isolated PostgreSQL; synthetic data",checks:[]};
const errors=[];
async function check(label,fn){await fn();report.checks.push({label,result:"pass"});console.log("PASS",label);}
async function login(role,email){await page.getByLabel("Correo institucional",{exact:true}).fill(email+"@sigaa.local");await page.getByLabel("Contraseña",{exact:true}).fill(passwords[role]);await page.getByRole("button",{name:"Ingresar al portal"}).click();await page.getByRole("heading",{name:"Mi inicio",exact:true}).waitFor();}
async function nav(name){const menu=page.getByRole("button",{name:"Abrir menú",exact:true});const mobile=await menu.isVisible();if(mobile)await menu.click();await page.getByRole("navigation").getByRole("button",{name,exact:true}).click();if(mobile)await page.locator(".glass-navigation").waitFor({state:"hidden"});}
async function logout(){const menu=page.getByRole("button",{name:"Abrir menú",exact:true});if(await menu.isVisible())await menu.click();await page.getByRole("button",{name:"Cerrar sesión",exact:true}).click();await page.getByRole("heading",{name:"Bienvenido de vuelta"}).waitFor();}
async function saved(text){await page.getByRole("status").filter({hasText:text}).waitFor();}
async function screenshot(name){await page.screenshot({path:fileURLToPath(new URL(name+".png",output)),fullPage:true});}
try {
  report.environment='Isolated PostgreSQL '+(await manager.query('SHOW server_version')).rows[0].server_version+'; synthetic data';await mkdir(output,{recursive:true});await manager.query('CREATE DATABASE "'+dbName+'"');pool=new pg.Pool({connectionString:dbUrl.href});
  const dir=new URL("infra/postgres/init/",root);
  for(const f of (await readdir(dir)).filter(f=>f.endsWith(".sql")).sort())await pool.query(await readFile(new URL(f,dir),"utf8"));
  fixture=await sampleData(pool,passwords);
  await provisionUser(pool,{email:"inspector@sigaa.local",name:"Inspectoría QA",role:"INSPECTORIA",password:passwords.inspector});
  const a=(await pool.query("SELECT id FROM curso_asignatura WHERE curso_id=$1",[fixture.courses[0]])).rows[0];
  const s=(await pool.query(`INSERT INTO sesion_clase(curso_asignatura_id,fecha,bloque,estado,titulo,objetivo,creada_por,publicada)
    VALUES($1,'2026-10-01','QA UI','realizada','Clase QA','Objetivo QA',$2,TRUE) RETURNING id`,[a.id,fixture.teacher.id])).rows[0];
  await pool.query("INSERT INTO asistencia(sesion_id,estudiante_id,estado,registrada_por) VALUES($1,$2,'ausente',$3)",[s.id,fixture.students[0],fixture.teacher.id]);
  const ev=(await pool.query(`INSERT INTO evaluacion(curso_asignatura_id,nombre,fecha,ponderacion,estado,creada_por,visible_estudiante)
    VALUES($1,'Control QA UI','2026-10-01',100,'publicada',$2,TRUE) RETURNING id`,[a.id,fixture.teacher.id])).rows[0];
  await pool.query("INSERT INTO calificacion(evaluacion_id,estudiante_id,valor,registrada_por,visible_estudiante) VALUES($1,$2,3,$3,TRUE)",[ev.id,fixture.students[0],fixture.teacher.id]);
  api=spawn(process.execPath,["src/server.js"],{cwd:new URL("apps/api/",root),env:{...process.env,DATABASE_URL:dbUrl.href,PORT:"0",NODE_ENV:"test",APP_ORIGIN:origin},stdio:["ignore","pipe","pipe"]});
  const target=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error("API startup timeout")),10000);api.stdout.on("data",b=>{const m=String(b).match(/port (\d+)/);if(m){clearTimeout(timer);resolve("http://127.0.0.1:"+m[1]);}});api.on("exit",c=>{clearTimeout(timer);reject(Error("API exited "+c));});});
  web=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","8106","--strictPort"],{cwd:new URL("apps/web/",root),env:{...process.env,API_TARGET:target},stdio:"ignore"});
  for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  page=await browser.newPage({viewport:{width:1440,height:1000}});page.on("pageerror",e=>errors.push(e.message));
  await page.goto(origin);await login("admin","admin");

  await logout();await login('teacher','docente');
  await check('Docente programa y publica una clase futura desde asistencia',async()=>{
    await nav('Asistencia');await page.getByText('Programar una clase',{exact:true}).click();
    await page.getByLabel('Fecha de la clase',{exact:true}).fill('2026-10-30');await page.getByLabel('Bloque',{exact:true}).fill('09:00 - 10:00');
    await page.getByLabel('Título de la clase',{exact:true}).fill('Preparación de evaluación');await page.getByLabel('Objetivo',{exact:true}).fill('Revisar contenidos y resolver dudas');
    await page.getByRole('button',{name:'Crear clase',exact:true}).click();
    await page.getByRole('option',{name:/Preparación de evaluación/}).waitFor({state:'attached'});
    const value=await page.getByRole('option',{name:/Preparación de evaluación/}).getAttribute('value');await page.getByLabel('Clase',{exact:true}).selectOption(value);
    await page.getByRole('button',{name:'Publicar en calendario',exact:true}).click();await page.getByRole('button',{name:'Retirar del calendario',exact:true}).waitFor();await screenshot('01-publicacion-clase');
  });
  await logout();await login('student','estudiante');
  await check('Estudiante ve asignatura, docente y calendario propio persistente',async()=>{
    await nav('Mis asignaturas');await page.getByRole('heading',{name:'Matemática',exact:true}).waitFor();await page.getByText('Daniela Rojas',{exact:true}).waitFor();
    assert.equal(await page.getByText('Felipe Díaz',{exact:true}).count(),0);await screenshot('02-asignaturas');
    await nav('Mi calendario');await page.getByLabel('Mes del calendario').fill('2026-10');await page.getByRole('heading',{name:'Preparación de evaluación',exact:true}).waitFor();
    await page.getByRole('heading',{name:'Control QA UI',exact:true}).waitFor();await screenshot('03-calendario');
    await page.reload();await page.getByRole('heading',{name:'Mi inicio',exact:true}).waitFor();await nav('Mi calendario');await page.getByRole('heading',{name:'Preparación de evaluación',exact:true}).waitFor();
  });
  await check('Calendario permite cambiar de mes y explica el estado vacío',async()=>{
    await page.getByLabel('Mes del calendario').fill('2026-11');await page.getByText('No hay actividades publicadas para este mes.',{exact:true}).waitFor();
  });
  await logout();await login('teacher','docente');
  await check('Retirar una clase del calendario conserva la clase del docente',async()=>{
    await nav('Asistencia');const value=await page.getByRole('option',{name:/Preparación de evaluación/}).getAttribute('value');await page.getByLabel('Clase',{exact:true}).selectOption(value);
    await page.getByRole('button',{name:'Retirar del calendario',exact:true}).click();await page.getByRole('button',{name:'Publicar en calendario',exact:true}).waitFor();
  });
  await logout();await login('admin','admin');
  await check('Administración abre un caso y genera un aviso al docente responsable',async()=>{
    await nav('Alertas y seguimiento');await page.getByRole('button',{name:'Recalcular alertas'}).click();await saved('Alertas recalculadas');
    await nav('Casos de seguimiento');await page.getByLabel('Alerta de origen',{exact:true}).selectOption({index:1});await page.getByLabel('Asignar responsable del caso',{exact:true}).selectOption(fixture.teacher.id);
    await page.getByLabel('Próxima acción',{exact:true}).fill('Revisar asistencia con el equipo');await page.getByLabel('Fecha de seguimiento',{exact:true}).fill('2026-10-31');await page.getByLabel('Motivo de apertura',{exact:true}).fill('Caso de prueba para verificar avisos');
    await page.getByRole('button',{name:'Crear caso',exact:true}).click();await saved('Caso abierto');
  });
  await logout();await login('teacher','docente');
  await check('Docente filtra, lee y abre su aviso; una intervención avisa al creador',async()=>{
    await nav('Avisos');await page.getByRole('heading',{name:'Nuevo caso de seguimiento',exact:true}).waitFor();await screenshot('04-avisos');
    await page.getByRole('button',{name:'Marcar como leído',exact:true}).click();await page.getByText('0 avisos sin leer · 1 resultados',{exact:true}).waitFor();
    await page.getByLabel('Mostrar avisos',{exact:true}).selectOption('unread');await page.getByText('No hay avisos en esta página.',{exact:true}).waitFor();
    await page.getByLabel('Mostrar avisos',{exact:true}).selectOption('all');await page.getByRole('button',{name:'Ver caso',exact:true}).click();await page.getByRole('heading',{name:'Seguimiento de Camila Soto',exact:true}).waitFor();
    await page.getByText('Registrar intervención',{exact:true}).click();await page.getByLabel('Intervención realizada',{exact:true}).fill('Intervención sintética para comprobar avisos');await page.getByRole('button',{name:'Guardar intervención',exact:true}).click();await saved('Intervención registrada');
  });
  await logout();await login('admin','admin');
  await check('Aviso de actividad persiste al recargar y funciona en teléfono',async()=>{
    await page.setViewportSize({width:390,height:844});await nav('Avisos');await page.getByRole('heading',{name:'Nueva intervención en un caso',exact:true}).waitFor();
    await page.reload();await page.getByRole('heading',{name:'Mi inicio',exact:true}).waitFor();await nav('Avisos');await page.getByRole('heading',{name:'Nueva intervención en un caso',exact:true}).waitFor();
    await screenshot('05-avisos-movil');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  });
  await logout();await login('student','estudiante');
  await check('Estudiante en teléfono no ve avisos internos ni clases retiradas',async()=>{
    await nav('Mi calendario');await page.getByRole('heading',{name:'Control QA UI',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Preparación de evaluación',exact:true}).count(),0);
    await screenshot('06-calendario-movil');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const response=await page.request.get(origin+'/api/notifications');assert.equal((await response.json()).total,0);assert.deepEqual(errors,[]);
  });
  report.result="passed";
} catch(error) {report.result="failed";report.error=error.message;if(page)await screenshot("failure");console.error(error);process.exitCode=1;}
finally {
  await writeFile(new URL("browser-results.json",output),JSON.stringify(report,null,2));
  if(browser)await browser.close();
  for(const child of [web,api])if(child&&child.exitCode===null){const exit=once(child,"exit");child.kill("SIGTERM");await exit;}
  if(pool)await pool.end();
  await manager.query('DROP DATABASE IF EXISTS "'+dbName+'"');await manager.end();
}

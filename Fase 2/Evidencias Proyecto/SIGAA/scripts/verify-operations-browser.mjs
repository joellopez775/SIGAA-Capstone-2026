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
const root=new URL("../",import.meta.url),output=new URL("tmp/operations-evidence/",root);
if(!process.env.TEST_DATABASE_URL)throw Error("Isolated TEST_DATABASE_URL required");
const dbName="sigaa_ops_browser_"+randomBytes(6).toString("hex"),dbUrl=new URL(process.env.TEST_DATABASE_URL);dbUrl.pathname="/"+dbName;
const manager=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL}),origin="http://127.0.0.1:8101";
const passwords=Object.fromEntries(["admin","teacher","teacher2","student","student2","inspector"].map(k=>[k,randomBytes(20).toString("hex")]));
let pool,browser,api,web,page,fixture;
const report={date:new Date().toISOString(),browser:"Chromium",environment:"Local isolated PostgreSQL 14; synthetic data",checks:[]};
const errors=[];
async function check(label,fn){await fn();report.checks.push({label,result:"pass"});console.log("PASS",label);}
async function login(role,email){await page.getByLabel("Correo institucional",{exact:true}).fill(email+"@sigaa.local");await page.getByLabel("Contraseña",{exact:true}).fill(passwords[role]);await page.getByRole("button",{name:"Ingresar al portal"}).click();await page.getByRole("heading",{name:"Mi inicio",exact:true}).waitFor();}
async function nav(name){const menu=page.getByRole("button",{name:"Abrir menú",exact:true});if(await menu.isVisible())await menu.click();await page.getByRole("navigation").getByRole("button",{name,exact:true}).click();}
async function logout(){const menu=page.getByRole("button",{name:"Abrir menú",exact:true});if(await menu.isVisible())await menu.click();await page.getByRole("button",{name:"Cerrar sesión",exact:true}).click();await page.getByRole("heading",{name:"Bienvenido de vuelta"}).waitFor();}
async function saved(text){await page.getByRole("status").filter({hasText:text}).waitFor();}
async function screenshot(name){await page.screenshot({path:fileURLToPath(new URL(name+".png",output)),fullPage:true});}
try {
  await mkdir(output,{recursive:true});await manager.query('CREATE DATABASE "'+dbName+'"');pool=new pg.Pool({connectionString:dbUrl.href});
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
  web=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","8101","--strictPort"],{cwd:new URL("apps/web/",root),env:{...process.env,API_TARGET:target},stdio:"ignore"});
  for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  page=await browser.newPage({viewport:{width:1440,height:1000}});page.on("pageerror",e=>errors.push(e.message));
  await page.goto(origin);await login("admin","admin");
  await check("Administración crea y edita establecimiento persistente",async()=>{
    await nav("Estructura escolar");await page.getByLabel("Nombre",{exact:true}).fill("Colegio UI");
    await page.getByLabel("RBD",{exact:true}).fill("QA-UI-888");await page.getByRole("button",{name:"Guardar registro",exact:true}).click();await saved("Registro guardado");
    await page.getByRole("article").filter({hasText:"Colegio UI"}).getByRole("button",{name:"Editar",exact:true}).click();
    await page.getByLabel("Nombre",{exact:true}).fill("Colegio UI actualizado");await page.getByRole("button",{name:"Guardar registro",exact:true}).click();await saved("Registro guardado");
    await page.reload();await page.getByRole("heading",{name:"Mi inicio",exact:true}).waitFor();await nav("Estructura escolar");
    await page.getByText("Colegio UI actualizado",{exact:true}).waitFor();
  });
  await check("Formulario de duplicado conserva datos y muestra error",async()=>{
    await page.getByLabel("Nombre",{exact:true}).fill("Duplicado");await page.getByLabel("RBD",{exact:true}).fill("QA-UI-888");
    await page.getByRole("button",{name:"Guardar registro",exact:true}).click();
    await page.getByRole("alert").filter({hasText:"Ya existe"}).waitFor();assert.equal(await page.getByLabel("Nombre",{exact:true}).inputValue(),"Duplicado");
  });
  await check("Todos los catálogos y asignaciones son navegables",async()=>{
    for(const name of ["Años escolares","Niveles","Asignaturas","Cursos","Asignaciones docentes"]){await page.getByRole("button",{name,exact:true}).last().click();await page.getByRole("heading",{name,exact:true}).waitFor();}
    await screenshot("01-estructura");
  });
  await check("Recalcular genera tres alertas persistentes y no duplica",async()=>{
    await nav("Alertas y seguimiento");await page.getByRole("button",{name:"Recalcular alertas"}).click();await saved("Alertas recalculadas");
    assert.equal(await page.getByRole("button",{name:"Gestionar alerta e historial"}).count(),3);
    await page.getByRole("button",{name:"Recalcular alertas"}).click();await saved("Alertas recalculadas");
    assert.equal(await page.getByRole("button",{name:"Gestionar alerta e historial"}).count(),3);await screenshot("02-alertas");
  });
  await check("Cambiar responsable y estado conserva historial y aplica los cuatro filtros",async()=>{
    await page.getByRole("button",{name:"Gestionar alerta e historial"}).first().click();
    await page.getByLabel("Nuevo estado",{exact:true}).selectOption("asignada");await page.getByLabel("Asignar responsable",{exact:true}).selectOption({label:"Inspectoría QA"});
    await page.getByLabel("Motivo del cambio",{exact:true}).fill("Revisión de antecedentes de prueba");await page.getByRole("button",{name:"Guardar cambio",exact:true}).click();await saved("Cambio registrado");
    await page.getByLabel("Prioridad",{exact:true}).selectOption("critica");
    await page.getByLabel("Curso",{exact:true}).selectOption(fixture.courses[0]);
    await page.getByLabel("Estado",{exact:true}).selectOption("asignada");
    await page.getByLabel("Responsable",{exact:true}).selectOption({label:"Inspectoría QA"});
    await page.getByRole("button",{name:"Gestionar alerta e historial"}).first().waitFor();
    await page.waitForFunction(()=>document.querySelectorAll(".academic-note h3").length===1);
    await page.getByRole("button",{name:"Gestionar alerta e historial"}).click();await page.getByText(/status_change/).waitFor();await screenshot("03-historial");
  });
  await check("Administración configura una nueva versión de regla",async()=>{
    await page.getByRole("button",{name:"Cancelar",exact:true}).click();
    await page.getByText("Promedio bajo aprobación · v1 · Activa",{exact:true}).click();
    const form=page.locator("details").filter({hasText:"Promedio bajo aprobación"});
    await form.getByLabel("Rendimiento inferior a",{exact:true}).fill("2");
    await form.getByLabel("Motivo de configuración").fill("Umbral de prueba ajustado");await form.getByRole("button",{name:"Guardar nueva versión"}).click();await saved("Nueva versión");
    await page.getByText("Promedio bajo aprobación · v2 · Activa",{exact:true}).waitFor();
  });
  await logout();await login("inspector","inspector");
  await check("Inspectoría registra respaldo y aprueba ausencia desde formularios",async()=>{
    await nav("Justificaciones");await page.getByLabel("Ausencia",{exact:true}).selectOption({index:1});
    await page.getByLabel("Motivo",{exact:true}).fill("Respaldo recibido por Inspectoría");await page.getByLabel("Referencia del respaldo").fill("Folio QA-UI 2026");
    await page.getByRole("button",{name:"Registrar para revisión"}).click();await saved("Justificación registrada");
    await page.getByRole("button",{name:"Revisar justificación"}).click();await page.getByLabel("Fundamento de la decisión").fill("Documento revisado y validado para la prueba");
    await page.getByRole("button",{name:"Confirmar revisión"}).click();await saved("Revisión registrada");await page.getByText("aceptada",{exact:true}).waitFor();await screenshot("04-justificaciones");
  });
  await check("Inspectoría no recibe menú de administración",async()=>{assert.equal(await page.getByRole("navigation").getByRole("button",{name:"Estructura escolar"}).count(),0);});
  await check("Pantallas de Inspectoría responden en móvil sin desborde",async()=>{
    await page.setViewportSize({width:390,height:844});
    for(const view of ["Justificaciones","Alertas y seguimiento"]){await nav(view);await page.getByRole("heading",{name:view,exact:true}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await screenshot(view==="Justificaciones"?"05-justificaciones-movil":"06-alertas-movil");}
  });
  await logout();await login("student","estudiante");
  await check("Estudiante ve asistencia justificada y solo el estado de su respaldo",async()=>{
    await nav("Mi asistencia");await page.getByText("Matemática · Justificada",{exact:true}).waitFor();await nav("Mis justificaciones");await page.getByText("aceptada",{exact:true}).waitFor();
    assert.equal(await page.getByText("Folio QA-UI 2026",{exact:false}).count(),0);await screenshot("07-estudiante-movil");
  });
  await logout();await login("admin","admin");
  await check("Estructura escolar en móvil, foco por teclado y cero errores de JS",async()=>{
    await nav("Estructura escolar");await page.keyboard.press("Tab");assert.equal(await page.evaluate(()=>document.activeElement!==document.body),true);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);await screenshot("08-estructura-movil");
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

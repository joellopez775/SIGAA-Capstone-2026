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
const root=new URL("../",import.meta.url),output=new URL("tmp/followup-evidence/",root);
if(!process.env.TEST_DATABASE_URL)throw Error("Isolated TEST_DATABASE_URL required");
const dbName="sigaa_followup_browser_"+randomBytes(6).toString("hex"),dbUrl=new URL(process.env.TEST_DATABASE_URL);dbUrl.pathname="/"+dbName;
const manager=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL}),origin="http://127.0.0.1:8105";
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
  web=spawn(process.execPath,["node_modules/vite/bin/vite.js","--host","127.0.0.1","--port","8105","--strictPort"],{cwd:new URL("apps/web/",root),env:{...process.env,API_TARGET:target},stdio:"ignore"});
  for(let i=0;i<80;i++){try{if((await fetch(origin)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
  page=await browser.newPage({viewport:{width:1440,height:1000}});page.on("pageerror",e=>errors.push(e.message));
  await page.goto(origin);await login("admin","admin");

  await check("Registro de apoderado, vínculo principal y recarga persistente",async()=>{
    await nav("Apoderados");await page.getByText("No hay registros disponibles.",{exact:true}).waitFor();
    await page.getByLabel("Código interno",{exact:true}).fill("UI-FAMILIA");
    await page.getByLabel("Nombres",{exact:true}).fill("Andrea");
    await page.getByLabel("Apellidos",{exact:true}).fill("Prueba");
    await page.getByLabel("Correo de contacto",{exact:true}).fill("familia@example.test");
    await page.getByLabel("Teléfono",{exact:true}).fill("+56 9 1234 5678");
    assert.equal(await page.getByLabel("Código interno",{exact:true}).inputValue(),"UI-FAMILIA");
    await page.getByRole("button",{name:"Guardar apoderado",exact:true}).click();await saved("Apoderado guardado");
    await page.getByText("Vincular estudiante",{exact:true}).click();
    await page.getByLabel("Estudiante a vincular",{exact:true}).selectOption(fixture.students[0]);
    await page.getByLabel("Parentesco o vínculo",{exact:true}).fill("Madre");
    await page.getByLabel("Motivo del cambio",{exact:true}).fill("Vínculo sintético para verificar el módulo");
    await page.getByRole("button",{name:"Guardar vínculo",exact:true}).click();await saved("Vínculo guardado");
    await page.getByText("Camila Soto · Madre · Principal",{exact:true}).waitFor();
    await page.locator(".follow-columns").screenshot({path:fileURLToPath(new URL("01-apoderados.png",output))});
    await page.reload();await page.getByRole("heading",{name:"Mi inicio",exact:true}).waitFor();await nav("Apoderados");
    await page.getByRole("button",{name:/Andrea Prueba/}).click();await page.getByText("Camila Soto · Madre · Principal",{exact:true}).waitFor();
  });
  await check("Duplicado muestra error sin perder formulario; edición conserva historial",async()=>{
    await page.getByLabel("Código interno",{exact:true}).fill("UI-FAMILIA");await page.getByLabel("Nombres",{exact:true}).fill("Andrea");
    await page.getByLabel("Apellidos",{exact:true}).fill("Prueba");await page.getByRole("button",{name:"Guardar apoderado",exact:true}).click();
    await page.getByRole("alert").filter({hasText:"Ya existe"}).waitFor();assert.equal(await page.getByLabel("Código interno").inputValue(),"UI-FAMILIA");
    await page.getByRole("button",{name:"Editar datos de contacto",exact:true}).click();
    await page.getByLabel("Teléfono",{exact:true}).fill("+56 9 2222 3333");await page.getByLabel("Motivo del cambio",{exact:true}).first().fill("Corrección sintética de contacto");
    await page.getByRole("button",{name:"Guardar apoderado",exact:true}).click();await saved("Apoderado guardado");
  });
  await check("Apertura de caso desde alerta con responsable y próxima acción",async()=>{
    await nav("Alertas y seguimiento");await page.getByRole("button",{name:"Recalcular alertas"}).click();await saved("Alertas recalculadas");
    await nav("Casos de seguimiento");await page.getByLabel("Alerta de origen",{exact:true}).selectOption({index:1});
    await page.getByLabel("Asignar responsable del caso",{exact:true}).selectOption({label:"Inspectoría QA"});
    await page.getByLabel("Próxima acción",{exact:true}).fill("Revisar antecedentes de asistencia");
    await page.getByLabel("Fecha de seguimiento",{exact:true}).fill("2026-10-31");
    await page.getByLabel("Motivo de apertura",{exact:true}).fill("Caso sintético para verificar el seguimiento");
    await page.getByRole("button",{name:"Crear caso",exact:true}).click();await saved("Caso abierto");
    await page.getByRole("heading",{name:"Seguimiento de Camila Soto",exact:true}).waitFor();
    await page.locator("section").filter({has:page.getByRole("heading",{name:"Abrir caso desde una alerta",exact:true})}).screenshot({path:fileURLToPath(new URL("02-casos.png",output))});
  });
  await logout();await login("inspector","inspector");
  await check("Inspectoría registra intervención, cierra y reabre conservando historial",async()=>{
    await nav("Casos de seguimiento");await page.getByRole("button",{name:"Abrir caso",exact:true}).click();
    await page.getByText("Registrar intervención",{exact:true}).click();
    await page.getByLabel("Intervención realizada",{exact:true}).fill("Intervención sintética: verificación del módulo");
    await page.getByRole("button",{name:"Guardar intervención",exact:true}).click();await saved("Intervención registrada");
    await page.getByText("Cambiar estado, responsable o cerrar",{exact:true}).click();
    await page.getByLabel("Nuevo estado del caso",{exact:true}).selectOption("cerrado");
    await page.getByLabel("Fundamento del cambio",{exact:true}).fill("Cierre sintético de prueba");
    await page.getByLabel("Resultado de cierre (obligatorio al cerrar)",{exact:true}).fill("Resultado de prueba registrado correctamente");
    await page.getByRole("button",{name:"Guardar estado del caso",exact:true}).click();await saved("Caso actualizado");
    await page.getByText("Reabrir caso",{exact:true}).click();await page.getByLabel("Fundamento del cambio",{exact:true}).fill("Reapertura sintética para comprobar historial");
    await page.getByRole("button",{name:"Guardar estado del caso",exact:true}).click();await saved("Caso actualizado");
    assert.equal(await page.locator(".follow-timeline li").count(),4);
    await page.getByRole("heading",{name:"Historial del caso (últimos 500 registros)"}).scrollIntoViewIfNeeded();
    await page.screenshot({path:fileURLToPath(new URL("03-historial.png",output))});
  });
  await check("Ficha de Inspectoría integra notas, asistencia, casos y contactos",async()=>{
    await nav("Ficha integral");await page.getByLabel("Estudiante de la ficha").selectOption(fixture.students[0]);
    await page.getByRole("heading",{name:"Camila Soto",exact:true}).waitFor();
    await page.getByText("familia@example.test · +56 9 2222 3333",{exact:true}).waitFor();
    assert.equal(await page.locator(".follow-records").filter({hasText:"Control QA UI"}).count(),1);
    await screenshot("04-ficha");
  });
  await check("Móvil 390 y 320 píxeles: tres módulos sin desborde, navegación y teclado",async()=>{
    for(const width of [390,320]){
      await page.setViewportSize({width,height:844});
      for(const view of ["Apoderados","Casos de seguimiento","Ficha integral"]){
        await nav(view);await page.getByRole("heading",{name:view,exact:true}).first().waitFor();
        if(view==="Ficha integral"){await page.getByLabel("Estudiante de la ficha").selectOption(fixture.students[0]);await page.getByRole("heading",{name:"Camila Soto",exact:true}).waitFor();}
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
        if(width===390&&view==="Ficha integral")await page.screenshot({path:fileURLToPath(new URL("05-ficha-movil.png",output))});
      }
    }
    await page.getByRole("button",{name:"Abrir menú",exact:true}).click();await page.keyboard.press("Escape");
    await page.getByRole("button",{name:"Abrir menú",exact:true}).waitFor();
    await page.keyboard.press("Tab");assert.equal(await page.evaluate(()=>document.activeElement!==document.body),true);
  });
  await logout();await login("teacher","docente");
  await check("Docente consulta su ficha sin contactos y no edita caso de otro responsable",async()=>{
    await nav("Ficha integral");await page.getByLabel("Estudiante de la ficha").selectOption(fixture.students[0]);await page.getByRole("heading",{name:"Camila Soto",exact:true}).waitFor();
    assert.equal(await page.getByText("familia@example.test",{exact:false}).count(),0);
    assert.equal(await page.getByRole("option",{name:/Diego Vega/}).count(),0);
    await nav("Casos de seguimiento");await page.getByRole("button",{name:"Abrir caso",exact:true}).click();
    await page.getByText("Solo el docente responsable o el equipo de gestión pueden modificar este caso.",{exact:true}).waitFor();
    assert.equal(await page.getByText("Registrar intervención",{exact:true}).count(),0);
  });
  await logout();await login("student","estudiante");
  await check("Estudiante consulta ficha publicada propia sin seguimiento interno ni apoderados",async()=>{
    await nav("Ficha integral");await page.getByRole("heading",{name:"Camila Soto",exact:true}).waitFor();
    await page.getByText("Matemática · Control QA UI",{exact:true}).waitFor();
    assert.equal(await page.getByText("familia@example.test",{exact:false}).count(),0);
    assert.equal(await page.getByText("Casos de seguimiento",{exact:true}).count(),0);
    assert.equal(await page.getByText("Apoderados activos",{exact:false}).count(),0);
    await screenshot("06-estudiante-movil");assert.deepEqual(errors,[]);
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

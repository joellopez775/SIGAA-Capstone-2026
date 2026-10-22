import {test,before,after} from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import {randomBytes} from "node:crypto";
import {readFile,readdir} from "node:fs/promises";
import {once} from "node:events";
import {createApp} from "../src/app.js";
import {sampleData} from "../src/sample-data.js";
import {provisionUser} from "../src/manage-user.js";
import {matches,ruleInput} from "../src/risk-engine.js";
const adminUrl=process.env.TEST_DATABASE_URL;
if(!adminUrl)throw Error("Isolated TEST_DATABASE_URL required");
const name="sigaa_ops_test_"+randomBytes(6).toString("hex"),url=new URL(adminUrl);url.pathname="/"+name;
const origin="http://localhost:8099";
let manager,pool,server,base,fixture,session={},school,period,level,subject,course,absence,justification,alertId;
const passwords=Object.fromEntries(["admin","teacher","teacher2","student","student2","inspector","leadership"].map(k=>[k,randomBytes(20).toString("hex")]));
async function start(){server=createApp({pool,origin}).listen(0,"127.0.0.1");await once(server,"listening");base="http://127.0.0.1:"+server.address().port;}
async function stop(){if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}}
async function call(path,method="GET",body,as="admin",headers={}){
  const s=session[as];const r=await fetch(base+path,{method,headers:{"content-type":"application/json",origin,...(s?{cookie:s.cookie,"x-csrf-token":s.csrfToken}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=r.status===204?{}:await r.json();return {status:r.status,data,headers:r.headers};
}
async function ok(path,method="GET",body,as="admin",status=200){const r=await call(path,method,body,as);assert.equal(r.status,status,JSON.stringify(r.data));return r.data;}
before(async()=>{
  manager=new pg.Pool({connectionString:adminUrl});await manager.query('CREATE DATABASE "'+name+'"');
  pool=new pg.Pool({connectionString:url.href});
  const dir=new URL("../../../infra/postgres/init/",import.meta.url);
  for(const f of (await readdir(dir)).filter(f=>f.endsWith(".sql")).sort())await pool.query(await readFile(new URL(f,dir),"utf8"));
  fixture=await sampleData(pool,passwords);
  for(const [key,role] of [["inspector","INSPECTORIA"],["leadership","DIRECCION_UTP"]])
    await provisionUser(pool,{email:key+"@sigaa.local",name:key,role,password:passwords[key]});
  await start();
  for(const [key,email] of Object.entries({admin:"admin",teacher:"docente",teacher2:"docente2",student:"estudiante",student2:"estudiante2",inspector:"inspector",leadership:"leadership"})){
    const r=await call("/auth/login","POST",{email:email+"@sigaa.local",password:passwords[key]},null);
    assert.equal(r.status,200,JSON.stringify(r.data));session[key]={cookie:r.headers.get("set-cookie").split(";")[0],...r.data};
  }
});
after(async()=>{await stop();if(pool)await pool.end();if(manager){await manager.query('DROP DATABASE IF EXISTS "'+name+'"');await manager.end();}});
test("three rule boundaries, missing data and invalid parameters",()=>{
  const attendance={codigo:"ASISTENCIA_MENOR_75",activa:true,parametros:{umbral:75}};
  assert.equal(matches(attendance,75,null),false);assert.equal(matches(attendance,74.9,null),true);assert.equal(matches(attendance,null,3),false);
  const grades={codigo:"PROMEDIO_MENOR_40",activa:true,parametros:{umbral:4}};
  assert.equal(matches(grades,null,4),false);assert.equal(matches(grades,null,3.9),true);
  const combined={codigo:"RIESGO_COMBINADO",activa:true,parametros:{asistencia_menor_que:80,promedio_menor_que:4.5}};
  assert.equal(matches(combined,79,4.4),true);assert.equal(matches(combined,80,4.4),false);assert.equal(matches(combined,79,null),false);
  assert.throws(()=>ruleInput(attendance.codigo,{parameters:{umbral:101},active:true}));
  assert.throws(()=>ruleInput(grades.codigo,{parameters:{umbral:"4"},active:true}));
});
test("migration 008 is repeatable and preserves operational rows",async()=>{
  const sql=await readFile(new URL("../../../infra/postgres/init/008_school_operations.sql",import.meta.url),"utf8");
  await pool.query(sql);await pool.query(sql);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM estudiante")).rows[0].n,2);
});
test("school catalogs deny unauthenticated, student, teacher and inspector mutation",async()=>{
  assert.equal((await call("/structure","GET",undefined,null)).status,401);
  for(const role of ["student","teacher","inspector","leadership"]){
    assert.equal((await call("/structure","GET",undefined,role)).status,403);
    assert.equal((await call("/structure/schools","POST",{nombre:"No permitido"},role)).status,403);
  }
  assert.equal((await call("/structure/schools","POST",{},"admin",{"x-csrf-token":"bad"})).status,403);
});
test("school, period, level, subject, course and teacher assignment persist through API",async()=>{
  school=(await ok("/structure/schools","POST",{rbd:"TEST-888",nombre:"Colegio QA",tipo:"colegio",estado:"activo"}, "admin",201)).record;
  period=(await ok("/structure/periods","POST",{establecimiento_id:school.id,anio:2027,nombre:"Año QA",fecha_inicio:"2027-03-01",fecha_fin:"2027-12-31",estado:"activo"},"admin",201)).record;
  level=(await ok("/structure/levels","POST",{codigo:"QA-NEW",nombre:"Nivel QA",ciclo:"media",orden:11},"admin",201)).record;
  subject=(await ok("/structure/subjects","POST",{codigo:"QA-NEW",nombre:"Asignatura QA",estado:"activa"},"admin",201)).record;
  course=(await ok("/structure/courses","POST",{periodo_id:period.id,nivel_id:level.id,letra:"Z",capacidad:35,estado:"activo"},"admin",201)).record;
  const assignment=(await ok("/structure/assignments","POST",{curso_id:course.id,asignatura_id:subject.id,profesor_id:fixture.teacher.id,horas_semanales:4,estado:"activa"},"admin",201)).record;
  assert.equal(assignment.profesor_id,fixture.teacher.id);
  assert.equal((await ok("/structure")).courses.some(c=>c.id===course.id),true);
  assert.equal((await ok("/teacher/workspace","GET",undefined,"teacher")).assignments.some(a=>a.id===assignment.id),true);
});
test("catalog rejects duplicates, impossible dates, invalid relations and stale edits",async()=>{
  assert.equal((await call("/structure/schools","POST",{rbd:"TEST-888",nombre:"Duplicado",tipo:"colegio",estado:"activo"})).status,409);
  assert.equal((await call("/structure/periods","POST",{establecimiento_id:school.id,anio:2028,nombre:"Mal",fecha_inicio:"2028-02-31",fecha_fin:"2028-12-31",estado:"activo"})).status,400);
  assert.equal((await call("/structure/courses","POST",{periodo_id:period.id,nivel_id:"00000000-0000-0000-0000-000000000000",letra:"X",estado:"activo"})).status,400);
  const body={...school,nombre:"Colegio editado",expectedRevision:school.revision};
  await ok("/structure/schools/"+school.id,"PUT",body);
  assert.equal((await call("/structure/schools/"+school.id,"PUT",body)).status,409);
  const fresh=(await ok("/structure")).schools.find(s=>s.id===school.id);
  assert.equal((await call("/structure/schools/"+school.id,"PUT",{...fresh,estado:"inactivo",expectedRevision:fresh.revision})).status,409);
  assert.equal((await call("/structure/courses/"+course.id,"PUT",{...course,periodo_id:fixture.periodId,expectedRevision:course.revision})).status,409);
});
test("empty academic data generates no false alerts",async()=>{
  assert.equal((await ok("/risk/recalculate","POST",{})).activated,0);
  assert.equal((await ok("/risk/alerts")).summary.total,0);
});
test("three explainable rules activate from persisted published data without duplicates",async()=>{
  const assignments=(await pool.query("SELECT id,curso_id FROM curso_asignatura WHERE curso_id=ANY($1) ORDER BY curso_id",[fixture.courses])).rows;
  for(const a of assignments){
    const idx=fixture.courses.indexOf(a.curso_id),teacherId=[fixture.teacher.id,fixture.teacher2.id][idx];
    const s=(await pool.query(`INSERT INTO sesion_clase(curso_asignatura_id,fecha,bloque,estado,titulo,objetivo,creada_por,publicada)
      VALUES($1,'2026-10-01','QA','realizada','Prueba','Objetivo prueba',$2,TRUE) RETURNING id`,[a.id,teacherId])).rows[0];
    const attendance=(await pool.query("INSERT INTO asistencia(sesion_id,estudiante_id,estado,registrada_por) VALUES($1,$2,'ausente',$3) RETURNING *",[s.id,fixture.students[idx],teacherId])).rows[0];
    if(idx===0)absence=attendance;
    const e=(await pool.query(`INSERT INTO evaluacion(curso_asignatura_id,nombre,fecha,ponderacion,estado,creada_por,visible_estudiante)
      VALUES($1,'Control QA','2026-10-01',100,'publicada',$2,TRUE) RETURNING id`,[a.id,teacherId])).rows[0];
    await pool.query("INSERT INTO calificacion(evaluacion_id,estudiante_id,valor,registrada_por,visible_estudiante) VALUES($1,$2,3,$3,TRUE)",[e.id,fixture.students[idx],teacherId]);
  }
  const r=await ok("/risk/recalculate","POST",{});assert.equal(r.activated,6);
  await Promise.all([ok("/risk/recalculate","POST",{}),ok("/risk/recalculate","POST",{})]);
  const all=await ok("/risk/alerts");assert.equal(all.summary.total,6);assert.equal(all.summary.critical,2);
  const a=all.alerts.find(a=>a.estudiante_id===fixture.students[0]&&a.severidad==="critica");alertId=a.id;
  assert.equal(a.evidencia.attendanceTotal,1);assert.equal(a.evidencia.weightedGrade,3);assert.ok(a.evidencia.parameters);
});
test("alert access is role and course scoped; spoofed roles and student requests fail",async()=>{
  assert.equal((await call("/risk/alerts","GET",undefined,"student")).status,403);
  const t=await ok("/risk/alerts","GET",undefined,"teacher");assert.equal(t.alerts.length,3);assert.ok(t.alerts.every(a=>a.curso_id===fixture.courses[0]));
  assert.equal((await call("/risk/alerts/"+alertId+"/history","GET",undefined,"teacher2")).status,404);
  assert.equal((await call("/risk/alerts/"+alertId,"PATCH",{status:"resuelta",reason:"Acceso ajeno",expectedRevision:1},"teacher2")).status,404);
  assert.equal((await call("/risk/rules/ASISTENCIA_MENOR_75","PUT",{},"inspector")).status,403);
});
test("alert state, owner, four filters, stale revisions and audit history",async()=>{
  const a=(await ok("/risk/alerts")).alerts.find(a=>a.id===alertId);
  assert.equal((await call("/risk/alerts/"+a.id,"PATCH",{status:"asignada",reason:"Asignar para revisar",ownerId:fixture.teacher2.id,expectedRevision:a.revision})).status,400);
  await ok("/risk/alerts/"+a.id,"PATCH",{status:"asignada",reason:"Asignar para revisión real",ownerId:session.inspector.user.id,expectedRevision:a.revision});
  assert.equal((await call("/risk/alerts/"+a.id,"PATCH",{status:"resuelta",reason:"Edición desactualizada",expectedRevision:a.revision})).status,409);
  const filtered=await ok("/risk/alerts?priority=critica&status=asignada&courseId="+fixture.courses[0]+"&ownerId="+session.inspector.user.id);
  assert.equal(filtered.summary.total,1);assert.equal(filtered.alerts[0].id,a.id);
  const h=await ok("/risk/alerts/"+a.id+"/history");assert.ok(h.events.some(x=>x.action==="status_change"&&x.after.reason==="Asignar para revisión real"));
  assert.equal((await call("/risk/alerts?status=invalid")).status,400);
});
test("versioned rule configuration recalculates, rejects invalid/stale configuration",async()=>{
  const r=(await ok("/risk/rules")).rules.find(r=>r.codigo==="PROMEDIO_MENOR_40");
  const body={parameters:{umbral:2},active:true,reason:"Prueba de umbral configurable",expectedVersion:r.version};
  assert.equal((await call("/risk/rules/"+r.codigo,"PUT",{...body,parameters:{umbral:8}})).status,400);
  const changed=(await ok("/risk/rules/"+r.codigo,"PUT",body)).rule;assert.equal(changed.version,r.version+1);
  assert.equal((await call("/risk/rules/"+r.codigo,"PUT",body)).status,409);
  assert.equal((await ok("/risk/alerts?status=resuelta")).summary.total,2);
  await ok("/risk/rules/"+r.codigo,"PUT",{...body,parameters:{umbral:4},expectedVersion:changed.version});
  assert.equal((await ok("/risk/alerts")).summary.total,6);
});
test("Inspectoría records justification with evidence; duplicate and illegal writes rejected",async()=>{
  const body={attendanceId:absence.id,reason:"Documento de respaldo recibido",evidence:"Folio QA-001, custodia Inspectoría"};
  assert.equal((await call("/support/justifications","POST",body,"teacher")).status,403);
  assert.equal((await call("/support/justifications","POST",body,"student")).status,403);
  justification=(await ok("/support/justifications","POST",body,"inspector",201)).justification;
  assert.equal((await call("/support/justifications","POST",body,"inspector")).status,409);
  const own=(await ok("/support/justifications","GET",undefined,"student")).justifications;
  assert.equal(own.length,1);assert.equal(own[0].documento_url,undefined);
  assert.equal((await ok("/support/justifications","GET",undefined,"student2")).justifications.length,0);
});
test("approval atomically changes attendance, audit and alerts; concurrent double review prevented",async()=>{
  const body={status:"aceptada",reason:"Respaldo revisado y aprobado",expectedRevision:justification.revision};
  const results=await Promise.all([call("/support/justifications/"+justification.id,"PATCH",body,"inspector"),call("/support/justifications/"+justification.id,"PATCH",body,"inspector")]);
  assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  assert.equal((await pool.query("SELECT estado FROM asistencia WHERE id=$1",[absence.id])).rows[0].estado,"justificada");
  assert.equal((await ok("/risk/alerts?courseId="+fixture.courses[0]+"&status=resuelta")).summary.total,2);
  const s=(await pool.query("SELECT actualizado_en::text AS revision FROM sesion_clase WHERE id=$1",[absence.sesion_id])).rows[0];
  assert.equal((await call("/teacher/classes/"+absence.sesion_id+"/attendance","PUT",{expectedRevision:s.revision,records:[{studentId:fixture.students[0],status:"absent"}]},"teacher")).data.error,"approved_justification");
  assert.ok((await pool.query("SELECT 1 FROM evento_auditoria WHERE entidad='asistencia' AND entidad_id=$1 AND accion='justify'",[absence.id])).rowCount);
});
test("rejection preserves absence, reviewer and reason",async()=>{
  const a=(await ok("/support/absences","GET",undefined,"inspector")).absences[0];
  const j=(await ok("/support/justifications","POST",{attendanceId:a.id,reason:"Solicitud a revisar",evidence:"Folio QA-002"},"inspector",201)).justification;
  const r=(await ok("/support/justifications/"+j.id,"PATCH",{status:"rechazada",reason:"Respaldo no corresponde a fecha",expectedRevision:j.revision},"inspector")).justification;
  assert.equal(r.revisada_por,session.inspector.user.id);assert.equal(r.estado,"rechazada");
  assert.equal((await pool.query("SELECT estado FROM asistencia WHERE id=$1",[a.id])).rows[0].estado,"ausente");
});
test("catalogs, alert state, rules and justification survive application restart",async()=>{
  await stop();await start();
  assert.equal((await ok("/structure")).schools.find(s=>s.id===school.id).nombre,"Colegio editado");
  assert.equal((await ok("/risk/alerts")).summary.total,6);
  assert.equal((await ok("/support/justifications","GET",undefined,"inspector")).justifications.find(j=>j.id===justification.id).estado,"aceptada");
  assert.equal((await ok("/risk/rules")).rules.find(r=>r.codigo==="PROMEDIO_MENOR_40").version,3);
});

import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomBytes} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {once} from 'node:events';
import {createApp} from '../src/app.js';
import {sampleData} from '../src/sample-data.js';
import {provisionUser} from '../src/manage-user.js';
const adminUrl=process.env.TEST_DATABASE_URL;
if(!adminUrl)throw Error('Isolated TEST_DATABASE_URL required');
const name='sigaa_followup_test_'+randomBytes(6).toString('hex'),url=new URL(adminUrl);url.pathname='/'+name;
const origin='http://localhost:8099',session={};
let manager,pool,server,base,fixture,g1,g2,link1,link2,case1,alertId,privateNote;
const passwords=Object.fromEntries(['admin','teacher','teacher2','student','student2','inspector','leadership'].map(k=>[k,randomBytes(20).toString('hex')]));
async function start(){server=createApp({pool,origin}).listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;}
async function stop(){if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}}
async function call(path,method='GET',body,as='admin',headers={}){const s=session[as];const r=await fetch(base+path,{method,headers:{'content-type':'application/json',origin,...(s?{cookie:s.cookie,'x-csrf-token':s.csrfToken}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return {status:r.status,data:r.status===204?{}:await r.json(),headers:r.headers};}
async function ok(path,method='GET',body,as='admin',status=200){const r=await call(path,method,body,as);assert.equal(r.status,status,JSON.stringify(r.data));return r.data;}
const guardian=(code='QA-G01')=>({code,firstName:'Andrea',lastName:'Prueba',email:'familia@example.test',phone:'+56 9 1234 5678',status:'activo'});
const linking=()=>({studentId:fixture.students[0],relationship:'Madre',primary:true,active:true,notifications:true,reason:'Vínculo de prueba autorizado'});
const planning=()=>({nextAction:'Verificar avance académico',followupDate:'2026-10-31'});
const caseBody=()=>({alertId,ownerId:fixture.teacher.id,priority:'alta',reason:'Seguimiento de asistencia escolar',...planning()});
const changing=()=>({status:'en_curso',ownerId:case1.responsable_id,priority:'alta',note:'Actualización de seguimiento escolar',...planning(),expectedRevision:case1.revision});
before(async()=>{
  manager=new pg.Pool({connectionString:adminUrl});await manager.query('CREATE DATABASE "'+name+'"');pool=new pg.Pool({connectionString:url.href});
  const dir=new URL('../../../infra/postgres/init/',import.meta.url);for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await pool.query(await readFile(new URL(f,dir),'utf8'));
  fixture=await sampleData(pool,passwords);
  for(const [key,role] of [['inspector','INSPECTORIA'],['leadership','DIRECCION_UTP']])await provisionUser(pool,{email:key+'@sigaa.local',name:key,role,password:passwords[key]});
  const assignments=(await pool.query('SELECT id,curso_id FROM curso_asignatura WHERE curso_id=ANY($1)',[fixture.courses])).rows;
  for(const a of assignments){const idx=fixture.courses.indexOf(a.curso_id),teacher=[fixture.teacher.id,fixture.teacher2.id][idx];
    const s=(await pool.query("INSERT INTO sesion_clase(curso_asignatura_id,fecha,bloque,estado,titulo,objetivo,creada_por,publicada) VALUES($1,'2026-10-20','1','realizada','Clase sintética','Objetivo sintético',$2,TRUE) RETURNING id",[a.id,teacher])).rows[0];
    await pool.query("INSERT INTO asistencia(sesion_id,estudiante_id,estado,registrada_por) VALUES($1,$2,'ausente',$3)",[s.id,fixture.students[idx],teacher]);
    for(const visible of [true,false]){const e=(await pool.query("INSERT INTO evaluacion(curso_asignatura_id,nombre,fecha,ponderacion,estado,creada_por,visible_estudiante) VALUES($1,$2,'2026-10-20',50,$3,$4,$5) RETURNING id",[a.id,visible?'Control publicado':'Borrador oculto',visible?'publicada':'borrador',teacher,visible])).rows[0];await pool.query('INSERT INTO calificacion(evaluacion_id,estudiante_id,valor,registrada_por,visible_estudiante) VALUES($1,$2,3,$3,$4)',[e.id,fixture.students[idx],teacher,visible]);}
if(idx===0) for(const visibility of ['privada','equipo_docente','estudiante']){const n=(await pool.query("INSERT INTO anotacion_estudiante(estudiante_id,curso_id,curso_asignatura_id,tipo,categoria,detalle,visibilidad,registrada_por,publicada_en) VALUES($1,$2,$3,'positiva','Prueba',$4,$5::text,$6,CASE WHEN $5::text='estudiante' THEN NOW() ELSE NULL END) RETURNING id",[fixture.students[0],a.curso_id,a.id,'Detalle de prueba '+visibility,visibility,teacher])).rows[0];if(visibility==='privada')privateNote=n.id;}
  }
  await start();for(const [key,email] of Object.entries({admin:'admin',teacher:'docente',teacher2:'docente2',student:'estudiante',student2:'estudiante2',inspector:'inspector',leadership:'leadership'})){const r=await call('/auth/login','POST',{email:email+'@sigaa.local',password:passwords[key]},null);assert.equal(r.status,200);session[key]={cookie:r.headers.get('set-cookie').split(';')[0],...r.data};}
  await ok('/risk/recalculate','POST',{});alertId=(await ok('/risk/alerts')).alerts.find(a=>a.estudiante_id===fixture.students[0]).id;
});
after(async()=>{await stop();if(pool)await pool.end();if(manager){await manager.query('DROP DATABASE IF EXISTS "'+name+'"');await manager.end();}});
test('registry denies unauthenticated, student, teacher, read-only mutations and invalid CSRF',async()=>{
  assert.equal((await call('/guardians','GET',undefined,null)).status,401);
  for(const role of ['student','teacher'])assert.equal((await call('/guardians','GET',undefined,role)).status,403);
  assert.equal((await call('/guardians','POST',guardian(),'leadership')).status,403);
  assert.equal((await call('/guardians','POST',guardian(),'admin',{'x-csrf-token':'wrong'})).status,403);
});
test('guardian validation, creation, lookup, duplicates and edit revision',async()=>{
  assert.equal((await call('/guardians','POST',{...guardian(),phone:'bad'})).status,400);
  assert.equal((await call('/guardians','POST',{...guardian(),email:'invalid'})).status,400);
  g1=(await ok('/guardians','POST',guardian(),'inspector',201)).guardian;
  g2=(await ok('/guardians','POST',{...guardian('QA-G02'),firstName:'Pedro'},'admin',201)).guardian;
  assert.equal((await call('/guardians','POST',guardian())).status,409);
  assert.equal((await ok('/guardians?q=QA-G01')).total,1);
  const body={...guardian(),firstName:'Andrea editada',expectedRevision:g1.revision,reason:'Corrección de nombre registrada'};
  g1=(await ok('/guardians/'+g1.id,'PUT',body)).guardian;
  assert.equal((await call('/guardians/'+g1.id,'PUT',body)).status,409);
  assert.equal((await ok('/guardians/'+g1.id,'GET',undefined,'leadership')).history.length,2);
});
test('links enforce one primary, reject duplicates, maintain audit and cannot inactivate linked guardian',async()=>{
  assert.equal((await call('/guardians/'+g1.id+'/links','POST',{...linking(),primary:false})).status,409);
  link1=(await ok('/guardians/'+g1.id+'/links','POST',linking(),'inspector',201)).link;
  assert.equal((await call('/guardians/'+g1.id+'/links','POST',linking())).status,409);
  link2=(await ok('/guardians/'+g2.id+'/links','POST',{...linking(),relationship:'Padre'},'admin',201)).link;
  link1=(await ok('/guardians/'+g1.id)).links[0];assert.equal(link1.es_principal,false);assert.equal(link1.revision,2);
  assert.equal((await call('/guardians/'+g1.id,'PUT',{...guardian(),status:'inactivo',expectedRevision:g1.revision,reason:'Intento de desactivación'})).status,409);
  assert.equal((await call('/guardian-links/'+link2.id,'PATCH',{...linking(),active:false,primary:false,expectedRevision:link2.revision})).status,409);
});
test('concurrent primary changes are serialized without losing links',async()=>{
  const requests=await Promise.all([call('/guardian-links/'+link1.id,'PATCH',{...linking(),expectedRevision:link1.revision}),call('/guardian-links/'+link2.id,'PATCH',{...linking(),expectedRevision:link2.revision})]);
  assert.ok(requests.every(r=>[200,409].includes(r.status)));assert.ok(requests.some(r=>r.status===200));
  const links=(await pool.query('SELECT * FROM estudiante_apoderado WHERE estudiante_id=$1',[fixture.students[0]])).rows;assert.equal(links.filter(l=>l.activo&&l.es_principal).length,1);assert.equal(links.length,2);
});
test('case requires valid plan, authorized owner, open alert and unique active case',async()=>{
  assert.equal((await call('/followup/cases','POST',{...caseBody(),followupDate:'2026-02-31'})).status,400);
  assert.equal((await call('/followup/cases','POST',{...caseBody(),ownerId:fixture.teacher2.id})).status,400);
  assert.equal((await call('/followup/cases','POST',caseBody(),'student')).status,403);
  assert.equal((await call('/followup/cases','POST',caseBody(),'teacher2')).status,404);
  case1=(await ok('/followup/cases','POST',caseBody(),'teacher',201)).case;
  assert.equal((await call('/followup/cases','POST',caseBody())).status,409);
  assert.equal((await ok('/followup/cases/'+case1.id)).activities.length,1);
});
test('case lists and detail enforce live course assignment and filters',async()=>{
  assert.equal((await ok('/followup/cases','GET',undefined,'teacher')).total,1);
  assert.equal((await ok('/followup/cases','GET',undefined,'teacher2')).total,0);
  assert.equal((await call('/followup/cases/'+case1.id,'GET',undefined,'teacher2')).status,404);
  assert.equal((await call('/followup/cases/'+case1.id,'GET',undefined,'student')).status,403);
  assert.equal((await ok('/followup/cases?status=cerrado')).total,0);
  assert.equal((await ok('/followup/cases?studentId='+fixture.students[0])).total,1);
});
test('activity preserves immutable history and detects stale concurrent edits',async()=>{
  const body={note:'Intervención sintética de prueba',...planning(),expectedRevision:case1.revision};
  const results=await Promise.all([call('/followup/cases/'+case1.id+'/activities','POST',body,'teacher'),call('/followup/cases/'+case1.id+'/activities','POST',body,'teacher')]);assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
  const d=await ok('/followup/cases/'+case1.id);case1=d.case;assert.equal(d.activities.length,2);
  await assert.rejects(pool.query("UPDATE caso_actividad SET nota='Cambio ilegítimo' WHERE caso_id=$1",[case1.id]),/inmutable/);
  await assert.rejects(pool.query('DELETE FROM caso_actividad WHERE caso_id=$1',[case1.id]),/inmutable/);
});
test('case reassignment prevents teacher mutation, closure requires outcome, reopen retains history',async()=>{
  case1=(await ok('/followup/cases/'+case1.id,'PATCH',{...changing(),ownerId:session.inspector.user.id},'admin')).case;
  assert.equal((await call('/followup/cases/'+case1.id+'/activities','POST',{note:'Intento de modificación',...planning(),expectedRevision:case1.revision},'teacher')).status,403);
  assert.equal((await call('/followup/cases/'+case1.id,'PATCH',{...changing(),status:'cerrado'},'inspector')).status,400);
  case1=(await ok('/followup/cases/'+case1.id,'PATCH',{...changing(),status:'cerrado',outcome:'Resultado sintético satisfactorio'},'inspector')).case;
  assert.equal(case1.estado,'cerrado');assert.ok(case1.cerrado_en);
  assert.equal((await call('/followup/cases/'+case1.id+'/activities','POST',{note:'Actividad posterior inválida',...planning(),expectedRevision:case1.revision},'inspector')).status,409);
  case1=(await ok('/followup/cases/'+case1.id,'PATCH',changing(),'inspector')).case;
  assert.equal(case1.estado,'en_curso');assert.equal(case1.cerrado_en,null);
  const d=await ok('/followup/cases/'+case1.id);assert.deepEqual(d.activities.map(a=>a.tipo).sort(),['actividad','apertura','cambio','cierre','reapertura'].sort());
  assert.notEqual((await pool.query('SELECT estado FROM alerta WHERE id=$1',[alertId])).rows[0].estado,'resuelta');
});
test('dossier persists academic data, guardians, cases, legacy interventions and hides private annotations',async()=>{
  await pool.query("INSERT INTO intervencion(alerta_id,usuario_id,tipo,nota,resultado) VALUES($1,$2,'observacion','Registro histórico sintético','pendiente')",[alertId,fixture.admin.id]);
  const d=await ok('/students/'+fixture.students[0]+'/dossier','GET',undefined,'inspector');
  assert.equal(d.grades.length,1);assert.equal(d.attendance.length,1);assert.equal(d.cases.length,1);assert.equal(d.activities.length,5);assert.equal(d.interventions.length,1);assert.equal(d.guardians.length,2);assert.equal(d.enrollments.length,1);
  assert.equal(d.annotations.length,2);assert.ok(!d.annotations.some(a=>a.id===privateNote));assert.equal(d.guardians[0].email,'familia@example.test');
  const t=await ok('/students/'+fixture.students[0]+'/dossier','GET',undefined,'teacher');assert.equal(t.annotations.length,3);assert.ok(!('email' in t.guardians[0]));assert.ok(!('telefono' in t.guardians[0]));
});
test('student sees only own published dossier and cannot access internal records or another student',async()=>{
  const d=await ok('/students/'+fixture.students[0]+'/dossier','GET',undefined,'student');assert.equal(d.annotations.length,1);assert.equal(d.grades.length,1);assert.equal(d.attendance.length,1);
  for(const key of ['alerts','cases','activities','guardians','interventions'])assert.equal(d[key].length,0);
  assert.equal((await call('/students/'+fixture.students[1]+'/dossier','GET',undefined,'student')).status,403);
  assert.equal((await call('/students/'+fixture.students[0]+'/dossier','GET',undefined,'teacher2')).status,403);
  assert.equal((await call('/students/'+fixture.students[0]+'/dossier','GET',undefined,null)).status,401);
});
test('revoking teacher course assignment immediately removes case and dossier access',async()=>{
  await pool.query("UPDATE curso_asignatura SET estado='cerrada' WHERE profesor_id=$1",[fixture.teacher.id]);
  assert.equal((await ok('/followup/cases','GET',undefined,'teacher')).total,0);
  assert.equal((await call('/students/'+fixture.students[0]+'/dossier','GET',undefined,'teacher')).status,403);
  await pool.query("UPDATE curso_asignatura SET estado='activa' WHERE profesor_id=$1",[fixture.teacher.id]);
});
test('repeatable migration and API restart preserve records and sessions',async()=>{
  const sql=await readFile(new URL('../../../infra/postgres/init/009_followup.sql',import.meta.url),'utf8');await pool.query(sql);await pool.query(sql);
  await stop();await start();const d=await ok('/followup/cases/'+case1.id);assert.equal(d.activities.length,5);assert.equal(d.case.revision,5);
  assert.equal((await ok('/guardians')).total,2);
});
test('inactive link retains history, guardian can be deactivated after all links close',async()=>{
  for(const g of [g1,g2]){const d=await ok('/guardians/'+g.id);const l=d.links[0];if(!l.es_principal)await ok('/guardian-links/'+l.id,'PATCH',{...linking(),active:false,primary:false,expectedRevision:l.revision});}
  for(const g of [g1,g2]){const d=await ok('/guardians/'+g.id);const l=d.links[0];if(l.activo)await ok('/guardian-links/'+l.id,'PATCH',{...linking(),active:false,primary:false,expectedRevision:l.revision});}
  const d=await ok('/guardians/'+g1.id);await ok('/guardians/'+g1.id,'PUT',{...guardian(),status:'inactivo',expectedRevision:d.guardian.revision,reason:'Fin del vínculo de prueba'});
  assert.equal((await ok('/guardians/'+g1.id)).links.length,1);
  assert.equal((await call('/guardian-links/'+link1.id,'PATCH',{...linking(),expectedRevision:99})).status,409);
});

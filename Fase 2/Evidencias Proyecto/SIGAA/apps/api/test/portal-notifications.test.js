import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomBytes} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {once} from 'node:events';
import {createApp} from '../src/app.js';
import {sampleData} from '../src/sample-data.js';
import {transaction} from '../src/repository.js';
import {notifyCase} from '../src/notification-routes.js';

if(!process.env.TEST_DATABASE_URL)throw Error('Isolated TEST_DATABASE_URL required');
const name='sigaa_portal_'+randomBytes(6).toString('hex'),url=new URL(process.env.TEST_DATABASE_URL);url.pathname='/'+name;
const passwords=Object.fromEntries(['admin','teacher','teacher2','student','student2'].map(k=>[k,randomBytes(20).toString('hex')]));
const origin='http://localhost:8099',sessions={};let manager,pool,server,base,fixture,assignment,klass,caseRow,alertId;
async function start(){server=createApp({pool,origin}).listen(0,'127.0.0.1');await once(server,'listening');base='http://127.0.0.1:'+server.address().port;}
async function stop(){if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}}
async function call(path,method='GET',body,as='admin',headers={}){const s=sessions[as];const r=await fetch(base+path,{method,headers:{origin,'content-type':'application/json',...(s?{cookie:s.cookie,'x-csrf-token':s.csrfToken}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json(),headers:r.headers};}
async function ok(path,method='GET',body,as='admin',status=200){const r=await call(path,method,body,as);assert.equal(r.status,status,JSON.stringify(r.data));return r.data;}
const range='?from=2026-10-01&to=2026-10-31';
const calendar=(id=fixture.students[0])=>'/student/calendar/'+id+range;
before(async()=>{
 manager=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL});await manager.query('CREATE DATABASE "'+name+'"');pool=new pg.Pool({connectionString:url.href});
 const dir=new URL('../../../infra/postgres/init/',import.meta.url);for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await pool.query(await readFile(new URL(f,dir),'utf8'));
 fixture=await sampleData(pool,passwords);assignment=(await pool.query('SELECT id FROM curso_asignatura WHERE curso_id=$1',[fixture.courses[0]])).rows[0].id;
 await start();for(const [role,email] of Object.entries({admin:'admin',teacher:'docente',teacher2:'docente2',student:'estudiante',student2:'estudiante2'})){const r=await call('/auth/login','POST',{email:email+'@sigaa.local',password:passwords[role]},null);assert.equal(r.status,200);sessions[role]={cookie:r.headers.get('set-cookie').split(';')[0],...r.data};}
});
after(async()=>{await stop();await pool?.end();if(manager){await manager.query('DROP DATABASE IF EXISTS "'+name+'"');await manager.end();}});
test('student subjects use live enrollment and calendar denies other identities and invalid intervals',async()=>{
 const w=await ok('/student/workspace/'+fixture.students[0],'GET',undefined,'student');assert.equal(w.subjects.length,1);assert.equal(w.subjects[0].id,assignment);
 for(const as of [null,'teacher','admin','student2'])assert.equal((await call(calendar(),'GET',undefined,as)).status,as?403:401);
 for(const q of ['?from=2026-02-31&to=2026-03-01','?from=2026-01-01&to=2026-12-31','?from=2026-11-01&to=2026-10-01'])assert.equal((await call('/student/calendar/'+fixture.students[0]+q,'GET',undefined,'student')).status,400);
});
test('future class publication is explicit, audited, scoped, versioned and reversible',async()=>{
 klass=(await ok('/teacher/classes','POST',{courseSubjectId:assignment,date:'2026-10-30',block:'09:00',title:'Clase de preparación',objective:'Revisar contenidos publicados'},'teacher',201)).classSession;
 assert.equal((await ok(calendar(),'GET',undefined,'student')).events.length,0);
 const body={published:true,expectedRevision:klass.revision};
 for(const as of ['teacher2','student'])assert.equal((await call('/teacher/classes/'+klass.id+'/publication','PATCH',body,as)).status,403);
 assert.equal((await call('/teacher/classes/'+klass.id+'/publication','PATCH',body,'teacher',{'x-csrf-token':'bad'})).status,403);
 klass=(await ok('/teacher/classes/'+klass.id+'/publication','PATCH',body,'teacher')).classSession;
 assert.equal((await call('/teacher/classes/'+klass.id+'/publication','PATCH',body,'teacher')).status,409);
 let events=(await ok(calendar(),'GET',undefined,'student')).events;assert.equal(events.length,1);assert.equal(events[0].title,'Clase de preparación');
 assert.equal((await ok(calendar(fixture.students[1]),'GET',undefined,'student2')).events.length,0);
 klass=(await ok('/teacher/classes/'+klass.id+'/publication','PATCH',{published:false,expectedRevision:klass.revision},'teacher')).classSession;
 assert.equal((await ok(calendar(),'GET',undefined,'student')).events.length,0);
 klass=(await ok('/teacher/classes/'+klass.id+'/publication','PATCH',{published:true,expectedRevision:klass.revision},'teacher')).classSession;
 assert.equal(Number((await pool.query("SELECT COUNT(*) FROM evento_auditoria WHERE entidad_id=$1 AND accion IN ('publish','unpublish')",[klass.id])).rows[0].count),3);
});
test('calendar hides drafts, cancelled classes and withdrawn enrollments, preserves published grades',async()=>{
 for(const visible of [true,false])await pool.query(`INSERT INTO evaluacion(curso_asignatura_id,nombre,fecha,ponderacion,estado,creada_por,visible_estudiante) VALUES($1,$2,'2026-10-30',50,$3,$4,$5)`,[assignment,visible?'Evaluación visible':'Evaluación privada',visible?'publicada':'borrador',fixture.teacher.id,visible]);
 let events=(await ok(calendar(),'GET',undefined,'student')).events;assert.equal(events.length,2);assert.ok(!JSON.stringify(events).includes('privada'));
 await pool.query("UPDATE sesion_clase SET estado='cancelada' WHERE id=$1",[klass.id]);assert.equal((await ok(calendar(),'GET',undefined,'student')).events.length,1);
 await pool.query("UPDATE matricula SET estado='retirada' WHERE estudiante_id=$1",[fixture.students[0]]);
 assert.equal((await ok(calendar(),'GET',undefined,'student')).events.length,0);assert.equal((await ok('/student/workspace/'+fixture.students[0],'GET',undefined,'student')).subjects.length,0);
 await pool.query("UPDATE matricula SET estado='activa' WHERE estudiante_id=$1",[fixture.students[0]]);
 await pool.query("UPDATE sesion_clase SET estado='realizada' WHERE id=$1",[klass.id]);
 assert.equal((await call('/teacher/classes/'+klass.id+'/publication','PATCH',{published:false,expectedRevision:(await pool.query('SELECT actualizado_en::text AS rev FROM sesion_clase WHERE id=$1',[klass.id])).rows[0].rev},'teacher')).status,409);
});
test('case creates an internal notice for its owner, excluding actor and unrelated identities',async()=>{
 const s=(await pool.query(`INSERT INTO sesion_clase(curso_asignatura_id,fecha,bloque,estado,titulo,objetivo,creada_por,publicada) VALUES($1,'2026-10-20','A','realizada','Clase sintética','Objetivo sintético',$2,TRUE) RETURNING id`,[assignment,fixture.teacher.id])).rows[0];
 await pool.query("INSERT INTO asistencia(sesion_id,estudiante_id,estado,registrada_por) VALUES($1,$2,'ausente',$3)",[s.id,fixture.students[0],fixture.teacher.id]);
 await ok('/risk/recalculate','POST',{});alertId=(await ok('/risk/alerts')).alerts[0].id;
 caseRow=(await ok('/followup/cases','POST',{alertId,ownerId:fixture.teacher.id,priority:'alta',reason:'Antecedente privado de prueba',nextAction:'Revisar asistencia',followupDate:'2026-10-31'},'admin',201)).case;
 const inbox=await ok('/notifications','GET',undefined,'teacher');assert.equal(inbox.total,1);assert.equal(inbox.unread,1);assert.equal(inbox.notifications[0].caso_id,caseRow.id);assert.ok(!JSON.stringify(inbox).includes('Antecedente privado'));
 for(const as of ['admin','teacher2','student'])assert.equal((await ok('/notifications','GET',undefined,as)).total,0);
 assert.equal((await call('/notifications','GET',undefined,null)).status,401);
});
test('reading is recipient scoped, CSRF protected and idempotent; filters validate input',async()=>{
 const n=(await ok('/notifications','GET',undefined,'teacher')).notifications[0];
 for(const as of ['admin','teacher2','student'])assert.equal((await call('/notifications/'+n.id+'/read','PATCH',{},as)).status,404);
 assert.equal((await call('/notifications/'+n.id+'/read','PATCH',{},'teacher',{'x-csrf-token':'bad'})).status,403);
 const first=await ok('/notifications/'+n.id+'/read','PATCH',{},'teacher'),second=await ok('/notifications/'+n.id+'/read','PATCH',{},'teacher');assert.equal(first.notification.leida_en,second.notification.leida_en);
 assert.equal((await ok('/notifications?filter=unread','GET',undefined,'teacher')).total,0);
 for(const q of ['?page=0','?page=1.2','?filter=invalid'])assert.equal((await call('/notifications'+q)).status,400);
});
test('concurrent edits emit one event and notification; creator is notified when owner acts',async()=>{
 const b={note:'Intervención de prueba concurrente',nextAction:'Revisar próximos antecedentes',followupDate:'2026-10-31',expectedRevision:caseRow.revision};
 const rs=await Promise.all([call('/followup/cases/'+caseRow.id+'/activities','POST',b,'teacher'),call('/followup/cases/'+caseRow.id+'/activities','POST',b,'teacher')]);assert.deepEqual(rs.map(x=>x.status).sort(),[201,409]);
 const n=await ok('/notifications');assert.equal(n.total,1);assert.equal(n.notifications[0].tipo,'actividad');
 caseRow=(await ok('/followup/cases/'+caseRow.id)).case;
});
test('lost course access hides stored notices and prevents marking them read',async()=>{
 const n=(await ok('/notifications','GET',undefined,'teacher')).notifications[0];
 await pool.query("UPDATE curso_asignatura SET estado='cerrada' WHERE id=$1",[assignment]);
 assert.equal((await ok('/notifications','GET',undefined,'teacher')).total,0);
 assert.equal((await call('/notifications/'+n.id+'/read','PATCH',{},'teacher')).status,404);
 await pool.query("UPDATE curso_asignatura SET estado='activa' WHERE id=$1",[assignment]);
 assert.equal((await ok('/notifications','GET',undefined,'teacher')).total,1);
});
test('notification insertion is deduplicated and rolls back with its transaction',async()=>{
 const row={...caseRow,revision:100};
 await transaction(pool,async db=>{await notifyCase(db,fixture.admin,row,'cambio');await notifyCase(db,fixture.admin,row,'cambio');});
 assert.equal(Number((await pool.query('SELECT COUNT(*) FROM notificacion_interna WHERE caso_id=$1 AND revision_caso=100',[row.id])).rows[0].count),1);
 await assert.rejects(transaction(pool,async db=>{await notifyCase(db,fixture.admin,{...row,revision:101},'cambio');throw Error('rollback fixture');}),/rollback fixture/);
 assert.equal(Number((await pool.query('SELECT COUNT(*) FROM notificacion_interna WHERE revision_caso=101')).rows[0].count),0);
});
test('inbox paginates without duplication and remains persistent after migration and restart',async()=>{
 for(let i=200;i<227;i++)await notifyCase(pool,fixture.admin,{...caseRow,revision:i},'cambio');
 const one=await ok('/notifications','GET',undefined,'teacher'),two=await ok('/notifications?page=2','GET',undefined,'teacher');
 assert.equal(one.notifications.length,25);assert.equal(two.notifications.length,4);assert.equal(new Set([...one.notifications,...two.notifications].map(n=>n.id)).size,29);
 const sql=await readFile(new URL('../../../infra/postgres/init/010_internal_notifications.sql',import.meta.url),'utf8');await pool.query(sql);await pool.query(sql);
 await stop();await start();assert.equal((await ok('/notifications','GET',undefined,'teacher')).total,29);
 assert.equal((await ok('/notifications','GET',undefined,'teacher')).unread,28);
});

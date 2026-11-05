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
test('oversight denies anonymous, student and teacher access',async()=>{for(const role of [null,'student','teacher'])for(const path of ['/oversight/indicators','/oversight/audit'])assert.equal((await call(path,'GET',undefined,role)).status,role?403:401);});
test('indicators return exact database counts without personal records',async()=>{const d=await ok('/oversight/indicators');assert.equal(d.indicators.courses,Number((await pool.query("SELECT count(*) FROM curso WHERE estado='activo'")).rows[0].count));assert.equal(Object.keys(d.indicators).length,6);assert(!JSON.stringify(d).includes('@'));});
test('audit pagination, exact filters and payload privacy',async()=>{await pool.query("INSERT INTO evento_auditoria(accion,entidad,valor_nuevo) VALUES('oversight_check','test',$1)",[{privateSecret:'must-not-be-returned'}]);const d=await ok('/oversight/audit?action=oversight_check');assert.equal(d.total,1);assert.equal(d.events.length,1);assert(!JSON.stringify(d).includes('must-not-be-returned'));assert(!('valor_nuevo' in d.events[0]));assert.equal((await ok('/oversight/audit?page=2&action=oversight_check')).events.length,0);for(const q of ['page=0','page=1.2','page=no','action='+ 'a'.repeat(81)])assert.equal((await call('/oversight/audit?'+q)).status,400);});

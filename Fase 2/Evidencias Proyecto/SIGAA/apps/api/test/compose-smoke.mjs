import pg from 'pg';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {writeFile,readFile} from 'node:fs/promises';
import {sampleData} from '../src/sample-data.js';
if(process.env.SIGAA_ISOLATED_TEST!=='yes')throw new Error('Run only against an explicitly isolated disposable Compose project');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});
const base='http://web:8080/api';
const mode=process.argv[2];
if(!['seed','verify'].includes(mode))throw new Error('Specify seed or verify');
if(mode==='seed'){
 const passwords=Object.fromEntries(['admin','teacher','teacher2','student','student2'].map(k=>[k,randomBytes(20).toString('hex')]));
 await sampleData(pool,passwords);
 const cookies={};
 for(const [role,email] of Object.entries({admin:'admin',teacher:'docente',student:'estudiante'})){
  const r=await fetch(base+'/auth/login',{method:'POST',headers:{origin:'http://localhost:8088','content-type':'application/json'},body:JSON.stringify({email:email+'@sigaa.local',password:passwords[role]})});assert.equal(r.status,200);assert.equal((await r.json()).user.role,role);cookies[role]=r.headers.get('set-cookie').split(';')[0];
 }
 await writeFile('/tmp/qa-session.json',JSON.stringify(cookies),{mode:0o600});
}else{
 const cookies=JSON.parse(await readFile('/tmp/qa-session.json','utf8'));
 for(const [role,cookie] of Object.entries(cookies)){
  const r=await fetch(base+'/auth/me',{headers:{cookie}});assert.equal(r.status,200);assert.equal((await r.json()).user.role,role);
 }
}
assert.equal((await fetch(base+'/health').then(r=>r.json())).version,'0.9.1');
assert.equal((await fetch(base+'/db-health')).status,200);
assert.equal((await fetch(base+'/courses')).status,401);
assert.equal((await pool.query("SELECT value FROM app_metadata WHERE key='notifications_schema'")).rows[0].value,'1');
assert.equal((await pool.query('SELECT count(*)::int AS n FROM usuario')).rows[0].n,5);
console.log(JSON.stringify({mode,result:'passed',health:'0.9.1',database:'healthy',roles:['admin','teacher','student'],anonymousCourses:401,users:5,notificationsSchema:1}));
await pool.end();

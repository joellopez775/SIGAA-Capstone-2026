import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const origin=process.env.SIGAA_ORIGIN||'https://sigaa.ignisert.com';
assert(origin.startsWith('https://'));
const accounts={...JSON.parse(await readFile(new URL('.secrets/hosted-accounts.json',root))),...JSON.parse(await readFile(new URL('.secrets/operations-accounts.json',root)))};
const checks=[];
let anotherStudent;
for(const role of ['admin','inspector','teacher','student']){
  const login=await fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(accounts[role])});
  assert.equal(login.status,200,role+' login');
  const {user,csrfToken}=await login.json();assert.equal(user.role,role);
  const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
  const get=async(path,status=200)=>{const r=await fetch(origin+'/api'+path,{headers:{Cookie:cookie}});assert.equal(r.status,status,role+' '+path);return r.json();};
  try{
    if(role==='admin'){
      const s=await get('/structure');assert.equal(s.courses.length,4);assert.equal(s.teachers.length,4);assert.equal(s.assignments.length,16);
      checks.push({role,result:'passed',courses:4,teachers:4,assignments:16});
    }
    if(role==='inspector'){
      const a=await get('/risk/alerts'),j=await get('/support/justifications');
      assert.equal(a.summary.total,80);assert.equal(j.justifications.length,12);await get('/structure',403);
      checks.push({role,result:'passed',alerts:80,justifications:12,adminAccessDenied:true});
    }
    if(role==='teacher'){
      const w=await get('/teacher/workspace');assert.equal(w.assignments.length,4);
      for(const a of w.assignments){const r=await get('/teacher/assignments/'+a.id+'/records');assert.equal(r.students.length,20);assert(r.classes.length>=6);assert.equal(r.grades.length,40);assert.equal(r.attendance.length,80);assert.equal(r.annotations.length,40);anotherStudent=r.students[0].id;}
      await get('/structure',403);checks.push({role,result:'passed',assignments:4,studentsPerCourse:20,gradesPerSubject:40});
    }
    if(role==='student'){
      const s=await get('/student/workspace/'+user.studentId);assert.equal(s.grades.length,8);assert.equal(s.attendance.length,16);assert.equal(s.annotations.length,2);
      assert.notEqual(anotherStudent,user.studentId);await get('/student/workspace/'+anotherStudent,403);await get('/structure',403);await get('/teacher/workspace',403);
      checks.push({role,result:'passed',grades:8,attendance:16,annotations:2,otherStudentDenied:true,teacherAndAdminDenied:true});
    }
  }finally{
    const logout=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json','x-csrf-token':csrfToken},body:'{}'});assert.equal(logout.status,204);
  }
}
const report={date:new Date().toISOString(),origin,checks,academicWrites:false,result:'passed'};
await writeFile(new URL('output/evidence/synthetic-demo-api-tests.json',root),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));

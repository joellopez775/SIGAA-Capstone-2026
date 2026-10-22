// Explicitly provision the two requested demonstration accounts, atomically.
import pg from 'pg';
import { hashPassword } from './security.js';
import { transaction, audit } from './repository.js';
let input = '';
for await (const part of process.stdin) input += part;
const accounts = JSON.parse(input);
const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
try {
  const hashes = {};
  for (const key of ['teacher', 'student']) hashes[key] = await hashPassword(accounts[key].password);
  await transaction(pool, async db => {
    const existing = await db.query('SELECT id FROM usuario WHERE email=ANY($1::citext[])', [[accounts.teacher.email, accounts.student.email]]);
    if (existing.rowCount) throw new Error('Accounts already exist; no duplicates or password resets performed');
    const one = async (sql, args=[]) => (await db.query(sql, args)).rows[0];
    const site = await one("INSERT INTO establecimiento(nombre,tipo) VALUES('Liceo Demostración SIGAA','liceo') RETURNING id");
    const period = await one("INSERT INTO periodo_escolar(establecimiento_id,anio,nombre,fecha_inicio,fecha_fin,estado) VALUES($1,2026,'Demo escolar 2026','2026-03-01','2026-12-31','activo') RETURNING id",[site.id]);
    const level = await one("INSERT INTO nivel_educativo(codigo,nombre,ciclo,orden) VALUES('DEMO-M2','2° Medio (demo)','media',10) ON CONFLICT(codigo) DO UPDATE SET nombre=EXCLUDED.nombre RETURNING id");
    const course = await one("INSERT INTO curso(periodo_id,nivel_id,letra,estado,capacidad) VALUES($1,$2,'A','activo',35) RETURNING id",[period.id,level.id]);
    const users = {};
    for (const [key,name,role] of [['teacher','Docente Demo SIGAA','PROFESOR_ASIGNATURA'],['student','Estudiante Demo SIGAA','ESTUDIANTE']]) {
      users[key] = await one('INSERT INTO usuario(email,nombre,password_hash) VALUES($1,$2,$3) RETURNING id',[accounts[key].email,name,hashes[key]]);
      await db.query('INSERT INTO usuario_rol(usuario_id,rol_id) SELECT $1,id FROM rol WHERE codigo=$2',[users[key].id,role]);
      await audit(db,null,'provision_demo','usuario',users[key].id,null,{email:accounts[key].email,role,synthetic:true});
    }
    const student = await one("INSERT INTO estudiante(identificador_interno,nombres,apellidos,usuario_id) VALUES('DEMO-SERVER-001','Estudiante','Demo SIGAA',$1) RETURNING id",[users.student.id]);
    await db.query('INSERT INTO matricula(estudiante_id,curso_id) VALUES($1,$2)',[student.id,course.id]);
    const subject = await one("INSERT INTO asignatura(codigo,nombre) VALUES('DEMO-MAT','Matemática (demostración)') ON CONFLICT(codigo) DO UPDATE SET nombre=EXCLUDED.nombre RETURNING id");
    await db.query("INSERT INTO curso_asignatura(curso_id,asignatura_id,profesor_id,estado) VALUES($1,$2,$3,'activa')",[course.id,subject.id,users.teacher.id]);
  });
  console.log('Two demonstration accounts provisioned; course and enrollment linked. No grades invented.');
} finally { await pool.end(); }

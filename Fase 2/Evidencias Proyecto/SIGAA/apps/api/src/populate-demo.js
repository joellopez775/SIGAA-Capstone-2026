// Additive synthetic school dataset. Never resets a database or changes a password.
import pg from 'pg';
import { createHash } from 'node:crypto';
import { matches, ruleCodes } from './risk-engine.js';

const BATCH = 'SIGAA-DEMO-2026-10';
const cutoff = '2026-10-15';
const args = process.argv.slice(2);
if (!args.includes('--inspect') && !args.includes('--dry-run') && !args.includes('--apply-demo'))
  throw new Error('Use --inspect, --dry-run or --apply-demo SIGAA-DEMO-2026-10');
if (args.includes('--apply-demo') && args[args.indexOf('--apply-demo') + 1] !== BATCH)
  throw new Error('Explicit demo batch confirmation required');
const url = new URL(process.env.DATABASE_URL);
const testDb = args.find(x => x.startsWith('--test-database='))?.split('=')[1];
if (testDb) {
  if (!/^sigaa_demo_check_[0-9]+$/.test(testDb)) throw new Error('Invalid isolated database name');
  url.pathname = '/' + testDb;
}
const pool = new pg.Pool({ connectionString: url.toString() });
const db = await pool.connect();
const tables = ['usuario','usuario_rol','establecimiento','periodo_escolar','nivel_educativo','curso','asignatura','curso_asignatura','funcionario','asignacion_docente','profesor_jefatura','estudiante','matricula','apoderado','estudiante_apoderado','sesion_clase','asistencia','evaluacion','calificacion','anotacion_estudiante','comunicacion_estudiante','justificacion_ausencia','regla_alerta','alerta','intervencion','evento_auditoria'];
const id = key => {const h=createHash('sha256').update(BATCH+':'+key).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;};
const one = async (sql, params=[]) => (await db.query(sql,params)).rows[0];
const counts = async () => Object.fromEntries(await Promise.all(tables.map(async t=>[t,Number((await one(`SELECT count(*) AS n FROM ${t}`)).n)])));
const insert = async (table,key,values) => {
  if(!tables.includes(table))throw new Error('Unapproved table');
  const cols=['id',...Object.keys(values)], vals=[id(key),...Object.values(values)];
  return await one(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${vals.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT(id) DO NOTHING RETURNING *`,vals)
    || await one(`SELECT * FROM ${table} WHERE id=$1`,[id(key)]);
};
const day = (monday,offset) => {const d=new Date(monday+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10);};
try {
  await db.query('BEGIN');
  if(args.includes('--inspect')) {
    console.log(JSON.stringify({batch:BATCH,counts:await counts(),alreadyApplied:Boolean(await one('SELECT id FROM evento_auditoria WHERE id=$1',[id('batch-audit')]))}));
    await db.query('ROLLBACK');
  } else {
    await db.query("SET LOCAL lock_timeout='10s'");
    await db.query("SET LOCAL statement_timeout='120s'");
    await db.query('SELECT pg_advisory_xact_lock(20261015)');
    await db.query(`LOCK TABLE ${tables.join(',')} IN SHARE ROW EXCLUSIVE MODE`);
    const existingBatch=await one('SELECT valor_nuevo FROM evento_auditoria WHERE id=$1',[id('batch-audit')]);
    if(existingBatch){
      console.log(JSON.stringify({batch:BATCH,alreadyApplied:true,changed:false,counts:await counts()}));
      await db.query('ROLLBACK');
    } else {
      const before=await counts();
      const fingerprints={};
      for(const t of tables)fingerprints[t]=(await db.query(`SELECT id,md5(to_jsonb(t)::text) AS hash FROM ${t} t ORDER BY id`)).rows;
      const teacher=await one("SELECT id FROM usuario WHERE email='docente@sigaa.demo' AND estado='activo'");
      const inspector=await one("SELECT id FROM usuario WHERE email='inspectoria@sigaa.demo' AND estado='activo'");
      const admin=await one("SELECT id FROM usuario WHERE email='administracion@sigaa.demo' AND estado='activo'");
      const student=await one("SELECT e.* FROM estudiante e JOIN usuario u ON u.id=e.usuario_id WHERE u.email='estudiante@sigaa.demo' AND e.identificador_interno='DEMO-SERVER-001'");
      if(!teacher||!inspector||!admin||!student)throw new Error('Expected existing demo accounts not found');
      const context=await one(`SELECT c.*,p.fecha_inicio::text AS period_start,p.fecha_fin::text AS period_end,p.anio,
        p.establecimiento_id,est.nombre AS school FROM matricula m JOIN curso c ON c.id=m.curso_id
        JOIN periodo_escolar p ON p.id=c.periodo_id JOIN establecimiento est ON est.id=p.establecimiento_id
        WHERE m.estudiante_id=$1 AND m.estado='activa' AND c.estado='activo' AND p.estado='activo'`,[student.id]);
      if(context?.school!=='Liceo Demostración SIGAA'||context.anio!==2026||context.capacidad<20)
        throw new Error('Not the expected synthetic demo school');
      if(Number((await one("SELECT count(*) AS n FROM matricula WHERE curso_id=$1 AND estado='activa'",[context.id])).n)!==1)
        throw new Error('Demo course changed: review capacity/data before loading');
      const now=new Date().toISOString();
      const staff=[teacher];
      for(const [i,name] of ['Valentina Torres','Sebastián Ríos','Catalina Fuentes'].entries()) {
        // Active staff records without a password cannot log in. Existing demo logins are untouched.
        const u=await insert('usuario','teacher-'+i,{email:`docente${i+2}@sigaa.invalid`,nombre:name+' (DEMO)',password_hash:null});
        await insert('usuario_rol','teacher-role-'+i,{usuario_id:u.id,rol_id:(await one("SELECT id FROM rol WHERE codigo='PROFESOR_ASIGNATURA'")).id});
        staff.push(u);
      }
      const employees=[];
      for(const [i,u] of staff.entries()) employees.push(await one('SELECT * FROM funcionario WHERE usuario_id=$1',[u.id])||await insert('funcionario','employee-'+i,{usuario_id:u.id,nombres:['Docente Demo','Valentina','Sebastián','Catalina'][i],apellidos:['SIGAA','Torres (DEMO)','Ríos (DEMO)','Fuentes (DEMO)'][i],email_institucional:`docente${i+1}@sigaa.invalid`}));
      const courses=[context];
      for(const n of [1,3,4]){
        const level=await insert('nivel_educativo','level-'+n,{codigo:`DEMO-COMP-M${n}`,nombre:`${n}° Medio (DEMO)`,ciclo:'media',orden:n+8});
        courses.push(await insert('curso','course-'+n,{periodo_id:context.periodo_id,nivel_id:level.id,letra:'A',jornada:'completa',sala:'D-'+n,profesor_jefe_id:teacher.id,capacidad:30,estado:'activo'}));
      }
      const subjects=[];
      for(const [s,[code,name]] of [['DEMO-MAT','Matemática (DEMO)'],['DEMO-COMP-LEN','Lengua y Literatura (DEMO)'],['DEMO-COMP-HIS','Historia (DEMO)'],['DEMO-COMP-CIE','Ciencias Naturales (DEMO)']].entries())
        subjects.push(await one('SELECT * FROM asignatura WHERE codigo=$1',[code])||await insert('asignatura','subject-'+s,{codigo:code,nombre:name}));
      const firstNames=['Martina','Benjamín','Sofía','Vicente','Isidora','Joaquín','Emilia','Agustín','Florencia','Lucas','Antonia','Tomás','Catalina','Mateo','Valentina','Gabriel','Trinidad','Nicolás','Amanda','Diego'];
      const surnames=['Rojas','Soto','Vega','Torres','Muñoz','Silva','Morales','Castro','Fuentes','Herrera','Navarro','Pérez','Díaz','Reyes','Contreras','González','Sepúlveda','Araya','Pinto','Vargas'];
      const rosters=[], assignments=[];
      for(const [ci,course] of courses.entries()){
        const head=await one('SELECT * FROM profesor_jefatura WHERE curso_id=$1 AND vigente_hasta IS NULL',[course.id]);
        if(head&&head.funcionario_id!==employees[0].id)throw new Error('Existing head teacher differs');
        if(!head)await insert('profesor_jefatura','head-'+ci,{curso_id:course.id,funcionario_id:employees[0].id,vigente_desde:context.period_start});
        const roster=[];
        for(let si=0;si<20;si++){
          const e=ci===0&&si===0?student:await insert('estudiante',`student-${ci}-${si}`,{identificador_interno:`DEMO-COMP-${ci+1}-${String(si+1).padStart(3,'0')}`,nombres:firstNames[si],apellidos:surnames[(si+ci*3)%20]+' Demo',fecha_nacimiento:`${2011-ci}-06-${String(si+1).padStart(2,'0')}`,email_institucional:`alumno${ci+1}.${si+1}@sigaa.invalid`,creado_por:admin.id});
          roster.push(e);
          if(!(ci===0&&si===0))await insert('matricula',`enroll-${ci}-${si}`,{estudiante_id:e.id,curso_id:course.id,numero_matricula:`DEMO-2026-${ci+1}-${si+1}`,creado_por:admin.id});
          const guardian=await insert('apoderado',`guardian-${ci}-${si}`,{nombres:'Apoderado ficticio '+(si+1),apellidos:surnames[(si+ci*3)%20]+' Demo',email:`apoderado${ci+1}.${si+1}@sigaa.invalid`});
          await insert('estudiante_apoderado',`guardian-link-${ci}-${si}`,{estudiante_id:e.id,apoderado_id:guardian.id,parentesco:'Tutor (DEMO)',es_principal:true,recibe_notificaciones:false});
          await insert('comunicacion_estudiante',`message-${ci}-${si}`,{estudiante_id:e.id,curso_id:course.id,tipo:'recordatorio',titulo:'[DEMO] Próximas actividades',detalle:'Información ficticia para demostrar el portal. Revisa tus clases y evaluaciones; no corresponde a un estudiante real.',estado:'publicada',visible_desde:now,creada_por:teacher.id});
        }
        rosters.push(roster);
        for(let s=0;s<subjects.length;s++){
          const ca=await one('SELECT * FROM curso_asignatura WHERE curso_id=$1 AND asignatura_id=$2',[course.id,subjects[s].id])||await insert('curso_asignatura',`assignment-${ci}-${s}`,{curso_id:course.id,asignatura_id:subjects[s].id,profesor_id:staff[s].id,horas_semanales:4,estado:'activa'});
          if(ca.profesor_id!==staff[s].id)throw new Error('Existing teacher assignment differs');
          if(!await one('SELECT id FROM asignacion_docente WHERE curso_asignatura_id=$1 AND funcionario_id=$2 AND vigente_hasta IS NULL',[ca.id,employees[s].id]))await insert('asignacion_docente',`staff-assignment-${ci}-${s}`,{curso_asignatura_id:ca.id,funcionario_id:employees[s].id,vigente_desde:context.period_start});
          assignments.push(ca.id);
          const dates=['2026-09-14','2026-09-21','2026-09-28','2026-10-05','2026-10-19','2026-10-26'].map(d=>day(d,ci));
          for(const [wi,date] of dates.entries()){
            const past=wi<4;
            const lesson=await insert('sesion_clase',`class-${ci}-${s}-${wi}`,{curso_asignatura_id:ca.id,fecha:date,bloque:`DEMO-${s+1}`,estado:past?'realizada':'programada',titulo:`[DEMO] ${past?'Taller':'Próxima clase'} ${wi+1}: ${subjects[s].nombre}`,objetivo:'Ejercitar contenidos y colaboración en un escenario escolar ficticio.',contenido:'Material sintético de demostración. Sin datos de personas reales.',hora_inicio:`${String(8+s*2).padStart(2,'0')}:00`,hora_fin:`${String(9+s*2).padStart(2,'0')}:30`,sala:'D-'+(ci+1),creada_por:staff[s].id,publicada:true,publicada_en:now});
            if(past)for(const [si,e] of roster.entries()){
              let status=si%5===1?(wi===3?'presente':'ausente'):si%5===3?(wi<2?'ausente':'presente'):(si===0&&wi===2?'ausente':(si+wi)%11===0?'atraso':'presente');
              // Three inspector cases per course, scoped to one subject and one lesson.
              const justification=s===0&&wi===0&&[1,2,3].includes(si);
              if(justification)status=si===2?'justificada':'ausente';
              await insert('asistencia',`attendance-${ci}-${s}-${wi}-${si}`,{sesion_id:lesson.id,estudiante_id:e.id,estado:status,observacion:'[DEMO] Registro sintético para pruebas funcionales.',registrada_por:staff[s].id});
              if(justification)await insert('justificacion_ausencia',`justification-${ci}-${si}`,{estudiante_id:e.id,sesion_id:lesson.id,fecha_desde:date,fecha_hasta:date,motivo:'[DEMO] Motivo ficticio de ausencia para probar Inspectoría.',estado:si===1?'pendiente':si===2?'aceptada':'rechazada',registrada_por:inspector.id,revisada_por:si===1?null:inspector.id,revisada_en:si===1?null:now,observacion_revision:si===1?null:'[DEMO] Resolución simulada, no corresponde a un trámite real.'});
            }
          }
          if(Number((await one("SELECT COALESCE(sum(ponderacion),0) AS n FROM evaluacion WHERE curso_asignatura_id=$1 AND estado<>'anulada'",[ca.id])).n)>0)
            throw new Error('Existing evaluations: no weights or grades overwritten');
          for(let ei=0;ei<3;ei++){
            const published=ei<2;
            const ev=await insert('evaluacion',`evaluation-${ci}-${s}-${ei}`,{curso_asignatura_id:ca.id,nombre:`[DEMO] ${['Control de contenidos','Trabajo aplicado','Evaluación próxima'][ei]}`,descripcion:'Evaluación ficticia para recorrer el sistema.',fecha:dates[[2,3,5][ei]],ponderacion:[30,30,40][ei],estado:published?'publicada':'borrador',creada_por:staff[s].id,visible_estudiante:published,publicada_por:published?staff[s].id:null,publicada_en:published?now:null});
            if(published)for(const [si,e] of roster.entries())await insert('calificacion',`grade-${ci}-${s}-${ei}-${si}`,{evaluacion_id:ev.id,estudiante_id:e.id,valor:si%5===1?3+ei*0.3:si%5===2?3.3+ei*0.2:4.5+((si+s+ei)%24)/10,registrada_por:staff[s].id,visible_estudiante:true,publicada_por:staff[s].id,publicada_en:now});
          }
          if(s===0)for(const [si,e] of roster.entries())for(const type of ['positiva','negativa'])await insert('anotacion_estudiante',`annotation-${ci}-${si}-${type}`,{estudiante_id:e.id,curso_id:course.id,curso_asignatura_id:ca.id,tipo:type,categoria:type==='positiva'?'Colaboración (DEMO)':'Responsabilidad (DEMO)',detalle:type==='positiva'?'[DEMO] Colaboró activamente en la actividad grupal. Situación ficticia.':'[DEMO] No presentó el material de la actividad. Situación ficticia, sin efecto disciplinario.',visibilidad:'estudiante',registrada_por:teacher.id,publicada_por:teacher.id,publicada_en:now});
        }
      }
      // Calculate only this demo cohort; never recalculate/update unrelated live alerts.
      const rules=(await db.query('SELECT DISTINCT ON(codigo) * FROM regla_alerta WHERE codigo=ANY($1) ORDER BY codigo,version DESC',[ruleCodes])).rows;
      let newAlerts=0;
      for(const [ci,course] of courses.entries())for(const [si,e] of rosters[ci].entries()){
        const a=await one(`SELECT count(*) FILTER(WHERE a.estado IN ('presente','atraso','ausente'))::int total,
          count(*) FILTER(WHERE a.estado IN ('presente','atraso'))::int present FROM asistencia a JOIN sesion_clase s ON s.id=a.sesion_id
          JOIN curso_asignatura ca ON ca.id=s.curso_asignatura_id WHERE a.estudiante_id=$1 AND ca.curso_id=$2 AND s.publicada AND s.estado='realizada' AND s.fecha<=$3`,[e.id,course.id,cutoff]);
        const g=await one(`SELECT SUM(g.valor*v.ponderacion)/NULLIF(SUM(v.ponderacion),0) average,count(*)::int n FROM calificacion g
          JOIN evaluacion v ON v.id=g.evaluacion_id JOIN curso_asignatura ca ON ca.id=v.curso_asignatura_id
          WHERE g.estudiante_id=$1 AND ca.curso_id=$2 AND g.visible_estudiante AND v.visible_estudiante AND v.estado IN ('publicada','cerrada') AND v.fecha<=$3`,[e.id,course.id,cutoff]);
        const attendance=a.total?100*a.present/a.total:null,grade=g.average===null?null:Number(g.average);
        for(const rule of rules)if(matches(rule,attendance,grade)){
          const engineKey=[e.id,course.id,rule.codigo].join(':');
          if(await one('SELECT id FROM alerta WHERE engine_key=$1',[engineKey]))continue;
          const state=si%3===0?'asignada':si%3===1?'abierta':'en_seguimiento';
          const alert=await insert('alerta',`alert-${ci}-${si}-${rule.codigo}`,{estudiante_id:e.id,curso_id:course.id,regla_id:rule.id,responsable_id:state==='abierta'?null:inspector.id,severidad:rule.codigo==='RIESGO_COMBINADO'?'critica':'alta',estado:state,titulo:'[DEMO] '+rule.nombre,engine_key:engineKey,evidencia:{synthetic:true,batch:BATCH,ruleCode:rule.codigo,ruleVersion:rule.version,parameters:rule.parametros,attendancePercent:attendance,attendanceTotal:a.total,attendancePresent:a.present,weightedGrade:grade,publishedGrades:g.n,definition:'Indicador preventivo de datos ficticios, no promedio oficial.',explanation:'[DEMO] Datos sintéticos bajo el umbral configurado.',calculatedAt:now}});
          newAlerts++;
          if(state!=='abierta')await insert('intervencion',`intervention-${ci}-${si}-${rule.codigo}`,{alerta_id:alert.id,usuario_id:inspector.id,tipo:'observacion',nota:'[DEMO] Seguimiento ficticio para recorrer la bandeja. No se realizó entrevista ni contacto con personas.',fecha_seguimiento:'2026-10-20',resultado:'pendiente'});
        }
      }
      for(const t of tables){
        const old=fingerprints[t];if(!old.length)continue;
        const current=(await db.query(`SELECT id,md5(to_jsonb(t)::text) AS hash FROM ${t} t WHERE id=ANY($1::uuid[]) ORDER BY id`,[old.map(x=>x.id)])).rows;
        if(JSON.stringify(current)!==JSON.stringify(old))throw new Error('Existing rows changed in '+t);
      }
      const invalid=(await one(`SELECT count(*) AS n FROM calificacion g JOIN evaluacion e ON e.id=g.evaluacion_id JOIN curso_asignatura ca ON ca.id=e.curso_asignatura_id WHERE NOT EXISTS(SELECT 1 FROM matricula m WHERE m.estudiante_id=g.estudiante_id AND m.curso_id=ca.curso_id AND m.estado='activa')`)).n;
      if(Number(invalid))throw new Error('Grade/enrollment consistency failed');
      const report={batch:BATCH,synthetic:true,cutoff,courses:4,students:80,teachers:4,assignments:assignments.length,newAlerts,existingRowsPreserved:true,before,after:await counts(),dryRun:args.includes('--dry-run')};
      report.after.evento_auditoria+=1;
      await insert('evento_auditoria','batch-audit',{usuario_id:admin.id,accion:'populate_synthetic_demo',entidad:'demo_dataset',valor_nuevo:report,motivo:'Carga ficticia autorizada para demostración; no representa actividades escolares reales.',origen:'demo_seed'});
      await db.query(args.includes('--dry-run')?'ROLLBACK':'COMMIT');
      console.log(JSON.stringify(report));
    }
  }
} catch(error){await db.query('ROLLBACK');console.error(JSON.stringify({batch:BATCH,error:error.code||error.message,rolledBack:true}));process.exitCode=1;}
finally{db.release();await pool.end();}

import { fail, audit, teacherCourse } from "./repository.js";
export const ruleCodes = ["ASISTENCIA_MENOR_75","PROMEDIO_MENOR_40","RIESGO_COMBINADO"];
export function ruleInput(code, body) {
  const p=body?.parameters;
  const number=(v,min,max)=>typeof v==="number"&&Number.isFinite(v)&&v>=min&&v<=max;
  if(!ruleCodes.includes(code)||!p||typeof body.active!=="boolean") fail(400,"invalid_rule");
  let parameters;
  if(code==="ASISTENCIA_MENOR_75"&&number(p.umbral,1,100))
    parameters={operador:"menor_que",umbral:p.umbral,unidad:"porcentaje"};
  if(code==="PROMEDIO_MENOR_40"&&number(p.umbral,1,7))
    parameters={operador:"menor_que",umbral:p.umbral,escala:"1.0-7.0"};
  if(code==="RIESGO_COMBINADO"&&number(p.asistencia_menor_que,1,100)&&number(p.promedio_menor_que,1,7))
    parameters={asistencia_menor_que:p.asistencia_menor_que,promedio_menor_que:p.promedio_menor_que};
  if(!parameters) fail(400,"invalid_rule");
  return parameters;
}
export function matches(rule, attendance, grade) {
  if(!rule.activa) return false;
  if(rule.codigo==="ASISTENCIA_MENOR_75") return attendance!==null&&attendance<rule.parametros.umbral;
  if(rule.codigo==="PROMEDIO_MENOR_40") return grade!==null&&grade<rule.parametros.umbral;
  return attendance!==null&&grade!==null&&attendance<rule.parametros.asistencia_menor_que&&grade<rule.parametros.promedio_menor_que;
}
export const scope = user => user.role==="teacher"?teacherCourse:"$1::uuid IS NOT NULL";
export async function recalculate(db,user) {
  await db.query("SELECT pg_advisory_xact_lock(8009)");
  const rules=(await db.query("SELECT DISTINCT ON(codigo) * FROM regla_alerta WHERE codigo=ANY($1) ORDER BY codigo,version DESC",[ruleCodes])).rows;
  const records=(await db.query(`SELECT e.id AS student_id,c.id AS course_id,
      a.total,a.present,g.average,g.grade_count
    FROM matricula m JOIN estudiante e ON e.id=m.estudiante_id JOIN curso c ON c.id=m.curso_id
    JOIN periodo_escolar p ON p.id=c.periodo_id JOIN establecimiento est ON est.id=p.establecimiento_id
    LEFT JOIN LATERAL (
      SELECT COUNT(*) FILTER(WHERE x.estado IN ('presente','atraso','ausente'))::int AS total,
        COUNT(*) FILTER(WHERE x.estado IN ('presente','atraso'))::int AS present
      FROM asistencia x JOIN sesion_clase s ON s.id=x.sesion_id JOIN curso_asignatura ca ON ca.id=s.curso_asignatura_id
      WHERE x.estudiante_id=e.id AND ca.curso_id=c.id AND s.estado='realizada' AND s.publicada
      AND s.fecha<=(NOW() AT TIME ZONE 'America/Santiago')::date
    ) a ON TRUE
    LEFT JOIN LATERAL (
      SELECT SUM(x.valor*v.ponderacion)/NULLIF(SUM(v.ponderacion),0) AS average,COUNT(*)::int AS grade_count
      FROM calificacion x JOIN evaluacion v ON v.id=x.evaluacion_id JOIN curso_asignatura ca ON ca.id=v.curso_asignatura_id
      WHERE x.estudiante_id=e.id AND ca.curso_id=c.id AND x.visible_estudiante AND v.visible_estudiante
      AND v.estado IN ('publicada','cerrada') AND v.fecha<=(NOW() AT TIME ZONE 'America/Santiago')::date
    ) g ON TRUE
    WHERE m.estado='activa' AND e.estado='regular' AND c.estado='activo' AND p.estado='activo' AND est.estado='activo'
      AND ${scope(user)} ORDER BY c.id,e.id`,[user.id])).rows;
  const seen=new Set();
  let activated=0,resolved=0;
  for(const record of records) for(const rule of rules) {
    const key=[record.student_id,record.course_id,rule.codigo].join(":");
    seen.add(key);
    const attendance=record.total?100*record.present/record.total:null;
    const grade=record.average===null?null:Number(record.average);
    const triggered=matches(rule,attendance,grade);
    const old=(await db.query("SELECT * FROM alerta WHERE engine_key=$1 FOR UPDATE",[key])).rows[0];
    if(!triggered&&!old) continue;
    const evidence={
      ruleCode:rule.codigo,ruleVersion:rule.version,parameters:rule.parametros,
      attendancePercent:attendance,attendanceTotal:record.total,attendancePresent:record.present,
      weightedGrade:grade,publishedGrades:record.grade_count,
      definition:"Indicador preventivo, no promedio oficial. Presente y atraso cuentan como asistencia; justificadas y pendientes se excluyen. Notas publicadas ponderadas del curso.",
      explanation:!rule.activa?"Regla desactivada":triggered?"Datos por debajo del umbral configurado":"Los datos ya no activan la regla o son insuficientes",
      calculatedAt:new Date().toISOString(),
    };
    const state=triggered?(old?.estado==="descartada"?"descartada":old&&old.estado!=="resuelta"?old.estado:"abierta"):"resuelta";
    const severity=rule.codigo==="RIESGO_COMBINADO"?"critica":"alta";
    let row;
    if(old) row=(await db.query(`UPDATE alerta SET regla_id=$2,severidad=$3,estado=$4::text,titulo=$5,evidencia=$6,
      resuelta_en=CASE WHEN $4::text IN ('resuelta','descartada') THEN COALESCE(resuelta_en,NOW()) ELSE NULL END,revision=revision+1
      WHERE id=$1 RETURNING *`,[old.id,rule.id,severity,state,rule.nombre,evidence])).rows[0];
    else row=(await db.query(`INSERT INTO alerta(estudiante_id,curso_id,regla_id,severidad,estado,titulo,evidencia,engine_key)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[record.student_id,record.course_id,rule.id,severity,state,rule.nombre,evidence,key])).rows[0];
    await audit(db,user.id,"risk_recalculate","alerta",row.id,old,row);
    if(triggered) activated++; else if(old.estado!=="resuelta") resolved++;
  }
  const stale=(await db.query(`SELECT a.* FROM alerta a JOIN curso c ON c.id=a.curso_id
    WHERE a.engine_key IS NOT NULL AND a.estado NOT IN ('resuelta','descartada') AND ${scope(user)} FOR UPDATE OF a`,[user.id])).rows;
  for(const old of stale) if(!seen.has(old.engine_key)) {
    const row=(await db.query(`UPDATE alerta SET estado='resuelta',resuelta_en=NOW(),revision=revision+1,
      evidencia=evidencia||'{"explanation":"Matrícula o contexto escolar ya no vigente"}'::jsonb WHERE id=$1 RETURNING *`,[old.id])).rows[0];
    await audit(db,user.id,"risk_context_closed","alerta",old.id,old,row);resolved++;
  }
  return {evaluated:records.length,rules:rules.length,activated,resolved};
}

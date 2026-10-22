import { fail, requireId, transaction, audit, teacherCourse } from "./repository.js";
import { text } from "./teacher-routes.js";
import { ruleCodes, ruleInput, recalculate, scope } from "./risk-engine.js";
const roles=(...allowed)=>(req,_res,next)=>{if(!allowed.includes(req.user.role)) fail(403,"access_denied");next();};
const states=["abierta","asignada","en_seguimiento","resuelta","descartada"];
const support=roles("admin","leadership","inspector","teacher");
async function readable(db,user,id) {
  const row=(await db.query(`SELECT a.* FROM alerta a JOIN curso c ON c.id=a.curso_id WHERE a.id=$2 AND ${scope(user)}`,[user.id,id])).rows[0];
  if(!row) fail(404,"alert_not_found");
  return row;
}
export function supportRoutes(app,pool) {
  app.get("/risk/rules",support,async(_req,res)=>{
    res.json({rules:(await pool.query("SELECT DISTINCT ON(codigo) * FROM regla_alerta WHERE codigo=ANY($1) ORDER BY codigo,version DESC",[ruleCodes])).rows});
  });
  app.put("/risk/rules/:code",roles("admin"),async(req,res)=>{
    const parameters=ruleInput(req.params.code,req.body);
    if(!text(req.body.reason,8,500)) fail(400,"correction_reason_required");
    const rule=await transaction(pool,async db=>{
      await db.query("SELECT pg_advisory_xact_lock(8009)");
      const old=(await db.query("SELECT * FROM regla_alerta WHERE codigo=$1 ORDER BY version DESC LIMIT 1 FOR UPDATE",[req.params.code])).rows[0];
      if(!old) fail(404,"not_found");
      if(req.body.expectedVersion!==old.version) fail(409,"stale_record");
      await db.query("UPDATE regla_alerta SET activa=FALSE WHERE codigo=$1",[old.codigo]);
      const row=(await db.query(`INSERT INTO regla_alerta(codigo,version,nombre,tipo,parametros,activa,creada_por)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[old.codigo,old.version+1,old.nombre,old.tipo,parameters,req.body.active,req.user.id])).rows[0];
      await audit(db,req.user.id,"configure","regla_alerta",row.id,old,{...row,reason:req.body.reason.trim()});
      await recalculate(db,req.user);
      return row;
    });res.json({rule});
  });
  app.post("/risk/recalculate",support,async(req,res)=>{
    res.json(await transaction(pool,db=>recalculate(db,req.user)));
  });
  app.get("/risk/owners",support,async(req,res)=>{
    const users=(await pool.query(`SELECT u.id,u.nombre AS name FROM usuario u WHERE u.estado='activo' AND EXISTS(
      SELECT 1 FROM usuario_rol ur JOIN rol r ON r.id=ur.rol_id WHERE ur.usuario_id=u.id AND ur.alcance='{}'
      AND ur.vigente_desde<=NOW() AND (ur.vigente_hasta IS NULL OR ur.vigente_hasta>NOW())
      AND r.codigo IN ('ADMINISTRADOR','INSPECTORIA','DIRECCION_UTP','PROFESOR_JEFE','PROFESOR_ASIGNATURA'))
      AND ($1::boolean OR u.id=$2) ORDER BY u.nombre`,[req.user.role!=="teacher",req.user.id])).rows;
    res.json({users});
  });
  app.get("/risk/alerts",support,async(req,res)=>{
    const values=[req.user.id],where=[scope(req.user)];
    for(const [param,col] of [["courseId","a.curso_id"],["ownerId","a.responsable_id"]]) if(req.query[param]) {
      values.push(requireId(req.query[param]));where.push(col+"=$"+values.length);
    }
    if(req.query.unassigned==="true") where.push("a.responsable_id IS NULL");
    for(const [param,col,allowed] of [["status","a.estado",states],["priority","a.severidad",["informativa","media","alta","critica"]]]) if(req.query[param]) {
      if(!allowed.includes(req.query[param])) fail(400,"invalid_filter");
      values.push(req.query[param]);where.push(col+"=$"+values.length);
    }
    const page=Number(req.query.page??1);
    if(!Number.isInteger(page)||page<1||page>10000) fail(400,"invalid_filter");
    const from=`FROM alerta a JOIN estudiante e ON e.id=a.estudiante_id JOIN curso c ON c.id=a.curso_id
      JOIN nivel_educativo n ON n.id=c.nivel_id LEFT JOIN usuario u ON u.id=a.responsable_id WHERE ${where.join(" AND ")}`;
    const summary=(await pool.query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER(WHERE a.estado NOT IN ('resuelta','descartada'))::int AS active,
      COUNT(*) FILTER(WHERE a.severidad='critica' AND a.estado NOT IN ('resuelta','descartada'))::int AS critical,
      MAX(a.evidencia->>'calculatedAt') AS "lastCalculatedAt" ${from}`,values)).rows[0];
    const alerts=(await pool.query(`SELECT a.*,e.nombres||' '||e.apellidos AS student,n.nombre||' '||c.letra AS course,u.nombre AS owner
      ${from} ORDER BY CASE a.severidad WHEN 'critica' THEN 0 WHEN 'alta' THEN 1 WHEN 'media' THEN 2 ELSE 3 END,a.creado_en DESC,a.id LIMIT 50 OFFSET $${values.length+1}`,[...values,(page-1)*50])).rows;
    res.json({alerts,summary,page,pageSize:50});
  });
  app.get("/risk/alerts/:id/history",support,async(req,res)=>{
    const id=requireId(req.params.id);await readable(pool,req.user,id);
    const events=(await pool.query(`SELECT v.id,v.accion AS action,v.creado_en AS date,u.nombre AS actor,v.valor_anterior AS before,v.valor_nuevo AS after
      FROM evento_auditoria v LEFT JOIN usuario u ON u.id=v.usuario_id WHERE v.entidad='alerta' AND v.entidad_id=$1 ORDER BY v.creado_en DESC LIMIT 100`,[id])).rows;
    res.json({events});
  });
  app.patch("/risk/alerts/:id",support,async(req,res)=>{
    const id=requireId(req.params.id),b=req.body;
    if(!states.includes(b?.status)||!text(b.reason,8,500)) fail(400,"invalid_alert_change");
    if(b.ownerId!=null) requireId(b.ownerId);
    const alert=await transaction(pool,async db=>{
      await db.query("SELECT pg_advisory_xact_lock(8009)");
      const old=await readable(db,req.user,id);
      if(b.expectedRevision!==old.revision) fail(409,"stale_record");
      if(["asignada","en_seguimiento"].includes(b.status)&&!b.ownerId) fail(400,"owner_required");
      if(req.user.role==="teacher"&&b.ownerId&&b.ownerId!==req.user.id) fail(403,"access_denied");
      if(b.ownerId) {
        const owner=(await db.query(`SELECT 1 FROM usuario u WHERE u.id=$1 AND u.estado='activo' AND EXISTS(
          SELECT 1 FROM usuario_rol ur JOIN rol r ON r.id=ur.rol_id WHERE ur.usuario_id=u.id AND ur.alcance='{}'
          AND ur.vigente_desde<=NOW() AND (ur.vigente_hasta IS NULL OR ur.vigente_hasta>NOW()) AND (
            r.codigo IN ('ADMINISTRADOR','DIRECCION_UTP','INSPECTORIA') OR
            (r.codigo IN ('PROFESOR_JEFE','PROFESOR_ASIGNATURA') AND EXISTS(SELECT 1 FROM curso c WHERE c.id=$2 AND ${teacherCourse}))))`,[b.ownerId,old.curso_id])).rowCount;
        if(!owner) fail(400,"invalid_owner");
      }
      const row=(await db.query(`UPDATE alerta SET estado=$2::text,responsable_id=$3,revision=revision+1,
        resuelta_en=CASE WHEN $2::text IN ('resuelta','descartada') THEN NOW() ELSE NULL END WHERE id=$1 RETURNING *`,[id,b.status,b.ownerId??null])).rows[0];
      await audit(db,req.user.id,"status_change","alerta",id,old,{...row,reason:b.reason.trim()});return row;
    });res.json({alert});
  });
  const inspectors=roles("admin","inspector");
  app.get("/support/absences",inspectors,async(_req,res)=>{
    const absences=(await pool.query(`SELECT a.id,a.estudiante_id AS "studentId",a.sesion_id AS "sessionId",
      e.nombres||' '||e.apellidos AS student,s.fecha,s.bloque,n.nombre||' '||c.letra AS course,
      su.nombre AS subject FROM asistencia a JOIN estudiante e ON e.id=a.estudiante_id
      JOIN sesion_clase s ON s.id=a.sesion_id JOIN curso_asignatura ca ON ca.id=s.curso_asignatura_id
      JOIN asignatura su ON su.id=ca.asignatura_id JOIN curso c ON c.id=ca.curso_id JOIN nivel_educativo n ON n.id=c.nivel_id
      WHERE a.estado='ausente' AND s.estado='realizada' AND s.fecha<=(NOW() AT TIME ZONE 'America/Santiago')::date
      AND NOT EXISTS(SELECT 1 FROM justificacion_ausencia j WHERE j.estudiante_id=a.estudiante_id AND j.sesion_id=a.sesion_id)
      ORDER BY s.fecha DESC,a.id LIMIT 500`)).rows;
    res.json({absences});
  });
  app.get("/support/justifications",roles("admin","inspector","student"),async(req,res)=>{
    const rows=(await pool.query(`SELECT j.*,e.nombres||' '||e.apellidos AS student,u.nombre AS registered_by,v.nombre AS reviewed_by
      FROM justificacion_ausencia j JOIN estudiante e ON e.id=j.estudiante_id JOIN usuario u ON u.id=j.registrada_por
      LEFT JOIN usuario v ON v.id=j.revisada_por WHERE ($1::boolean OR e.usuario_id=$2) ORDER BY j.creado_en DESC LIMIT 500`,[req.user.role!=="student",req.user.id])).rows;
    res.json({justifications:req.user.role==="student"?rows.map(j=>({id:j.id,fecha_desde:j.fecha_desde,estado:j.estado,revisada_en:j.revisada_en})):rows});
  });
  app.post("/support/justifications",inspectors,async(req,res)=>{
    const b=req.body,id=requireId(b?.attendanceId);
    if(!text(b.reason,8,2000)||!text(b.evidence,3,1000)) fail(400,"invalid_justification");
    const justification=await transaction(pool,async db=>{
      const ref=(await db.query("SELECT sesion_id FROM asistencia WHERE id=$1",[id])).rows[0];
      if(!ref) fail(404,"absence_not_found");
      const s=(await db.query("SELECT *,fecha>(NOW() AT TIME ZONE 'America/Santiago')::date AS future FROM sesion_clase WHERE id=$1 FOR UPDATE",[ref.sesion_id])).rows[0];
      const a=(await db.query("SELECT * FROM asistencia WHERE id=$1 FOR UPDATE",[id])).rows[0];
      if(a.estado!=="ausente"||s.estado!=="realizada"||s.future) fail(409,"absence_changed");
      const row=(await db.query(`INSERT INTO justificacion_ausencia(estudiante_id,sesion_id,fecha_desde,fecha_hasta,motivo,documento_url,registrada_por)
        VALUES($1,$2,$3,$3,$4,$5,$6) RETURNING *`,[a.estudiante_id,s.id,s.fecha,b.reason.trim(),b.evidence.trim(),req.user.id])).rows[0];
      await audit(db,req.user.id,"create","justificacion_ausencia",row.id,null,row);return row;
    });res.status(201).json({justification});
  });
  app.patch("/support/justifications/:id",inspectors,async(req,res)=>{
    const id=requireId(req.params.id),b=req.body;
    if(!["aceptada","rechazada"].includes(b?.status)||!text(b.reason,8,1000)) fail(400,"invalid_justification_review");
    const justification=await transaction(pool,async db=>{
      await db.query("SELECT pg_advisory_xact_lock(8009)");
      const ref=(await db.query("SELECT sesion_id FROM justificacion_ausencia WHERE id=$1",[id])).rows[0];
      if(!ref?.sesion_id) fail(404,"not_found");
      const s=(await db.query("SELECT * FROM sesion_clase WHERE id=$1 FOR UPDATE",[ref.sesion_id])).rows[0];
      const old=(await db.query("SELECT * FROM justificacion_ausencia WHERE id=$1 FOR UPDATE",[id])).rows[0];
      if(old.estado!=="pendiente") fail(409,"justification_already_reviewed");
      if(b.expectedRevision!==old.revision) fail(409,"stale_record");
      if(b.status==="aceptada") {
        const a=(await db.query("SELECT * FROM asistencia WHERE sesion_id=$1 AND estudiante_id=$2 FOR UPDATE",[s.id,old.estudiante_id])).rows[0];
        if(a?.estado!=="ausente"||s.estado!=="realizada") fail(409,"absence_changed");
        const updated=(await db.query("UPDATE asistencia SET estado='justificada',observacion=$2,registrada_por=$3 WHERE id=$1 RETURNING *",[a.id,"Justificación aprobada "+id,req.user.id])).rows[0];
        await audit(db,req.user.id,"justify","asistencia",a.id,a,updated);
        await db.query("UPDATE sesion_clase SET actualizado_en=NOW() WHERE id=$1",[s.id]);
      }
      const row=(await db.query(`UPDATE justificacion_ausencia SET estado=$2,observacion_revision=$3,revisada_por=$4,revisada_en=NOW(),revision=revision+1 WHERE id=$1 RETURNING *`,[id,b.status,b.reason.trim(),req.user.id])).rows[0];
      await audit(db,req.user.id,"review","justificacion_ausencia",id,old,row);
      if(b.status==="aceptada") await recalculate(db,req.user);
      return row;
    });res.json({justification});
  });
}

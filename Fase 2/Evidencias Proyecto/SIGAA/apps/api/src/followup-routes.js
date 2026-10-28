import { fail, requireId, transaction, audit, teacherCourse } from './repository.js';
import { text } from './teacher-routes.js';

const staff = ['admin','inspector','leadership','teacher'];
const roles = (...allowed) => (req,_res,next) => { if (!allowed.includes(req.user.role)) fail(403,'access_denied'); next(); };
const courseScope = user => user.role === 'teacher'
  ? `c.estado='activo' AND EXISTS(SELECT 1 FROM periodo_escolar p WHERE p.id=c.periodo_id AND p.estado='activo') AND ${teacherCourse}`
  : '$1::uuid IS NOT NULL';
const guardianColumns = 'id,codigo,nombres,apellidos,email,telefono,estado,revision,actualizado_en';
function date(value) {
  return typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value;
}
function revision(body, row) { if (!Number.isInteger(body?.expectedRevision) || body.expectedRevision!==row.revision) fail(409,'stale_record'); }
function reason(value) { if (!text(value,8,2000)) fail(400,'followup_reason_required'); return value.trim(); }
function plan(body) {
  if (!text(body?.nextAction,3,1000)||!date(body?.followupDate)) fail(400,'invalid_followup_plan');
  return [body.nextAction.trim(),body.followupDate];
}
export function guardianInput(b) {
  if (!b || !/^[A-Z0-9][A-Z0-9._-]{2,39}$/.test(b.code??'') || !text(b.firstName,1,100)||!text(b.lastName,1,120)) fail(400,'invalid_guardian');
  const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
  const phone=typeof b.phone==='string'?b.phone.trim():'';
  if (email && (email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) fail(400,'invalid_email');
  if (phone && !/^\+?[0-9 ()-]{7,30}$/.test(phone)) fail(400,'invalid_guardian_phone');
  if (!['activo','inactivo'].includes(b.status??'activo')) fail(400,'invalid_guardian');
  return [b.code,b.firstName.trim(),b.lastName.trim(),email||null,phone||null,b.status??'activo'];
}
async function studentAccess(db,user,id) {
  const row=(await db.query('SELECT id,identificador_interno AS identifier,nombres,apellidos,estado,actualizado_en FROM estudiante WHERE id=$1',[id])).rows[0];
  if (!row) fail(404,'student_not_found');
  if (user.role==='student') { if (id!==user.studentId) fail(403,'access_denied'); }
  else if (user.role==='teacher') {
    const found=await db.query(`SELECT 1 FROM matricula m JOIN curso c ON c.id=m.curso_id WHERE m.estudiante_id=$2 AND m.estado='activa' AND ${courseScope(user)} LIMIT 1`,[user.id,id]);
    if (!found.rowCount) fail(403,'access_denied');
  } else if (!staff.includes(user.role)) fail(403,'access_denied');
  return row;
}
async function ownerAllowed(db,user,id,courseId) {
  requireId(id);
  if (user.role==='teacher' && id!==user.id) fail(403,'access_denied');
  const valid=await db.query(`SELECT 1 FROM usuario u JOIN usuario_rol ur ON ur.usuario_id=u.id JOIN rol r ON r.id=ur.rol_id
    WHERE u.id=$1 AND u.estado='activo' AND ur.alcance='{}'::jsonb AND ur.vigente_desde<=NOW() AND (ur.vigente_hasta IS NULL OR ur.vigente_hasta>NOW())
    AND (r.codigo IN ('ADMINISTRADOR','INSPECTORIA','DIRECCION_UTP') OR (r.codigo IN ('PROFESOR_JEFE','PROFESOR_ASIGNATURA')
    AND EXISTS(SELECT 1 FROM curso c WHERE c.id=$2 AND ${teacherCourse})))`,[id,courseId]);
  if (!valid.rowCount) fail(400,'invalid_owner');
}
async function caseRow(db,user,id,lock=false) {
  const row=(await db.query(`SELECT k.*,a.estudiante_id,a.curso_id,e.nombres||' '||e.apellidos AS student,n.nombre||' '||c.letra AS course,u.nombre AS owner
    FROM caso_seguimiento k JOIN alerta a ON a.id=k.alerta_id JOIN curso c ON c.id=a.curso_id JOIN nivel_educativo n ON n.id=c.nivel_id
    JOIN estudiante e ON e.id=a.estudiante_id JOIN usuario u ON u.id=k.responsable_id
    WHERE k.id=$2 AND ${courseScope(user)} ${lock?'FOR UPDATE OF k':''}`,[user.id,id])).rows[0];
  if (!row) fail(404,'case_not_found');
  return row;
}
async function event(db,user,row,type,note,before) {
  await db.query('INSERT INTO caso_actividad(caso_id,usuario_id,tipo,nota,detalle) VALUES($1,$2,$3,$4,$5)',
    [row.id,user.id,type,note,{status:row.estado,ownerId:row.responsable_id,nextAction:row.siguiente_accion,followupDate:row.fecha_seguimiento,outcome:row.resultado,revision:row.revision}]);
  await audit(db,user.id,type,'caso_seguimiento',row.id,before,row);
}
export function followupRoutes(app,pool) {
  const support=roles(...staff), registry=roles('admin','inspector'), registryRead=roles('admin','inspector','leadership');
  app.get('/guardians',registryRead,async(req,res)=>{
    const q=String(req.query.q??'').trim();const page=Number(req.query.page??1);
    if(q.length>100||!Number.isInteger(page)||page<1||page>10000) fail(400,'invalid_filter');
    const where="WHERE (codigo ILIKE $1 OR nombres||' '||apellidos ILIKE $1)";
    const total=Number((await pool.query(`SELECT count(*) FROM apoderado ${where}`,['%'+q+'%'])).rows[0].count);
    const guardians=(await pool.query(`SELECT ${guardianColumns} FROM apoderado ${where} ORDER BY apellidos,nombres,id LIMIT 50 OFFSET $2`,['%'+q+'%',(page-1)*50])).rows;
    res.json({guardians,total,page,pageSize:50});
  });
  app.post('/guardians',registry,async(req,res)=>{
    const values=guardianInput(req.body);
    const guardian=await transaction(pool,async db=>{
      const row=(await db.query(`INSERT INTO apoderado(codigo,nombres,apellidos,email,telefono,estado) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${guardianColumns}`,values)).rows[0];
      await audit(db,req.user.id,'create','apoderado',row.id,null,row);return row;
    });res.status(201).json({guardian});
  });
  app.put('/guardians/:id',registry,async(req,res)=>{
    const id=requireId(req.params.id),values=guardianInput(req.body),note=reason(req.body.reason);
    const guardian=await transaction(pool,async db=>{
      const old=(await db.query(`SELECT ${guardianColumns} FROM apoderado WHERE id=$1 FOR UPDATE`,[id])).rows[0];
      if(!old) fail(404,'guardian_not_found');revision(req.body,old);
      if(old.codigo&&values[0]!==old.codigo) fail(400,'guardian_code_immutable');
      if(values[5]==='inactivo'&&(await db.query('SELECT 1 FROM estudiante_apoderado WHERE apoderado_id=$1 AND activo LIMIT 1',[id])).rowCount) fail(409,'guardian_active_links');
      const row=(await db.query(`UPDATE apoderado SET codigo=$2,nombres=$3,apellidos=$4,email=$5,telefono=$6,estado=$7,revision=revision+1 WHERE id=$1 RETURNING ${guardianColumns}`,[id,...values])).rows[0];
      await audit(db,req.user.id,'update','apoderado',id,old,{...row,reason:note});return row;
    });res.json({guardian});
  });
  app.get('/guardians/:id',registryRead,async(req,res)=>{
    const id=requireId(req.params.id);
    const guardian=(await pool.query(`SELECT ${guardianColumns} FROM apoderado WHERE id=$1`,[id])).rows[0];
    if(!guardian) fail(404,'guardian_not_found');
    const links=(await pool.query(`SELECT l.*,e.nombres||' '||e.apellidos AS student FROM estudiante_apoderado l JOIN estudiante e ON e.id=l.estudiante_id WHERE l.apoderado_id=$1 ORDER BY l.creado_en,l.id`,[id])).rows;
    const history=(await pool.query(`SELECT v.id,v.accion AS action,v.creado_en AS date,u.nombre AS actor,v.valor_anterior AS before,v.valor_nuevo AS after FROM evento_auditoria v LEFT JOIN usuario u ON u.id=v.usuario_id
      WHERE (v.entidad='apoderado' AND v.entidad_id=$1) OR (v.entidad='estudiante_apoderado' AND v.entidad_id IN (SELECT id FROM estudiante_apoderado WHERE apoderado_id=$1)) ORDER BY v.creado_en DESC LIMIT 100`,[id])).rows;
    res.json({guardian,links,history});
  });
  async function link(req,existingId) {
    const b=req.body,note=reason(b?.reason);
    if(!text(b.relationship,1,40)||typeof b.primary!=='boolean'||typeof b.active!=='boolean'||typeof b.notifications!=='boolean') fail(400,'invalid_guardian_link');
    if(b.primary&&!b.active) fail(400,'invalid_guardian_link');
    return transaction(pool,async db=>{
      const initial=existingId?(await db.query('SELECT * FROM estudiante_apoderado WHERE id=$1',[existingId])).rows[0]:null;
      if(existingId&&!initial) fail(404,'guardian_link_not_found');
      const studentId=initial?.estudiante_id??requireId(b.studentId),guardianId=initial?.apoderado_id??requireId(req.params.id);
      // Consistent locks serialize competing primary assignments and guardian deactivation.
      const guardian=(await db.query('SELECT * FROM apoderado WHERE id=$1 FOR UPDATE',[guardianId])).rows[0];
      if(!guardian) fail(404,'guardian_not_found');
      if(b.active&&guardian.estado!=='activo') fail(409,'guardian_inactive');
      if(!(await db.query('SELECT id FROM estudiante WHERE id=$1 FOR UPDATE',[studentId])).rowCount) fail(404,'student_not_found');
      const old=existingId?(await db.query('SELECT * FROM estudiante_apoderado WHERE id=$1 FOR UPDATE',[existingId])).rows[0]:null;
      if(old) revision(b,old);
      if(!old&&(await db.query('SELECT 1 FROM estudiante_apoderado WHERE estudiante_id=$1 AND apoderado_id=$2',[studentId,guardianId])).rowCount) fail(409,'duplicate_record');
      const others=(await db.query('SELECT * FROM estudiante_apoderado WHERE estudiante_id=$1 AND activo AND id<>COALESCE($2::uuid,gen_random_uuid()) FOR UPDATE',[studentId,existingId??null])).rows;
      if(b.active&&!b.primary&&!others.some(x=>x.es_principal)) fail(409,'guardian_primary_required');
      if(old?.es_principal&&!b.primary&&others.length&&!others.some(x=>x.es_principal)) fail(409,'guardian_primary_required');
      if(b.primary) for(const previous of others.filter(x=>x.es_principal)) {
        const changed=(await db.query('UPDATE estudiante_apoderado SET es_principal=FALSE,revision=revision+1,actualizado_en=NOW() WHERE id=$1 RETURNING *',[previous.id])).rows[0];
        await audit(db,req.user.id,'change_primary','estudiante_apoderado',previous.id,previous,{...changed,reason:note});
      }
      const values=[b.relationship.trim(),b.primary,b.active,b.notifications];
      const row=old?(await db.query('UPDATE estudiante_apoderado SET parentesco=$2,es_principal=$3,activo=$4,recibe_notificaciones=$5,revision=revision+1,actualizado_en=NOW() WHERE id=$1 RETURNING *',[old.id,...values])).rows[0]
        :(await db.query('INSERT INTO estudiante_apoderado(estudiante_id,apoderado_id,parentesco,es_principal,activo,recibe_notificaciones) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[studentId,guardianId,...values])).rows[0];
      await audit(db,req.user.id,old?'update_link':'link','estudiante_apoderado',row.id,old,{...row,reason:note});return row;
    });
  }
  app.post('/guardians/:id/links',registry,async(req,res)=>res.status(201).json({link:await link(req)}));
  app.patch('/guardian-links/:id',registry,async(req,res)=>res.json({link:await link(req,requireId(req.params.id))}));

  app.get('/followup/cases',support,async(req,res)=>{
    const values=[req.user.id],where=[courseScope(req.user)],page=Number(req.query.page??1);
    if(!Number.isInteger(page)||page<1||page>10000) fail(400,'invalid_filter');
    for(const [key,column] of [['studentId','a.estudiante_id'],['courseId','a.curso_id'],['ownerId','k.responsable_id']]) if(req.query[key]) {values.push(requireId(req.query[key]));where.push(`${column}=$${values.length}`);}
    if(req.query.status){if(!['abierto','en_curso','cerrado'].includes(req.query.status))fail(400,'invalid_filter');values.push(req.query.status);where.push('k.estado=$'+values.length);}
    const from=`FROM caso_seguimiento k JOIN alerta a ON a.id=k.alerta_id JOIN curso c ON c.id=a.curso_id JOIN nivel_educativo n ON n.id=c.nivel_id JOIN estudiante e ON e.id=a.estudiante_id JOIN usuario u ON u.id=k.responsable_id WHERE ${where.join(' AND ')}`;
    const total=Number((await pool.query(`SELECT COUNT(*) ${from}`,values)).rows[0].count);
    const cases=(await pool.query(`SELECT k.*,a.estudiante_id,a.curso_id,e.nombres||' '||e.apellidos AS student,n.nombre||' '||c.letra AS course,u.nombre AS owner ${from} ORDER BY (k.estado='cerrado'),k.fecha_seguimiento,k.id LIMIT 50 OFFSET $${values.length+1}`,[...values,(page-1)*50])).rows;
    res.json({cases,total,page,pageSize:50});
  });
  app.post('/followup/cases',support,async(req,res)=>{
    const b=req.body,alertId=requireId(b?.alertId),note=reason(b.reason),[next,when]=plan(b);
    if(!['media','alta','critica'].includes(b.priority))fail(400,'invalid_case');
    const record=await transaction(pool,async db=>{
      const alert=(await db.query(`SELECT a.* FROM alerta a JOIN curso c ON c.id=a.curso_id WHERE a.id=$2 AND ${courseScope(req.user)} FOR UPDATE OF a`,[req.user.id,alertId])).rows[0];
      if(!alert)fail(404,'alert_not_found');
      if(['resuelta','descartada'].includes(alert.estado))fail(409,'alert_already_closed');
      await ownerAllowed(db,req.user,b.ownerId,alert.curso_id);
      const row=(await db.query(`INSERT INTO caso_seguimiento(alerta_id,motivo,prioridad,responsable_id,siguiente_accion,fecha_seguimiento,creado_por,actualizado_por)
        VALUES($1,$2,$3,$4,$5,$6,$7,$7) RETURNING *`,[alertId,note,b.priority,b.ownerId,next,when,req.user.id])).rows[0];
      await event(db,req.user,row,'apertura',note,null);return row;
    });res.status(201).json({case:record});
  });
  app.get('/followup/cases/:id',support,async(req,res)=>{
    const row=await caseRow(pool,req.user,requireId(req.params.id));
    const activities=(await pool.query(`SELECT v.*,u.nombre AS actor FROM caso_actividad v JOIN usuario u ON u.id=v.usuario_id WHERE caso_id=$1 ORDER BY creado_en DESC,v.id DESC LIMIT 500`,[row.id])).rows;
    res.json({case:row,activities});
  });
  async function changeCase(req,activityOnly) {
    const b=req.body,id=requireId(req.params.id),note=reason(b?.note);
    return transaction(pool,async db=>{
      const old=await caseRow(db,req.user,id,true);revision(b,old);
      if(req.user.role==='teacher'&&old.responsable_id!==req.user.id)fail(403,'case_owner_required');
      if(activityOnly&&old.estado==='cerrado')fail(409,'case_closed');
      const state=activityOnly?old.estado:b.status;
      if(!['abierto','en_curso','cerrado'].includes(state))fail(400,'invalid_case');
      if(!activityOnly&&old.estado==='cerrado'&&state!=='en_curso')fail(409,'case_closed');
      const ownerId=activityOnly?old.responsable_id:b.ownerId;
      await ownerAllowed(db,req.user,ownerId,old.curso_id);
      const priority=activityOnly?old.prioridad:b.priority;
      if(!['media','alta','critica'].includes(priority))fail(400,'invalid_case');
      const [next,when]=state==='cerrado'?[old.siguiente_accion,old.fecha_seguimiento]:plan(b);
      const outcome=state==='cerrado'?reason(b.outcome):null;
      const row=(await db.query(`UPDATE caso_seguimiento SET estado=$2::text,prioridad=$3,responsable_id=$4,siguiente_accion=$5,fecha_seguimiento=$6,resultado=$7,
        cerrado_en=CASE WHEN $2::text='cerrado' THEN NOW() ELSE NULL END,actualizado_por=$8,actualizado_en=NOW(),revision=revision+1 WHERE id=$1 RETURNING *`,[id,state,priority,ownerId,next,when,outcome,req.user.id])).rows[0];
      const type=activityOnly?'actividad':state==='cerrado'?'cierre':old.estado==='cerrado'?'reapertura':'cambio';
      await event(db,req.user,row,type,note,old);return row;
    });
  }
  app.post('/followup/cases/:id/activities',support,async(req,res)=>res.status(201).json({case:await changeCase(req,true)}));
  app.patch('/followup/cases/:id',support,async(req,res)=>res.json({case:await changeCase(req,false)}));
  app.get('/students/:id/dossier',roles(...staff,'student'),async(req,res)=>{
    const id=requireId(req.params.id),user=req.user;
    const dossier=await transaction(pool,async db=>{
      await db.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ, READ ONLY');
      const student=await studentAccess(db,user,id),values=[user.id,id],self=user.role==='student';
      const course=courseScope(user);
      const enrollments=(await db.query(`SELECT m.id,m.estado,n.nombre||' '||c.letra AS course,p.nombre AS period,m.creado_en,m.curso_id
        FROM matricula m JOIN curso c ON c.id=m.curso_id JOIN nivel_educativo n ON n.id=c.nivel_id JOIN periodo_escolar p ON p.id=c.periodo_id
        WHERE m.estudiante_id=$2 AND ${course} ORDER BY p.anio DESC,c.id LIMIT 501`,values)).rows;
      const grades=(await db.query(`SELECT g.id,g.valor,e.nombre AS evaluation,e.fecha,e.ponderacion,s.nombre AS subject,g.actualizado_en
        FROM calificacion g JOIN evaluacion e ON e.id=g.evaluacion_id JOIN curso_asignatura ca ON ca.id=e.curso_asignatura_id JOIN curso c ON c.id=ca.curso_id JOIN asignatura s ON s.id=ca.asignatura_id
        WHERE g.estudiante_id=$2 AND g.visible_estudiante AND e.visible_estudiante AND e.estado IN ('publicada','cerrada') AND ${course} ORDER BY e.fecha DESC,g.id LIMIT 501`,values)).rows;
      const attendance=(await db.query(`SELECT a.id,a.estado,s.fecha,s.titulo,sub.nombre AS subject,a.actualizado_en
        FROM asistencia a JOIN sesion_clase s ON s.id=a.sesion_id JOIN curso_asignatura ca ON ca.id=s.curso_asignatura_id JOIN curso c ON c.id=ca.curso_id JOIN asignatura sub ON sub.id=ca.asignatura_id
        WHERE a.estudiante_id=$2 AND s.estado='realizada' AND s.publicada AND ${course} ORDER BY s.fecha DESC,a.id LIMIT 501`,values)).rows;
      const visible=self?"a.publicada_en IS NOT NULL AND a.visibilidad IN ('estudiante','estudiante_apoderado')"
        :"(a.registrada_por=$1 OR a.visibilidad='equipo_docente' OR (a.publicada_en IS NOT NULL AND a.visibilidad IN ('estudiante','estudiante_apoderado')))";
      const annotations=(await db.query(`SELECT a.id,a.tipo,a.categoria,a.detalle,a.creado_en,sub.nombre AS subject FROM anotacion_estudiante a
        LEFT JOIN curso_asignatura ca ON ca.id=a.curso_asignatura_id LEFT JOIN curso c ON c.id=a.curso_id LEFT JOIN asignatura sub ON sub.id=ca.asignatura_id
        WHERE a.estudiante_id=$2 AND a.estado='vigente' AND ${visible} AND ${course} ORDER BY a.creado_en DESC,a.id LIMIT 501`,values)).rows;
      let alerts=[],cases=[],activities=[],guardians=[],interventions=[];
      if(!self){
        alerts=(await db.query(`SELECT a.id,a.titulo,a.estado,a.severidad,a.creado_en,a.actualizado_en FROM alerta a JOIN curso c ON c.id=a.curso_id WHERE a.estudiante_id=$2 AND ${course} ORDER BY a.creado_en DESC,a.id LIMIT 501`,values)).rows;
        cases=(await db.query(`SELECT k.*,u.nombre AS owner FROM caso_seguimiento k JOIN alerta a ON a.id=k.alerta_id JOIN curso c ON c.id=a.curso_id JOIN usuario u ON u.id=k.responsable_id WHERE a.estudiante_id=$2 AND ${course} ORDER BY k.creado_en DESC,k.id LIMIT 501`,values)).rows;
        activities=(await db.query(`SELECT v.*,u.nombre AS actor FROM caso_actividad v JOIN caso_seguimiento k ON k.id=v.caso_id JOIN alerta a ON a.id=k.alerta_id JOIN curso c ON c.id=a.curso_id JOIN usuario u ON u.id=v.usuario_id WHERE a.estudiante_id=$2 AND ${course} ORDER BY v.creado_en DESC,v.id LIMIT 501`,values)).rows;
        interventions=(await db.query(`SELECT i.id,i.tipo,i.nota,i.resultado,i.creado_en,u.nombre AS actor FROM intervencion i JOIN alerta a ON a.id=i.alerta_id JOIN curso c ON c.id=a.curso_id JOIN usuario u ON u.id=i.usuario_id WHERE a.estudiante_id=$2 AND ${course} ORDER BY i.creado_en DESC,i.id LIMIT 501`,values)).rows;
        guardians=(await db.query(`SELECT g.id,g.nombres,g.apellidos,l.parentesco,l.es_principal,l.actualizado_en ${user.role==='teacher'?'':',g.email,g.telefono'} FROM estudiante_apoderado l JOIN apoderado g ON g.id=l.apoderado_id WHERE l.estudiante_id=$1 AND l.activo AND g.estado='activo' ORDER BY l.es_principal DESC,g.apellidos LIMIT 501`,[id])).rows;
      }
      const sections={enrollments,grades,attendance,annotations,alerts,cases,activities,interventions,guardians};
      const truncated=Object.keys(sections).filter(k=>sections[k].length>500);
      for(const k of Object.keys(sections))sections[k]=sections[k].slice(0,500);
      return {student,...sections,truncated,generatedAt:new Date().toISOString(),source:'PostgreSQL - registros persistentes autorizados',privacy:self?'Solo datos propios publicados; seguimiento interno oculto':user.role==='teacher'?'Solo cursos autorizados; contactos de apoderados y anotaciones privadas ajenas ocultos':'Las anotaciones privadas ajenas permanecen ocultas'};
    });res.json(dossier);
  });
}

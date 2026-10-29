import {fail,requireId,teacherCourse} from './repository.js';

// Store only the event reference. Sensitive case content is never copied to an inbox.
// Called inside the same transaction as the change; rolled-back changes send no notice.
export async function notifyCase(db,user,row,type) {
  await db.query(`INSERT INTO notificacion_interna(destinatario_id,caso_id,revision_caso,tipo,actor_id)
    SELECT DISTINCT u.id,$2::uuid,$3::integer,$4::varchar,$1::uuid FROM usuario u
    WHERE u.id=ANY($5::uuid[]) AND u.id<>$1 AND u.estado='activo'
    ON CONFLICT(destinatario_id,caso_id,revision_caso) DO NOTHING`,
    [user.id,row.id,row.revision,type,[row.responsable_id,row.creado_por]]);
}

export function notificationRoutes(app,pool) {
  function scope(user) {
    if(['admin','inspector','leadership'].includes(user.role))return 'TRUE';
    if(user.role==='teacher')return `c.estado='activo' AND EXISTS(SELECT 1 FROM periodo_escolar p
      WHERE p.id=c.periodo_id AND p.estado='activo') AND ${teacherCourse}`;
    return 'FALSE';
  }
  const source=user=>`FROM notificacion_interna ni JOIN caso_seguimiento k ON k.id=ni.caso_id
    JOIN alerta a ON a.id=k.alerta_id JOIN curso c ON c.id=a.curso_id
    WHERE ni.destinatario_id=$1 AND (${scope(user)})`;
  app.get('/notifications',async(req,res)=>{
    const page=Number(req.query.page??1),filter=req.query.filter??'all';
    if(!Number.isInteger(page)||page<1||page>10000||!['all','unread'].includes(filter))fail(400,'invalid_filter');
    const from=source(req.user),only=filter==='unread'?' AND ni.leida_en IS NULL':'';
    // A single snapshot keeps counts and the displayed page coherent under concurrent reads.
    const result=(await pool.query(`WITH visible AS (SELECT ni.* ${from}), selected AS (
      SELECT * FROM visible ni WHERE TRUE ${only} ORDER BY creado_en DESC,id DESC LIMIT 25 OFFSET $2)
      SELECT (SELECT COUNT(*) FROM visible ni WHERE TRUE ${only})::int AS total,
      (SELECT COUNT(*) FROM visible WHERE leida_en IS NULL)::int AS unread,
      COALESCE((SELECT json_agg(row_to_json(s) ORDER BY s.creado_en DESC,s.id DESC) FROM selected s),'[]') AS notifications`,
      [req.user.id,(page-1)*25])).rows[0];
    res.json({...result,page,pageSize:25});
  });
  app.patch('/notifications/:id/read',async(req,res)=>{
    const id=requireId(req.params.id);
    const found=await pool.query(`UPDATE notificacion_interna SET leida_en=COALESCE(leida_en,NOW())
      WHERE id IN (SELECT ni.id ${source(req.user)} AND ni.id=$2) RETURNING id,leida_en`,[req.user.id,id]);
    if(!found.rowCount)fail(404,'notification_not_found');
    res.json({notification:found.rows[0]});
  });
}

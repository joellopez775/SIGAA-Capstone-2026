import { fail, requireId } from './repository.js';
import { date } from './teacher-routes.js';

// The current enrollment is checked on every request, including after a transfer.
const scope = `EXISTS (SELECT 1 FROM matricula m JOIN curso c ON c.id=m.curso_id
  JOIN periodo_escolar p ON p.id=c.periodo_id WHERE m.estudiante_id=$1
  AND m.curso_id=ca.curso_id AND m.estado='activa' AND c.estado='activo'
  AND p.estado='activo') AND ca.estado='activa'`;

export async function studentSubjects(db, id) {
  return (await db.query(`SELECT ca.id,a.nombre AS subject,n.nombre||' '||c.letra AS course,
    p.nombre AS period,u.nombre AS teacher
    FROM curso_asignatura ca JOIN asignatura a ON a.id=ca.asignatura_id
    JOIN curso c ON c.id=ca.curso_id JOIN nivel_educativo n ON n.id=c.nivel_id
    JOIN periodo_escolar p ON p.id=c.periodo_id LEFT JOIN usuario u ON u.id=ca.profesor_id
    WHERE ${scope} ORDER BY a.nombre,c.letra,ca.id`,[id])).rows;
}

export function studentPortalRoutes(app,pool) {
  app.get('/student/calendar/:id',async(req,res)=>{
    const id=requireId(req.params.id);
    if(req.user.role!=='student'||req.user.studentId!==id)fail(403,'access_denied');
    const {from,to}=req.query;
    if(!date(from)||!date(to)||to<from||(Date.parse(to)-Date.parse(from))/86400000>92)
      fail(400,'invalid_calendar_range');
    const events=(await pool.query(`SELECT s.id,'class' AS kind,s.fecha::text AS date,s.bloque AS block,
      s.titulo AS title,s.objetivo AS objective,a.nombre AS subject,s.estado AS status
      FROM sesion_clase s JOIN curso_asignatura ca ON ca.id=s.curso_asignatura_id
      JOIN asignatura a ON a.id=ca.asignatura_id
      WHERE ${scope} AND s.publicada AND s.estado<>'cancelada' AND s.fecha BETWEEN $2::date AND $3::date
      UNION ALL
      SELECT e.id,'evaluation',e.fecha::text,NULL,e.nombre,NULL,a.nombre,e.estado
      FROM evaluacion e JOIN curso_asignatura ca ON ca.id=e.curso_asignatura_id
      JOIN asignatura a ON a.id=ca.asignatura_id
      WHERE ${scope} AND e.visible_estudiante AND e.estado IN ('publicada','cerrada')
      AND e.fecha BETWEEN $2::date AND $3::date
      ORDER BY date,block NULLS LAST,id LIMIT 501`,[id,from,to])).rows;
    res.json({events:events.slice(0,500),limited:events.length>500,from,to});
  });
}

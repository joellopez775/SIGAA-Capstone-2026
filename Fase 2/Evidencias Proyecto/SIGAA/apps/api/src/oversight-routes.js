import {fail} from './repository.js';
export function oversightRoutes(app,pool){
 app.get('/oversight/indicators',async(req,res)=>{
  if(!['admin','inspector','leadership'].includes(req.user.role))fail(403,'access_denied');
  const result=await pool.query(`SELECT
   (SELECT count(*)::int FROM estudiante WHERE estado='regular') AS students,
   (SELECT count(*)::int FROM curso WHERE estado='activo') AS courses,
   (SELECT count(*)::int FROM matricula WHERE estado='activa') AS enrollments,
   (SELECT count(*)::int FROM caso_seguimiento WHERE estado<>'cerrado') AS open_cases,
   (SELECT count(*)::int FROM justificacion_ausencia WHERE estado='pendiente') AS pending_justifications,
   (SELECT count(*)::int FROM evaluacion WHERE estado='publicada') AS published_evaluations`);
  res.json({indicators:result.rows[0],generatedAt:new Date().toISOString(),scope:'Establecimiento completo',definition:'Conteos del estado actual; no constituyen promedios ni tasas de riesgo.'});
 });
 app.get('/oversight/audit',async(req,res)=>{
  if(req.user.role!=='admin')fail(403,'access_denied');
  const page=Number(req.query.page??1),action=req.query.action??'';
  if(!Number.isInteger(page)||page<1||page>10000||typeof action!=='string'||action.length>80)fail(400,'invalid_filter');
  const r=await pool.query(`WITH visible AS (SELECT e.id,e.accion,e.entidad,e.entidad_id,e.creado_en,COALESCE(u.nombre,'Sistema') AS actor FROM evento_auditoria e LEFT JOIN usuario u ON u.id=e.usuario_id WHERE ($1='' OR e.accion=$1)), selected AS (SELECT * FROM visible ORDER BY creado_en DESC,id DESC LIMIT 25 OFFSET $2) SELECT (SELECT count(*)::int FROM visible) AS total,COALESCE((SELECT json_agg(row_to_json(s) ORDER BY creado_en DESC,id DESC) FROM selected s),'[]') AS events`,[action,(page-1)*25]);
  res.json({...r.rows[0],page,pageSize:25});
 });
}

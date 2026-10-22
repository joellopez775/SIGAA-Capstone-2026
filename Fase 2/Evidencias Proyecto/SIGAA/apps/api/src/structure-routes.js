import { fail, requireId, transaction, audit } from "./repository.js";
import { date, text } from "./teacher-routes.js";

// Identifiers come only from this allowlist, never from client input.
export const catalogs = {
  schools: { table: "establecimiento", fields: ["rbd","nombre","tipo","dependencia","estado"] },
  periods: { table: "periodo_escolar", fields: ["establecimiento_id","anio","nombre","fecha_inicio","fecha_fin","estado"], parents: ["establecimiento_id"] },
  levels: { table: "nivel_educativo", fields: ["codigo","nombre","ciclo","orden"] },
  subjects: { table: "asignatura", fields: ["codigo","nombre","estado"] },
  courses: { table: "curso", fields: ["periodo_id","nivel_id","letra","jornada","sala","capacidad","estado"], parents: ["periodo_id","nivel_id"] },
  assignments: { table: "curso_asignatura", fields: ["curso_id","asignatura_id","profesor_id","horas_semanales","estado"], parents: ["curso_id","asignatura_id"] },
};
const oneOf = (v, choices) => choices.includes(v);
function validate(kind, b) {
  if (!b || typeof b !== "object") fail(400,"invalid_structure");
  const nameMax = {schools:180,periods:120,levels:100,subjects:160};
  if (nameMax[kind] && !text(b.nombre,1,nameMax[kind])) fail(400,"invalid_structure");
  if (["subjects","levels"].includes(kind) && !text(b.codigo,1,30)) fail(400,"invalid_structure");
  if (kind==="schools" && (!oneOf(b.tipo,["colegio","liceo"]) ||
    !oneOf(b.estado,["activo","inactivo"]) || (b.rbd != null && !text(b.rbd,1,20)) ||
    !oneOf(b.dependencia ?? null,[null,"municipal","sle","particular_subvencionado","particular_pagado","administracion_delegada"]))) fail(400,"invalid_structure");
  if (kind==="periods") {
    requireId(b.establecimiento_id);
    if (!Number.isInteger(b.anio) || b.anio<2000 || b.anio>2200 || !date(b.fecha_inicio) || !date(b.fecha_fin) ||
      b.fecha_inicio>=b.fecha_fin || Number(b.fecha_inicio.slice(0,4))!==b.anio || Number(b.fecha_fin.slice(0,4))!==b.anio ||
      !oneOf(b.estado,["planificado","activo","cerrado"])) fail(400,"invalid_structure");
  }
  if (kind==="levels" && (!oneOf(b.ciclo,["parvularia","basica","media","especial","adultos"]) || !Number.isInteger(b.orden) || b.orden<1 || b.orden>100)) fail(400,"invalid_structure");
  if (kind==="subjects" && !oneOf(b.estado,["activa","inactiva"])) fail(400,"invalid_structure");
  if (kind==="courses") {
    requireId(b.periodo_id); requireId(b.nivel_id);
    if (!text(b.letra,1,5) || !oneOf(b.estado,["planificado","activo","cerrado","cancelado"]) ||
      !oneOf(b.jornada ?? null,[null,"manana","tarde","vespertina","completa"]) ||
      (b.sala != null && !text(b.sala,1,30)) ||
      (b.capacidad != null && (!Number.isInteger(b.capacidad) || b.capacidad<1 || b.capacidad>1000))) fail(400,"invalid_structure");
  }
  if (kind==="assignments") {
    requireId(b.curso_id); requireId(b.asignatura_id);
    if (b.profesor_id != null) requireId(b.profesor_id);
    if (!oneOf(b.estado,["planificada","activa","cerrada","cancelada"]) ||
      (b.horas_semanales != null && (typeof b.horas_semanales!=="number" || !Number.isFinite(b.horas_semanales) || b.horas_semanales<=0 || b.horas_semanales>99.9))) fail(400,"invalid_structure");
  }
}
export function structureRoutes(app,pool) {
  const admin=(req,_res,next)=>{if(req.user.role!=="admin") fail(403,"access_denied");next();};
  app.get("/structure",admin,async(_req,res)=>{
    const result={};
    for(const [key,c] of Object.entries(catalogs))
      result[key]=(await pool.query(`SELECT *,actualizado_en::text AS revision FROM ${c.table} ORDER BY creado_en,id`)).rows;
    result.teachers=(await pool.query(`SELECT u.id,u.nombre FROM usuario u WHERE u.estado='activo' AND EXISTS(
      SELECT 1 FROM usuario_rol ur JOIN rol r ON r.id=ur.rol_id WHERE ur.usuario_id=u.id
      AND r.codigo IN ('PROFESOR_JEFE','PROFESOR_ASIGNATURA') AND ur.alcance='{}'
      AND ur.vigente_desde<=NOW() AND (ur.vigente_hasta IS NULL OR ur.vigente_hasta>NOW())) ORDER BY u.nombre`)).rows;
    res.json(result);
  });
  async function save(req,res) {
    const kind=req.params.kind,c=Object.hasOwn(catalogs,kind)?catalogs[kind]:null;
    if(!c) fail(404,"not_found");
    const id=req.params.id ? requireId(req.params.id) : null,b=req.body;
    validate(kind,b);
    const record=await transaction(pool,async db=>{
      // Serialize catalog administration, including dependency checks.
      await db.query("SELECT pg_advisory_xact_lock(8008)");
      const before=id?(await db.query(`SELECT *,actualizado_en::text AS revision FROM ${c.table} WHERE id=$1 FOR UPDATE`,[id])).rows[0]:null;
      if(id&&!before) fail(404,"not_found");
      if(before&&b.expectedRevision!==before.revision) fail(409,"stale_record");
      if(before&&(c.parents??[]).some(k=>b[k]!==before[k])) fail(409,"structure_parent_immutable");
      if(kind==="periods") {
        const parent=(await db.query("SELECT estado FROM establecimiento WHERE id=$1 FOR SHARE",[b.establecimiento_id])).rows[0];
        if(!parent || (b.estado==="activo" && parent.estado!=="activo")) fail(400,"invalid_structure_parent");
        if(before) {
          if(b.anio!==before.anio) fail(409,"structure_parent_immutable");
          const outside=await db.query(`SELECT 1 FROM curso c WHERE c.periodo_id=$1 AND (
            EXISTS(SELECT 1 FROM sesion_clase s JOIN curso_asignatura ca ON ca.id=s.curso_asignatura_id
              WHERE ca.curso_id=c.id AND s.fecha NOT BETWEEN $2::date AND $3::date) OR
            EXISTS(SELECT 1 FROM evaluacion e JOIN curso_asignatura ca ON ca.id=e.curso_asignatura_id
              WHERE ca.curso_id=c.id AND e.fecha NOT BETWEEN $2::date AND $3::date)) LIMIT 1`,[id,b.fecha_inicio,b.fecha_fin]);
          if(outside.rowCount) fail(409,"period_contains_records");
          if(b.estado!=="activo" && (await db.query("SELECT 1 FROM curso WHERE periodo_id=$1 AND estado='activo' LIMIT 1",[id])).rowCount) fail(409,"active_children");
        }
      }
      if(kind==="schools"&&id&&b.estado!=="activo"&&(await db.query("SELECT 1 FROM periodo_escolar WHERE establecimiento_id=$1 AND estado='activo' LIMIT 1",[id])).rowCount) fail(409,"active_children");
      if(kind==="courses") {
        const p=(await db.query(`SELECT p.estado,e.estado AS school FROM periodo_escolar p JOIN establecimiento e ON e.id=p.establecimiento_id WHERE p.id=$1 FOR SHARE OF p,e`,[b.periodo_id])).rows[0];
        if(!p || (b.estado==="activo"&&(p.estado!=="activo"||p.school!=="activo"))) fail(400,"invalid_structure_parent");
        if(!(await db.query("SELECT 1 FROM nivel_educativo WHERE id=$1",[b.nivel_id])).rowCount) fail(400,"invalid_structure_parent");
        if(id) {
          const n=(await db.query("SELECT COUNT(*)::int AS n FROM matricula WHERE curso_id=$1 AND estado='activa'",[id])).rows[0].n;
          if(b.capacidad!=null&&b.capacidad<n) fail(409,"capacity_below_enrollment");
          if(b.estado!=="activo"&&(n>0 || (await db.query("SELECT 1 FROM curso_asignatura WHERE curso_id=$1 AND estado='activa' LIMIT 1",[id])).rowCount)) fail(409,"active_children");
        }
      }
      if(kind==="subjects"&&id&&b.estado!=="activa"&&(await db.query("SELECT 1 FROM curso_asignatura WHERE asignatura_id=$1 AND estado='activa' LIMIT 1",[id])).rowCount) fail(409,"active_children");
      if(kind==="assignments") {
        const parents=(await db.query(`SELECT c.estado,p.estado AS period,e.estado AS school,a.estado AS subject FROM curso c
          JOIN periodo_escolar p ON p.id=c.periodo_id JOIN establecimiento e ON e.id=p.establecimiento_id
          CROSS JOIN asignatura a WHERE c.id=$1 AND a.id=$2 FOR SHARE OF c,p,e,a`,[b.curso_id,b.asignatura_id])).rows[0];
        if(!parents || (b.estado==="activa"&&[parents.estado,parents.period,parents.school,parents.subject].join()!=="activo,activo,activo,activa")) fail(400,"invalid_structure_parent");
        if(b.profesor_id && !(await db.query(`SELECT 1 FROM usuario u JOIN usuario_rol ur ON ur.usuario_id=u.id JOIN rol r ON r.id=ur.rol_id
          WHERE u.id=$1 AND u.estado='activo' AND ur.alcance='{}' AND r.codigo IN ('PROFESOR_JEFE','PROFESOR_ASIGNATURA')
          AND ur.vigente_desde<=NOW() AND (ur.vigente_hasta IS NULL OR ur.vigente_hasta>NOW())`,[b.profesor_id])).rowCount) fail(400,"invalid_teacher");
      }
      const values=c.fields.map(k=>typeof b[k]==="string"?b[k].trim():(b[k]??null));
      const sql=id?`UPDATE ${c.table} SET ${c.fields.map((k,i)=>k+"=$"+(i+1)).join(",")} WHERE id=$${values.length+1}`
        :`INSERT INTO ${c.table}(${c.fields.join(",")}) VALUES(${values.map((_,i)=>"$"+(i+1)).join(",")})`;
      const row=(await db.query(sql+" RETURNING *,actualizado_en::text AS revision",id?[...values,id]:values)).rows[0];
      await audit(db,req.user.id,id?"update":"create",c.table,row.id,before,row);
      return row;
    });
    res.status(id?200:201).json({record});
  }
  app.post("/structure/:kind",admin,save);
  app.put("/structure/:kind/:id",admin,save);
}

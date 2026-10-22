import { assignment, date, text } from "./teacher-routes.js";
import { transaction, fail, requireId, audit } from "./repository.js";

async function member(db, courseId, studentId) {
  requireId(studentId);
  const r = await db.query(
    "SELECT 1 FROM matricula WHERE curso_id=$1 AND estudiante_id=$2 AND estado='activa' FOR SHARE",
    [courseId, studentId],
  );
  if (!r.rowCount) fail(403, "student_out_of_scope");
}
async function evaluation(db, user, id, revision) {
  const {
    rows: [ev],
  } = await db.query(
    "SELECT *,actualizado_en::text AS revision FROM evaluacion WHERE id=$1 FOR UPDATE",
    [requireId(id)],
  );
  if (!ev) fail(404, "evaluation_not_found");
  const ca = await assignment(db, user, ev.curso_asignatura_id, "grade");
  if (!["borrador", "publicada"].includes(ev.estado))
    fail(409, "evaluation_closed");
  if (revision !== ev.revision) fail(409, "stale_record");
  return { ev, ca };
}
export function academicRoutes(app, pool) {
  const teacher = (req, _res, next) => {
    if (req.user.role !== "teacher") fail(403, "access_denied");
    next();
  };
  app.get("/teacher/assignments/:id/records", teacher, async (req, res) => {
    const result = await transaction(pool, async (db) => {
      const ca = await assignment(db, req.user, req.params.id, "read");
      const { rows: students } = await db.query(
        `SELECT e.id,e.nombres||' '||e.apellidos AS name FROM estudiante e JOIN matricula m ON m.estudiante_id=e.id
        WHERE m.curso_id=$1 AND m.estado='activa' ORDER BY e.apellidos,e.nombres`,
        [ca.curso_id],
      );
      const { rows: classes } = await db.query(
        `SELECT id,fecha::text AS date,bloque AS block,titulo AS title,objetivo AS objective,estado AS status,actualizado_en::text AS revision
        FROM sesion_clase WHERE curso_asignatura_id=$1 ORDER BY fecha DESC,bloque`,
        [ca.id],
      );
      const { rows: attendance } = await db.query(
        `SELECT a.sesion_id AS "classId",a.estudiante_id AS "studentId",a.estado AS status
        FROM asistencia a JOIN sesion_clase s ON s.id=a.sesion_id WHERE s.curso_asignatura_id=$1`,
        [ca.id],
      );
      const { rows: evaluations } = await db.query(
        `SELECT id,nombre AS name,fecha::text AS date,ponderacion AS weight,estado AS status,actualizado_en::text AS revision
        FROM evaluacion WHERE curso_asignatura_id=$1 ORDER BY fecha DESC,creado_en DESC`,
        [ca.id],
      );
      const { rows: grades } = await db.query(
        `SELECT g.evaluacion_id AS "evaluationId",g.estudiante_id AS "studentId",g.valor AS value,g.version
        FROM calificacion g JOIN evaluacion e ON e.id=g.evaluacion_id WHERE e.curso_asignatura_id=$1`,
        [ca.id],
      );
      const { rows: annotations } = await db.query(
        `SELECT a.id,a.estudiante_id AS "studentId",e.nombres||' '||e.apellidos AS student,a.tipo AS type,a.categoria AS category,
        a.detalle AS detail,a.visibilidad AS visibility,a.estado AS status,a.creado_en AS date,a.actualizado_en::text AS revision,
        a.registrada_por=$2 AS "canEdit",a.motivo_anulacion AS "voidReason"
        FROM anotacion_estudiante a JOIN estudiante e ON e.id=a.estudiante_id
        WHERE a.curso_asignatura_id=$1 AND (a.visibilidad<>'privada' OR a.registrada_por=$2) ORDER BY a.creado_en DESC`,
        [ca.id, req.user.id],
      );
      return {
        students,
        classes,
        attendance,
        evaluations,
        grades,
        annotations,
      };
    });
    res.json(result);
  });
  app.post("/teacher/evaluations", teacher, async (req, res) => {
    const b = req.body;
    if (
      !date(b.date) ||
      !text(b.name, 1, 160) ||
      typeof b.weight !== "number" ||
      !Number.isFinite(b.weight) ||
      b.weight <= 0 ||
      b.weight > 100 ||
      Math.abs(b.weight * 100 - Math.round(b.weight * 100)) > 1e-7
    )
      fail(400, "invalid_evaluation");
    const ev = await transaction(pool, async (db) => {
      // Serialize weight totals for this subject, including concurrent creates.
      await db.query("SELECT id FROM curso_asignatura WHERE id=$1 FOR UPDATE", [
        requireId(b.courseSubjectId),
      ]);
      await assignment(db, req.user, b.courseSubjectId, "grade");
      const {
        rows: [range],
      } = await db.query(
        `SELECT $2::date BETWEEN p.fecha_inicio AND p.fecha_fin AS valid FROM curso_asignatura ca
        JOIN curso c ON c.id=ca.curso_id JOIN periodo_escolar p ON p.id=c.periodo_id WHERE ca.id=$1`,
        [b.courseSubjectId, b.date],
      );
      if (!range.valid) fail(400, "date_outside_period");
      const {
        rows: [total],
      } = await db.query(
        "SELECT COALESCE(SUM(ponderacion),0) AS weight FROM evaluacion WHERE curso_asignatura_id=$1 AND estado<>'anulada'",
        [b.courseSubjectId],
      );
      if (Number(total.weight) + b.weight > 100)
        fail(409, "weight_exceeds_100");
      const {
        rows: [row],
      } = await db.query(
        `INSERT INTO evaluacion(curso_asignatura_id,nombre,fecha,ponderacion,creada_por)
        VALUES($1,$2,$3,$4,$5) RETURNING *,actualizado_en::text AS revision`,
        [b.courseSubjectId, b.name.trim(), b.date, b.weight, req.user.id],
      );
      await audit(db, req.user.id, "create", "evaluacion", row.id, null, row);
      return row;
    });
    res.status(201).json({ evaluation: ev });
  });
  app.put("/teacher/evaluations/:id/grades", teacher, async (req, res) => {
    const b = req.body,
      records = b.records;
    if (
      !Array.isArray(records) ||
      !records.length ||
      records.length > 100 ||
      new Set(records.map((r) => r?.studentId)).size !== records.length ||
      records.some(
        (r) =>
          typeof r?.value !== "number" ||
          !Number.isFinite(r.value) ||
          r.value < 1 ||
          r.value > 7 ||
          Math.abs(r.value * 10 - Math.round(r.value * 10)) > 1e-7,
      )
    )
      fail(400, "invalid_grades");
    await transaction(pool, async (db) => {
      const { ev, ca } = await evaluation(
        db,
        req.user,
        req.params.id,
        b.expectedRevision,
      );
      for (const r of records) {
        await member(db, ca.curso_id, r.studentId);
        const {
          rows: [before],
        } = await db.query(
          "SELECT * FROM calificacion WHERE evaluacion_id=$1 AND estudiante_id=$2",
          [ev.id, r.studentId],
        );
        if (before && Number(before.valor) === r.value) continue;
        if (before && !text(b.reason, 8, 2000))
          fail(400, "correction_reason_required");
        const {
          rows: [after],
        } = await db.query(
          `INSERT INTO calificacion(evaluacion_id,estudiante_id,valor,registrada_por,motivo_correccion,visible_estudiante,publicada_en,publicada_por)
          VALUES($1,$2,$3,$4,$5,$6,CASE WHEN $6 THEN NOW() END,CASE WHEN $6 THEN $4::uuid END)
          ON CONFLICT(evaluacion_id,estudiante_id) DO UPDATE SET valor=EXCLUDED.valor,registrada_por=EXCLUDED.registrada_por,
          motivo_correccion=EXCLUDED.motivo_correccion,version=calificacion.version+1 RETURNING *`,
          [
            ev.id,
            r.studentId,
            r.value,
            req.user.id,
            before ? b.reason.trim() : null,
            ev.estado === "publicada",
          ],
        );
        await audit(
          db,
          req.user.id,
          before ? "correct" : "create",
          "calificacion",
          after.id,
          before,
          after,
        );
      }
      await db.query("UPDATE evaluacion SET actualizado_en=NOW() WHERE id=$1", [
        ev.id,
      ]);
    });
    res.json({ saved: true });
  });
  app.post("/teacher/evaluations/:id/publish", teacher, async (req, res) => {
    await transaction(pool, async (db) => {
      const { ev } = await evaluation(
        db,
        req.user,
        req.params.id,
        req.body.expectedRevision,
      );
      const count = await db.query(
        "SELECT 1 FROM calificacion WHERE evaluacion_id=$1 LIMIT 1",
        [ev.id],
      );
      if (!count.rowCount) fail(409, "evaluation_empty");
      const {
        rows: [after],
      } = await db.query(
        "UPDATE evaluacion SET estado='publicada',visible_estudiante=TRUE,publicada_en=NOW(),publicada_por=$2 WHERE id=$1 RETURNING *",
        [ev.id, req.user.id],
      );
      await db.query(
        "UPDATE calificacion SET visible_estudiante=TRUE,publicada_en=NOW(),publicada_por=$2 WHERE evaluacion_id=$1",
        [ev.id, req.user.id],
      );
      await audit(db, req.user.id, "publish", "evaluacion", ev.id, ev, after);
    });
    res.json({ published: true });
  });
  app.post("/teacher/annotations", teacher, async (req, res) => {
    const b = req.body;
    if (
      !["positiva", "negativa"].includes(b.type) ||
      !text(b.category, 1, 80) ||
      !text(b.detail, 8, 4000) ||
      !["privada", "equipo_docente", "estudiante"].includes(b.visibility)
    )
      fail(400, "invalid_annotation");
    const annotation = await transaction(pool, async (db) => {
      const ca = await assignment(db, req.user, b.courseSubjectId, "read");
      await member(db, ca.curso_id, b.studentId);
      const {
        rows: [row],
      } = await db.query(
        `INSERT INTO anotacion_estudiante(estudiante_id,curso_id,curso_asignatura_id,tipo,categoria,detalle,visibilidad,registrada_por,publicada_en,publicada_por)
        VALUES($1,$2,$3,$4,$5,$6,$7::varchar,$8::uuid,CASE WHEN $7::varchar='estudiante' THEN NOW() END,CASE WHEN $7::varchar='estudiante' THEN $8::uuid END) RETURNING *`,
        [
          b.studentId,
          ca.curso_id,
          ca.id,
          b.type,
          b.category.trim(),
          b.detail.trim(),
          b.visibility,
          req.user.id,
        ],
      );
      await audit(
        db,
        req.user.id,
        "create",
        "anotacion_estudiante",
        row.id,
        null,
        row,
      );
      return row;
    });
    res.status(201).json({ annotation });
  });
  app.post("/teacher/annotations/:id/void", teacher, async (req, res) => {
    if (!text(req.body.reason, 8, 2000))
      fail(400, "correction_reason_required");
    await transaction(pool, async (db) => {
      const {
        rows: [before],
      } = await db.query(
        "SELECT *,actualizado_en::text AS revision FROM anotacion_estudiante WHERE id=$1 FOR UPDATE",
        [requireId(req.params.id)],
      );
      if (!before) fail(404, "annotation_not_found");
      await assignment(db, req.user, before.curso_asignatura_id, "read");
      if (before.registrada_por !== req.user.id) fail(403, "access_denied");
      if (
        before.estado !== "vigente" ||
        before.revision !== req.body.expectedRevision
      )
        fail(409, "stale_record");
      const {
        rows: [after],
      } = await db.query(
        "UPDATE anotacion_estudiante SET estado='anulada',anulada_por=$2,anulada_en=NOW(),motivo_anulacion=$3 WHERE id=$1 RETURNING *",
        [before.id, req.user.id, req.body.reason.trim()],
      );
      await audit(
        db,
        req.user.id,
        "void",
        "anotacion_estudiante",
        before.id,
        before,
        after,
      );
    });
    res.json({ voided: true });
  });
}

export async function studentRecords(pool, id) {
  const { rows: attendance } = await pool.query(
    `SELECT a.id,s.fecha::text AS date,s.titulo AS title,s.bloque AS block,sub.nombre AS subject,a.estado AS status
    FROM asistencia a JOIN sesion_clase s ON s.id=a.sesion_id JOIN curso_asignatura ca ON ca.id=s.curso_asignatura_id
    JOIN asignatura sub ON sub.id=ca.asignatura_id WHERE a.estudiante_id=$1 AND s.publicada AND s.estado='realizada' ORDER BY s.fecha DESC,s.bloque`,
    [id],
  );
  const { rows: annotations } = await pool.query(
    `SELECT a.id,a.tipo AS type,a.categoria AS category,a.detalle AS detail,a.creado_en AS date,sub.nombre AS subject
    FROM anotacion_estudiante a LEFT JOIN curso_asignatura ca ON ca.id=a.curso_asignatura_id LEFT JOIN asignatura sub ON sub.id=ca.asignatura_id
    WHERE a.estudiante_id=$1 AND a.estado='vigente' AND a.publicada_en IS NOT NULL AND a.visibilidad IN ('estudiante','estudiante_apoderado') ORDER BY a.creado_en DESC`,
    [id],
  );
  return { attendance, annotations };
}

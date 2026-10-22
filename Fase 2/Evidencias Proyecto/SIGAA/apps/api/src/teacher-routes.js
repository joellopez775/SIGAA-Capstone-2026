import { fail, requireId, transaction, audit } from "./repository.js";
// Used by every teacher mutation; assignment permissions are read from PostgreSQL.
export async function assignment(db, user, id, permission) {
  requireId(id);
  const { rows } = await db.query(
    `SELECT ca.id,ca.curso_id FROM curso_asignatura ca
    JOIN curso c ON c.id=ca.curso_id JOIN periodo_escolar p ON p.id=c.periodo_id
    WHERE ca.id=$2 AND ca.estado='activa' AND c.estado='activo' AND p.estado='activo'
    AND (ca.profesor_id=$1 OR EXISTS (
      SELECT 1 FROM asignacion_docente ad JOIN funcionario f ON f.id=ad.funcionario_id
      WHERE ad.curso_asignatura_id=ca.id AND f.usuario_id=$1 AND f.estado='activo'
      AND ad.vigente_desde<=CURRENT_DATE AND (ad.vigente_hasta IS NULL OR ad.vigente_hasta>=CURRENT_DATE)
      AND CASE $3 WHEN 'plan' THEN ad.puede_planificar WHEN 'attendance' THEN ad.puede_registrar_asistencia WHEN 'grade' THEN ad.puede_calificar WHEN 'read' THEN TRUE ELSE FALSE END
    )) FOR SHARE OF ca,c,p`,
    [user.id, id, permission],
  );
  if (!rows[0]) fail(403, "assignment_out_of_scope");
  return rows[0];
}
export function date(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function text(value, min, max) {
  return (
    typeof value === "string" &&
    value.trim().length >= min &&
    value.length <= max
  );
}
export function teacherRoutes(app, pool) {
  const teacher = (req, _res, next) => {
    if (req.user.role !== "teacher") fail(403, "access_denied");
    next();
  };
  app.get("/teacher/workspace", teacher, async (req, res) => {
    const { rows: assignments } = await pool.query(
      `SELECT ca.id,ca.curso_id AS "courseId",a.nombre AS subject,n.nombre||' '||c.letra AS "courseName" FROM curso_asignatura ca
      JOIN asignatura a ON a.id=ca.asignatura_id
      JOIN curso c ON c.id=ca.curso_id JOIN periodo_escolar p ON p.id=c.periodo_id
      JOIN nivel_educativo n ON n.id=c.nivel_id
      WHERE ca.estado='activa' AND c.estado='activo' AND p.estado='activo'
      AND (ca.profesor_id=$1 OR EXISTS (
        SELECT 1 FROM asignacion_docente ad JOIN funcionario f ON f.id=ad.funcionario_id
        WHERE ad.curso_asignatura_id=ca.id AND f.usuario_id=$1 AND f.estado='activo'
        AND ad.vigente_desde<=CURRENT_DATE AND (ad.vigente_hasta IS NULL OR ad.vigente_hasta>=CURRENT_DATE)
      )) ORDER BY a.nombre`,
      [req.user.id],
    );
    res.json({ assignments });
  });
  app.post("/teacher/classes", teacher, async (req, res) => {
    const body = req.body;
    if (
      !date(body?.date) ||
      !text(body?.title, 1, 180) ||
      !text(body?.objective, 1, 2000) ||
      !text(body?.block, 1, 40)
    )
      fail(400, "invalid_class_data");
    const session = await transaction(pool, async (db) => {
      await assignment(db, req.user, body.courseSubjectId, "plan");
      const period = await db.query(
        `SELECT 1 FROM curso_asignatura ca JOIN curso c ON c.id=ca.curso_id
        JOIN periodo_escolar p ON p.id=c.periodo_id WHERE ca.id=$1 AND $2::date BETWEEN p.fecha_inicio AND p.fecha_fin`,
        [body.courseSubjectId, body.date],
      );
      if (!period.rowCount) fail(400, "date_outside_period");
      const { rows } = await db.query(
        `INSERT INTO sesion_clase(curso_asignatura_id,fecha,bloque,titulo,objetivo,creada_por)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING *,actualizado_en::text AS revision`,
        [
          body.courseSubjectId,
          body.date,
          body.block,
          body.title.trim(),
          body.objective.trim(),
          req.user.id,
        ],
      );
      await audit(
        db,
        req.user.id,
        "create",
        "sesion_clase",
        rows[0].id,
        null,
        rows[0],
      );
      return rows[0];
    });
    res.status(201).json({ classSession: session });
  });
  app.put("/teacher/classes/:id/attendance", teacher, async (req, res) => {
    const id = requireId(req.params.id),
      records = req.body?.records;
    const states = {
      present: "presente",
      absent: "ausente",
      late: "atraso",
      excused: "justificada",
    };
    if (
      !Array.isArray(records) ||
      !records.length ||
      records.length > 100 ||
      new Set(records.map((r) => r?.studentId)).size !== records.length ||
      records.some((r) => !r || !Object.hasOwn(states, r.status))
    )
      fail(400, "invalid_attendance_data");
    await transaction(pool, async (db) => {
      const {
        rows: [session],
      } = await db.query(
        "SELECT *,actualizado_en::text AS revision,fecha>(NOW() AT TIME ZONE 'America/Santiago')::date AS future FROM sesion_clase WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (!session) fail(404, "class_not_found");
      const ca = await assignment(
        db,
        req.user,
        session.curso_asignatura_id,
        "attendance",
      );
      if (session.estado === "cancelada" || session.future)
        fail(409, "class_not_recordable");
      if (req.body.expectedRevision !== session.revision)
        fail(409, "stale_record");
      for (const record of records) {
        requireId(record.studentId);
        const member = await db.query(
          "SELECT 1 FROM matricula WHERE estudiante_id=$1 AND curso_id=$2 AND estado='activa' FOR SHARE",
          [record.studentId, ca.curso_id],
        );
        if (!member.rowCount) fail(403, "student_out_of_scope");
        const before = await db.query(
          "SELECT * FROM asistencia WHERE sesion_id=$1 AND estudiante_id=$2 FOR UPDATE",
          [id, record.studentId],
        );
        if (states[record.status] !== "justificada" && (await db.query(
          "SELECT 1 FROM justificacion_ausencia WHERE sesion_id=$1 AND estudiante_id=$2 AND estado='aceptada'",
          [id, record.studentId],
        )).rowCount) fail(409, "approved_justification");
        const {
          rows: [row],
        } = await db.query(
          `INSERT INTO asistencia(sesion_id,estudiante_id,estado,registrada_por) VALUES($1,$2,$3,$4)
          ON CONFLICT(sesion_id,estudiante_id) DO UPDATE SET estado=EXCLUDED.estado,registrada_por=EXCLUDED.registrada_por RETURNING *`,
          [id, record.studentId, states[record.status], req.user.id],
        );
        await audit(
          db,
          req.user.id,
          before.rowCount ? "update" : "create",
          "asistencia",
          row.id,
          before.rows[0],
          row,
        );
      }
      await db.query(
        "UPDATE sesion_clase SET estado='realizada',publicada=TRUE,publicada_en=COALESCE(publicada_en,NOW()) WHERE id=$1",
        [id],
      );
    });
    res.json({ saved: true });
  });
}

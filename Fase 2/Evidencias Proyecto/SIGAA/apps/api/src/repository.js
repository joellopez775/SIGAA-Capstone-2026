export class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
  }
}
export const fail = (status, code) => {
  throw new HttpError(status, code);
};
export const uuid = (value) =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
    value ?? "",
  );
export function requireId(id) {
  if (!uuid(id)) fail(400, "invalid_id");
  return id;
}
export async function transaction(pool, action) {
  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const result = await action(db);
    await db.query("COMMIT");
    return result;
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}
export async function audit(db, actor, action, entity, id, before, after) {
  await db.query(
    `INSERT INTO evento_auditoria(usuario_id,accion,entidad,entidad_id,valor_anterior,valor_nuevo)
    VALUES($1,$2,$3,$4,$5,$6)`,
    [actor, action, entity, id, before ?? null, after ?? null],
  );
}
// The role and identity always come from the persisted session, never request headers.
export const teacherCourse = `(c.profesor_jefe_id=$1 OR EXISTS (
  SELECT 1 FROM profesor_jefatura pj JOIN funcionario f ON f.id=pj.funcionario_id
  WHERE pj.curso_id=c.id AND f.usuario_id=$1 AND f.estado='activo' AND pj.vigente_desde<=CURRENT_DATE
  AND (pj.vigente_hasta IS NULL OR pj.vigente_hasta>=CURRENT_DATE)
) OR EXISTS (
  SELECT 1 FROM curso_asignatura ca WHERE ca.curso_id=c.id AND ca.profesor_id=$1 AND ca.estado='activa'
) OR EXISTS (
  SELECT 1 FROM asignacion_docente ad JOIN funcionario f ON f.id=ad.funcionario_id
  JOIN curso_asignatura ca ON ca.id=ad.curso_asignatura_id
  WHERE ca.curso_id=c.id AND f.usuario_id=$1 AND f.estado='activo' AND ca.estado='activa'
  AND ad.vigente_desde<=CURRENT_DATE AND (ad.vigente_hasta IS NULL OR ad.vigente_hasta>=CURRENT_DATE)
))`;
export async function canReadStudent(db, user, studentId) {
  if (user.role === "admin") return true;
  if (user.role === "student") return studentId === user.studentId;
  if (user.role !== "teacher") return false;
  const result = await db.query(
    `SELECT 1 FROM matricula m JOIN curso c ON c.id=m.curso_id
    JOIN periodo_escolar p ON p.id=c.periodo_id WHERE m.estudiante_id=$2 AND m.estado='activa'
    AND c.estado='activo' AND p.estado='activo' AND ${teacherCourse} LIMIT 1`,
    [user.id, studentId],
  );
  return result.rowCount > 0;
}
export function studentInput(body) {
  const text = (key, max, required = false) => {
    const value = body?.[key];
    if (value == null && !required) return null;
    if (
      typeof value !== "string" ||
      (required && !value.trim()) ||
      value.trim().length > max
    )
      fail(400, "invalid_student_data");
    return value.trim() || null;
  };
  const identifier = text("identifier", 40, true)?.toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{2,39}$/.test(identifier))
    fail(400, "invalid_identifier");
  const firstName = text("firstName", 100, true),
    lastName = text("lastName", 120, true);
  const email = text("email", 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail(400, "invalid_email");
  const status = body.status ?? "regular";
  if (!["regular", "suspendido", "retirado", "egresado"].includes(status))
    fail(400, "invalid_student_status");
  return {
    identifier,
    firstName,
    lastName,
    email: email?.toLowerCase() ?? null,
    status,
  };
}
export const studentColumns = `id, identificador_interno AS identifier, nombres AS "firstName",
  apellidos AS "lastName", email_institucional AS email, estado AS status,
  creado_en AS "createdAt", actualizado_en AS "updatedAt", creado_por AS "createdBy", actualizado_por AS "updatedBy"`;

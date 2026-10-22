import express from "express";
import { allowedOrigins } from "./origins.js";
import { teacherRoutes } from "./teacher-routes.js";
import { structureRoutes } from "./structure-routes.js";
import { supportRoutes } from "./support-routes.js";
import { academicRoutes, studentRecords } from "./academic-routes.js";
import {
  newToken,
  digest,
  csrfFor,
  equal,
  sessionCookie,
  verifyPassword,
  hashPassword,
  validPassword,
  roleFor,
} from "./security.js";
import {
  fail,
  HttpError,
  requireId,
  transaction,
  audit,
  teacherCourse,
  canReadStudent,
  studentInput,
  studentColumns,
} from "./repository.js";

export function createApp({
  pool,
  origin = process.env.APP_ORIGIN ?? "http://localhost:8088",
  additionalOrigins = process.env.APP_ADDITIONAL_ORIGINS ?? "",
  production = process.env.NODE_ENV === "production",
  sessionHours = 8,
  idleMinutes = 30,
}) {
  const trustedOrigins = allowedOrigins(origin, additionalOrigins, production);
  const app = express(),
    cookieName = production ? "__Host-sigaa_session" : "sigaa_session";
  let activeHashes = 0;
  const cookieOptions = {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: "/",
  };
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.use((req, _res, next) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (!trustedOrigins.has(req.get("origin"))) fail(403, "origin_rejected");
      if (!req.is("application/json")) fail(415, "json_required");
    }
    next();
  });
  const userFor = async (id) => {
    const { rows } = await pool.query(
      `SELECT u.id,u.nombre AS name,u.email,e.id AS "studentId",
      COALESCE((SELECT array_agg(r.codigo) FROM usuario_rol ur JOIN rol r ON r.id=ur.rol_id
      WHERE ur.usuario_id=u.id AND ur.vigente_desde<=NOW() AND (ur.vigente_hasta IS NULL OR ur.vigente_hasta>NOW())
      AND ur.alcance='{}'::jsonb),'{}') AS codes
      FROM usuario u LEFT JOIN estudiante e ON e.usuario_id=u.id WHERE u.id=$1 AND u.estado='activo'`,
      [id],
    );
    if (!rows[0]) return null;
    const { codes, ...user } = rows[0];
    return { ...user, role: roleFor(codes) };
  };
  const authenticate = async (req, res, next) => {
    const token = sessionCookie(req, cookieName);
    if (!token) fail(401, "authentication_required");
    const { rows } = await pool.query(
      `UPDATE sesion_usuario SET ultimo_uso_en=NOW()
      WHERE token_hash=$1 AND revocada_en IS NULL AND expira_en>NOW()
      AND ultimo_uso_en>NOW()-($2 * INTERVAL '1 minute') RETURNING usuario_id`,
      [digest(token), idleMinutes],
    );
    if (!rows[0]) {
      res.clearCookie(cookieName, cookieOptions);
      fail(401, "session_expired");
    }
    req.user = await userFor(rows[0].usuario_id);
    if (!req.user || req.user.role === "unsupported")
      fail(403, "access_denied");
    req.token = token;
    if (
      !["GET", "HEAD"].includes(req.method) &&
      !equal(req.get("x-csrf-token"), csrfFor(token))
    )
      fail(403, "csrf_rejected");
    next();
  };
  const role =
    (...roles) =>
    (req, _res, next) => {
      if (!roles.includes(req.user.role)) fail(403, "access_denied");
      next();
    };
  async function limitedHash(action) {
    if (activeHashes >= 2) fail(429, "try_again_later");
    activeHashes++;
    try {
      return await action();
    } finally {
      activeHashes--;
    }
  }
  async function loginLimit(key, max) {
    const { rows } = await pool.query(
      `INSERT INTO limite_login(clave,intentos,ventana) VALUES($1,1,NOW())
      ON CONFLICT(clave) DO UPDATE SET intentos=CASE WHEN limite_login.ventana<NOW()-INTERVAL '15 minutes' THEN 1 ELSE limite_login.intentos+1 END,
      ventana=CASE WHEN limite_login.ventana<NOW()-INTERVAL '15 minutes' THEN NOW() ELSE limite_login.ventana END RETURNING intentos`,
      [digest(key)],
    );
    if (rows[0].intentos > max) fail(429, "try_again_later");
  }
  app.get("/health", (_req, res) =>
    res.json({ status: "ok", service: "api", version: "0.8.0" }),
  );
  app.get("/db-health", async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.post("/auth/login", async (req, res) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password = req.body?.password;
    if (
      email.length > 254 ||
      typeof password !== "string" ||
      Buffer.byteLength(password) > 256
    )
      fail(401, "invalid_credentials");
    await loginLimit("ip:" + req.socket.remoteAddress, 200);
    await loginLimit("email:" + email, 20);
    const { rows } = await pool.query(
      "SELECT id,password_hash,estado FROM usuario WHERE email=$1",
      [email],
    );
    const account = rows[0];
    const valid = await limitedHash(() =>
      verifyPassword(password, account?.password_hash),
    );
    if (!valid || account.estado !== "activo") fail(401, "invalid_credentials");
    const user = await userFor(account.id);
    if (!user || user.role === "unsupported") fail(401, "invalid_credentials");
    const token = newToken();
    await transaction(pool, async (db) => {
      const locked = await db.query(
        "SELECT password_hash,estado FROM usuario WHERE id=$1 FOR UPDATE",
        [user.id],
      );
      if (
        locked.rows[0].password_hash !== account.password_hash ||
        locked.rows[0].estado !== "activo"
      )
        fail(401, "invalid_credentials");
      const old = sessionCookie(req, cookieName);
      if (old)
        await db.query(
          "UPDATE sesion_usuario SET revocada_en=NOW() WHERE token_hash=$1",
          [digest(old)],
        );
      await db.query(
        "INSERT INTO sesion_usuario(token_hash,usuario_id,expira_en) VALUES($1,$2,NOW()+($3 * INTERVAL '1 hour'))",
        [digest(token), user.id, sessionHours],
      );
      await db.query("UPDATE usuario SET ultimo_acceso_en=NOW() WHERE id=$1", [
        user.id,
      ]);
    });
    res.cookie(cookieName, token, {
      ...cookieOptions,
      maxAge: sessionHours * 3600000,
    });
    res.json({ user, csrfToken: csrfFor(token) });
  });
  app.get("/auth/me", authenticate, (req, res) =>
    res.json({ user: req.user, csrfToken: csrfFor(req.token) }),
  );
  app.post("/auth/logout", authenticate, async (req, res) => {
    await pool.query(
      "UPDATE sesion_usuario SET revocada_en=NOW() WHERE token_hash=$1",
      [digest(req.token)],
    );
    res.clearCookie(cookieName, cookieOptions);
    res.status(204).end();
  });
  app.post("/auth/logout-all", authenticate, async (req, res) => {
    await pool.query(
      "UPDATE sesion_usuario SET revocada_en=NOW() WHERE usuario_id=$1 AND revocada_en IS NULL",
      [req.user.id],
    );
    res.clearCookie(cookieName, cookieOptions);
    res.status(204).end();
  });
  app.post("/auth/password", authenticate, async (req, res) => {
    if (!validPassword(req.body?.newPassword))
      fail(400, "invalid_password_length");
    await loginLimit("password:" + req.user.id, 10);
    const { rows } = await pool.query(
      "SELECT password_hash FROM usuario WHERE id=$1",
      [req.user.id],
    );
    const valid = await limitedHash(() =>
      verifyPassword(req.body?.currentPassword, rows[0].password_hash),
    );
    if (!valid) fail(401, "invalid_credentials");
    const hash = await limitedHash(() => hashPassword(req.body.newPassword));
    await transaction(pool, async (db) => {
      const changed = await db.query(
        "UPDATE usuario SET password_hash=$2 WHERE id=$1 AND password_hash=$3 RETURNING id",
        [req.user.id, hash, rows[0].password_hash],
      );
      if (!changed.rowCount) fail(409, "account_changed");
      await db.query(
        "UPDATE sesion_usuario SET revocada_en=NOW() WHERE usuario_id=$1 AND revocada_en IS NULL",
        [req.user.id],
      );
      await audit(
        db,
        req.user.id,
        "password_change",
        "usuario",
        req.user.id,
        null,
        { passwordChanged: true },
      );
    });
    res.clearCookie(cookieName, cookieOptions);
    res.status(204).end();
  });
  app.use(authenticate);
  structureRoutes(app, pool);
  supportRoutes(app, pool);
  teacherRoutes(app, pool);
  academicRoutes(app, pool);
  app.get("/courses", role("admin", "teacher", "student", "inspector", "leadership"), async (req, res) => {
    const filter =
      req.user.role === "teacher"
        ? teacherCourse
        : req.user.role === "student"
          ? "EXISTS (SELECT 1 FROM matricula m JOIN estudiante e ON e.id=m.estudiante_id WHERE m.curso_id=c.id AND e.usuario_id=$1 AND m.estado='activa')"
          : "$1::uuid IS NOT NULL";
    const { rows } = await pool.query(
      `SELECT c.id,n.nombre||' '||c.letra AS name,c.estado AS status,c.capacidad AS capacity,
      p.id AS "periodId",p.nombre AS period,p.anio AS year,p.estado AS "periodStatus"
      FROM curso c JOIN nivel_educativo n ON n.id=c.nivel_id JOIN periodo_escolar p ON p.id=c.periodo_id
      WHERE ${filter} ORDER BY p.anio DESC,n.orden,c.letra`,
      [req.user.id],
    );
    res.json({ courses: rows });
  });
  app.get(
    "/students",
    role("admin", "teacher", "student", "inspector", "leadership"),
    async (req, res) => {
      let filter = "$1::uuid IS NOT NULL";
      if (req.user.role === "student") filter = "e.usuario_id=$1";
      if (req.user.role === "teacher")
        filter = `EXISTS (SELECT 1 FROM matricula m JOIN curso c ON c.id=m.curso_id
      JOIN periodo_escolar p ON p.id=c.periodo_id WHERE m.estudiante_id=e.id AND m.estado='activa'
      AND c.estado='activo' AND p.estado='activo' AND ${teacherCourse})`;
      const { rows } = await pool.query(
        `SELECT e.id,e.identificador_interno AS identifier,e.nombres AS "firstName",e.apellidos AS "lastName",
      e.email_institucional AS email,e.estado AS status,e.actualizado_en AS "updatedAt"
      FROM estudiante e WHERE ${filter} ORDER BY e.apellidos,e.nombres LIMIT 500`,
        [req.user.id],
      );
      res.json({ students: rows });
    },
  );
  app.get("/students/:id", async (req, res) => {
    const id = requireId(req.params.id);
    if (!(await canReadStudent(pool, req.user, id))) fail(403, "access_denied");
    const { rows } = await pool.query(
      `SELECT ${studentColumns} FROM estudiante WHERE id=$1`,
      [id],
    );
    if (!rows[0]) fail(404, "student_not_found");
    res.json({ student: rows[0] });
  });
  app.post("/students", role("admin"), async (req, res) => {
    const s = studentInput(req.body);
    const result = await transaction(pool, async (db) => {
      const { rows } = await db.query(
        `INSERT INTO estudiante(identificador_interno,nombres,apellidos,email_institucional,estado,creado_por,actualizado_por)
        VALUES($1,$2,$3,$4,$5,$6,$6) RETURNING ${studentColumns}`,
        [s.identifier, s.firstName, s.lastName, s.email, s.status, req.user.id],
      );
      await audit(
        db,
        req.user.id,
        "create",
        "estudiante",
        rows[0].id,
        null,
        rows[0],
      );
      return rows[0];
    });
    res.status(201).json({ student: result });
  });
  app.put("/students/:id", role("admin"), async (req, res) => {
    const id = requireId(req.params.id),
      s = studentInput(req.body);
    const student = await transaction(pool, async (db) => {
      const before = await db.query(
        `SELECT ${studentColumns} FROM estudiante WHERE id=$1 FOR UPDATE`,
        [id],
      );
      if (!before.rows[0]) fail(404, "student_not_found");
      if (req.body.expectedUpdatedAt !== before.rows[0].updatedAt.toISOString())
        fail(409, "stale_record");
      const { rows } = await db.query(
        `UPDATE estudiante SET identificador_interno=$2,nombres=$3,apellidos=$4,email_institucional=$5,
        estado=$6,actualizado_por=$7 WHERE id=$1 RETURNING ${studentColumns}`,
        [
          id,
          s.identifier,
          s.firstName,
          s.lastName,
          s.email,
          s.status,
          req.user.id,
        ],
      );
      await audit(
        db,
        req.user.id,
        "update",
        "estudiante",
        id,
        before.rows[0],
        rows[0],
      );
      return rows[0];
    });
    res.json({ student });
  });
  app.get("/enrollments", async (req, res) => {
    let filter = "$1::uuid IS NOT NULL";
    if (req.user.role === "student") filter = "e.usuario_id=$1";
    if (req.user.role === "teacher")
      filter = `c.estado='activo' AND p.estado='activo' AND ${teacherCourse}`;
    const { rows } = await pool.query(
      `SELECT m.id,m.estudiante_id AS "studentId",m.curso_id AS "courseId",m.estado AS status,
      e.nombres||' '||e.apellidos AS student,n.nombre||' '||c.letra AS course,p.nombre AS period,p.id AS "periodId",
      m.creado_en AS "createdAt",m.actualizado_en AS "updatedAt",m.finalizado_en AS "endedAt"
      FROM matricula m JOIN estudiante e ON e.id=m.estudiante_id JOIN curso c ON c.id=m.curso_id
      JOIN nivel_educativo n ON n.id=c.nivel_id JOIN periodo_escolar p ON p.id=c.periodo_id
      WHERE ${filter} ORDER BY m.creado_en DESC LIMIT 500`,
      [req.user.id],
    );
    res.json({ enrollments: rows });
  });
  app.post("/enrollments", role("admin"), async (req, res) => {
    const studentId = requireId(req.body?.studentId),
      courseId = requireId(req.body?.courseId),
      periodId = requireId(req.body?.periodId);
    const enrollment = await transaction(pool, async (db) => {
      const student = await db.query(
        "SELECT estado FROM estudiante WHERE id=$1 FOR UPDATE",
        [studentId],
      );
      if (student.rows[0]?.estado !== "regular")
        fail(400, "student_not_regular");
      const course = await db.query(
        `SELECT c.*,p.estado AS periodo_estado FROM curso c JOIN periodo_escolar p ON p.id=c.periodo_id
        WHERE c.id=$1 AND c.periodo_id=$2 FOR UPDATE OF c`,
        [courseId, periodId],
      );
      if (
        course.rows[0]?.estado !== "activo" ||
        course.rows[0]?.periodo_estado !== "activo"
      )
        fail(400, "invalid_course_period");
      const exists = await db.query(
        `SELECT 1 FROM matricula m JOIN curso c ON c.id=m.curso_id
        WHERE m.estudiante_id=$1 AND c.periodo_id=$2 AND m.estado='activa'`,
        [studentId, periodId],
      );
      if (exists.rowCount) fail(409, "active_enrollment_exists");
      const count = await db.query(
        "SELECT COUNT(*)::int AS total FROM matricula WHERE curso_id=$1 AND estado='activa'",
        [courseId],
      );
      if (
        course.rows[0].capacidad !== null &&
        count.rows[0].total >= course.rows[0].capacidad
      )
        fail(409, "course_full");
      const { rows } = await db.query(
        `INSERT INTO matricula(estudiante_id,curso_id,creado_por,actualizado_por) VALUES($1,$2,$3,$3) RETURNING *`,
        [studentId, courseId, req.user.id],
      );
      await audit(
        db,
        req.user.id,
        "create",
        "matricula",
        rows[0].id,
        null,
        rows[0],
      );
      return rows[0];
    });
    res.status(201).json({ enrollment });
  });
  app.patch("/enrollments/:id", role("admin"), async (req, res) => {
    const id = requireId(req.params.id),
      status = req.body?.status,
      reason = req.body?.reason;
    if (
      !["retirada", "finalizada", "anulada"].includes(status) ||
      typeof reason !== "string" ||
      reason.trim().length < 8 ||
      reason.length > 500
    )
      fail(400, "invalid_enrollment_change");
    const enrollment = await transaction(pool, async (db) => {
      const before = await db.query(
        "SELECT * FROM matricula WHERE id=$1 FOR UPDATE",
        [id],
      );
      if (!before.rows[0]) fail(404, "enrollment_not_found");
      if (before.rows[0].estado !== "activa")
        fail(409, "enrollment_already_closed");
      const { rows } = await db.query(
        "UPDATE matricula SET estado=$2,finalizado_en=NOW(),actualizado_por=$3 WHERE id=$1 RETURNING *",
        [id, status, req.user.id],
      );
      await audit(db, req.user.id, "close", "matricula", id, before.rows[0], {
        ...rows[0],
        reason: reason.trim(),
      });
      return rows[0];
    });
    res.json({ enrollment });
  });
  app.get("/audit/:entity/:id", role("admin"), async (req, res) => {
    if (!["estudiante", "matricula"].includes(req.params.entity))
      fail(400, "invalid_entity");
    const { rows } = await pool.query(
      `SELECT id,usuario_id AS "actorId",accion AS action,creado_en AS date,valor_anterior AS before,valor_nuevo AS after
      FROM evento_auditoria WHERE entidad=$1 AND entidad_id=$2 ORDER BY creado_en DESC LIMIT 100`,
      [req.params.entity, requireId(req.params.id)],
    );
    res.json({ events: rows });
  });
  app.get("/student/workspace/:id", role("student"), async (req, res) => {
    const id = requireId(req.params.id);
    if (id !== req.user.studentId) fail(403, "access_denied");
    const { rows: grades } = await pool.query(
      `SELECT ev.nombre AS evaluation,a.nombre AS subject,ca.valor AS value,ev.fecha AS date,ev.ponderacion AS weight,ca.version
      FROM calificacion ca JOIN evaluacion ev ON ev.id=ca.evaluacion_id JOIN curso_asignatura cs ON cs.id=ev.curso_asignatura_id
      JOIN asignatura a ON a.id=cs.asignatura_id WHERE ca.estudiante_id=$1 AND ca.visible_estudiante AND ev.visible_estudiante
      AND ev.estado IN ('publicada','cerrada') ORDER BY ev.fecha DESC`,
      [id],
    );
    res.json({ grades, ...(await studentRecords(pool, id)) });
  });
  app.use((_req, _res) => fail(404, "not_found"));
  app.use((error, _req, res, _next) => {
    if (error instanceof HttpError) {
      if (error.status === 429) res.set("Retry-After", "900");
      return res.status(error.status).json({ error: error.message });
    }
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "invalid_json" });
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "request_too_large" });
    if (error.code === "23505")
      return res.status(409).json({ error: "duplicate_record" });
    if (["23503", "23514", "22001", "22P02"].includes(error.code))
      return res.status(400).json({ error: "invalid_data" });
    console.error("API operation failed", error.code ?? error.name);
    res.status(500).json({ error: "internal_error" });
  });
  return app;
}

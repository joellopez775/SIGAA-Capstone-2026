import { transaction, fail } from "./repository.js";
import { provisionUser } from "./manage-user.js";
// Explicit synthetic fixture for isolated development/testing. No default credentials.
export async function sampleData(pool, passwords) {
  const { rows } = await pool.query(
    "SELECT (SELECT COUNT(*) FROM usuario)+(SELECT COUNT(*) FROM estudiante) AS total",
  );
  if (Number(rows[0].total) !== 0) fail(409, "sample_requires_empty_database");
  const school = await transaction(pool, async (db) => {
    const {
      rows: [site],
    } = await db.query(
      "INSERT INTO establecimiento(nombre,tipo) VALUES('Liceo de Pruebas SIGAA','liceo') RETURNING id",
    );
    const {
      rows: [period],
    } = await db.query(
      "INSERT INTO periodo_escolar(establecimiento_id,anio,nombre,fecha_inicio,fecha_fin,estado) VALUES($1,2026,'Año escolar 2026','2026-03-01','2026-12-31','activo') RETURNING id",
      [site.id],
    );
    const {
      rows: [level],
    } = await db.query(
      "INSERT INTO nivel_educativo(codigo,nombre,ciclo,orden) VALUES('QA-M2','2° Medio','media',10) ON CONFLICT(codigo) DO UPDATE SET nombre=EXCLUDED.nombre RETURNING id",
    );
    const courses = [];
    for (const letter of ["A", "B"]) {
      const {
        rows: [course],
      } = await db.query(
        "INSERT INTO curso(periodo_id,nivel_id,letra,estado,capacidad) VALUES($1,$2,$3,'activo',35) RETURNING id",
        [period.id, level.id, letter],
      );
      courses.push(course.id);
    }
    const students = [];
    for (const [code, first, last] of [
      ["QA-001", "Camila", "Soto"],
      ["QA-002", "Diego", "Vega"],
    ]) {
      const {
        rows: [student],
      } = await db.query(
        "INSERT INTO estudiante(identificador_interno,nombres,apellidos) VALUES($1,$2,$3) RETURNING id",
        [code, first, last],
      );
      students.push(student.id);
    }
    for (let i = 0; i < 2; i++)
      await db.query(
        "INSERT INTO matricula(estudiante_id,curso_id) VALUES($1,$2)",
        [students[i], courses[i]],
      );
    return { courses, students, periodId: period.id };
  });
  const admin = await provisionUser(pool, {
    email: "admin@sigaa.local",
    name: "Administración SIGAA",
    role: "ADMINISTRADOR",
    password: passwords.admin,
  });
  const teacher = await provisionUser(pool, {
    email: "docente@sigaa.local",
    name: "Daniela Rojas",
    role: "PROFESOR_ASIGNATURA",
    password: passwords.teacher,
  });
  const teacher2 = await provisionUser(pool, {
    email: "docente2@sigaa.local",
    name: "Felipe Díaz",
    role: "PROFESOR_ASIGNATURA",
    password: passwords.teacher2,
  });
  const student = await provisionUser(pool, {
    email: "estudiante@sigaa.local",
    name: "Camila Soto",
    role: "ESTUDIANTE",
    studentId: school.students[0],
    password: passwords.student,
  });
  const student2 = await provisionUser(pool, {
    email: "estudiante2@sigaa.local",
    name: "Diego Vega",
    role: "ESTUDIANTE",
    studentId: school.students[1],
    password: passwords.student2,
  });
  await transaction(pool, async (db) => {
    const {
      rows: [subject],
    } = await db.query(
      "INSERT INTO asignatura(codigo,nombre) VALUES('QA-MAT','Matemática') RETURNING id",
    );
    for (let i = 0; i < 2; i++)
      await db.query(
        "INSERT INTO curso_asignatura(curso_id,asignatura_id,profesor_id,estado) VALUES($1,$2,$3,'activa')",
        [school.courses[i], subject.id, [teacher.id, teacher2.id][i]],
      );
  });
  return { ...school, admin, teacher, teacher2, student, student2 };
}

import pg from "pg";
import { pathToFileURL } from "node:url";
import { hashPassword } from "./security.js";
import { transaction, audit, fail, uuid } from "./repository.js";
export async function provisionUser(pool, input) {
  const { email, name, password, role, studentId } = input;
  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 160 ||
    ![
      "ADMINISTRADOR",
      "INSPECTORIA",
      "DIRECCION_UTP",
      "PROFESOR_ASIGNATURA",
      "PROFESOR_JEFE",
      "ESTUDIANTE",
    ].includes(role)
  )
    fail(400, "invalid_account");
  if (role === "ESTUDIANTE" && !uuid(studentId))
    fail(400, "student_link_required");
  const hash = await hashPassword(password);
  return transaction(pool, async (db) => {
    const user = await db.query(
      "INSERT INTO usuario(email,nombre,password_hash) VALUES($1,$2,$3) RETURNING id,email,nombre",
      [email.trim().toLowerCase(), name.trim(), hash],
    );
    const id = user.rows[0].id;
    await db.query(
      "INSERT INTO usuario_rol(usuario_id,rol_id) SELECT $1,id FROM rol WHERE codigo=$2",
      [id, role],
    );
    if (role === "ESTUDIANTE") {
      const linked = await db.query(
        "UPDATE estudiante SET usuario_id=$1 WHERE id=$2 AND usuario_id IS NULL RETURNING id",
        [id, studentId],
      );
      if (!linked.rowCount) fail(409, "student_already_linked_or_missing");
    }
    await audit(db, null, "provision_local", "usuario", id, null, {
      email,
      role,
      studentId: studentId ?? null,
    });
    return user.rows[0];
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    let input = "";
    for await (const chunk of process.stdin) {
      input += chunk;
      if (input.length > 8192) throw new Error("input_too_large");
    }
    const user = await provisionUser(pool, JSON.parse(input));
    console.log(
      JSON.stringify({ created: true, id: user.id, email: user.email }),
    );
  } catch (error) {
    console.error("Account not created:", error.code ?? error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

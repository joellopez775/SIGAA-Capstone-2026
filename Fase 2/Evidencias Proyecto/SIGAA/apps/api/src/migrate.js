import pg from "pg";
import { readFile } from "node:fs/promises";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = await pool.connect();
try {
  await db.query("SELECT pg_advisory_lock(734003)");
  const profile = await db.query(
    "SELECT value FROM app_metadata WHERE key='schema_profile'",
  );
  if (profile.rows[0]?.value !== "escolar")
    throw new Error("Existing school schema 001-006 required");
  const sources = process.env.MIGRATION_FILES?.split(",") ??
    (process.env.MIGRATION_FILE ? [process.env.MIGRATION_FILE] :
      ["007_sprint3_security.sql","008_school_operations.sql"].map(file =>
        new URL("../../../infra/postgres/init/"+file,import.meta.url)));
  for (const source of sources) await db.query(await readFile(source,"utf8"));
  console.log("Requested additive migrations applied. Existing data preserved.");
} catch (error) {
  await db.query("ROLLBACK");
  console.error("Migration failed:", error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await db.query("SELECT pg_advisory_unlock(734003)");
  db.release();
  await pool.end();
}

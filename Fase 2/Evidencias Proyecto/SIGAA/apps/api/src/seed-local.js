import pg from "pg";
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { sampleData } from "./sample-data.js";
if (
  process.env.NODE_ENV === "production" ||
  process.env.ALLOW_SAMPLE_DATA !== "yes"
)
  throw new Error(
    "Sample data requires non-production and ALLOW_SAMPLE_DATA=yes",
  );
const output = process.env.CREDENTIALS_FILE;
if (!output) throw new Error("CREDENTIALS_FILE required outside Git");
const passwords = Object.fromEntries(
  ["admin", "teacher", "teacher2", "student", "student2"].map((r) => [
    r,
    randomBytes(24).toString("base64url"),
  ]),
);
await writeFile(output, JSON.stringify(passwords, null, 2), {
  mode: 0o600,
  flag: "wx",
});
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await sampleData(pool, passwords);
  console.log(
    "Synthetic sample created. Credentials are in the requested private file.",
  );
} catch (error) {
  console.error("Sample creation failed:", error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

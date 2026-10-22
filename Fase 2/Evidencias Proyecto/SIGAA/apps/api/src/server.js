import pg from "pg";
import { createApp } from "./app.js";

const { Pool } = pg;
const port = Number(process.env.PORT ?? 3000);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

const readiness = await pool.query(
  "SELECT value FROM app_metadata WHERE key='security_schema'",
);
if (readiness.rows[0]?.value !== "1") {
  await pool.end();
  throw new Error(
    "Apply migration 007_sprint3_security.sql before starting this version",
  );
}
const operations = await pool.query("SELECT value FROM app_metadata WHERE key='operations_schema'");
if (operations.rows[0]?.value !== "1") {
  await pool.end();
  throw new Error("Apply additive migration 008_school_operations.sql before starting this version");
}
const app = createApp({ pool });
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`SIGAA API listening on port ${server.address().port}`);
});

async function shutdown(signal) {
  console.log(`Received ${signal}; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

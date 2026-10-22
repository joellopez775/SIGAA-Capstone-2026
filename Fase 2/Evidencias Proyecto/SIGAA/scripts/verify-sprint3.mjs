import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const output = root + "output/evidence/sprint-3/";
mkdirSync(output, { recursive: true });
if (!process.env.TEST_DATABASE_URL)
  throw new Error(
    "Use TEST_DATABASE_URL for an isolated PostgreSQL instance, never production",
  );
const checks = [];
function run(label, command, args, cwd = root, env = process.env) {
  const r = spawnSync(command, args, {
    cwd,
    env,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (r.status !== 0)
    throw new Error(label + " failed\n" + r.stdout + "\n" + r.stderr);
  const passed = r.stdout.match(/# pass (\d+)/)?.[1];
  const text = passed
    ? passed + " pruebas aprobadas"
    : label === "Navegador"
      ? [...r.stdout.matchAll(/^PASS /gm)].length + " recorridos aprobados"
      : "Verificado";
  const tests = [...r.stdout.matchAll(/# Subtest: (.+)/g)].map(
    (match) => match[1],
  );
  checks.push({ label, result: text, ...(tests.length ? { tests } : {}) });
  writeFileSync(
    output + label.replaceAll(" ", "-").toLowerCase() + ".log",
    r.stdout + r.stderr,
  );
  console.log(label + ": " + text);
}
run("Unitarias", "npm", ["test"], root + "apps/api");
run("Integración", "npm", ["run", "test:integration"], root + "apps/api");
run("Navegador", process.execPath, ["scripts/verify-sprint3-browser.mjs"]);
run("Build web", "npm", ["run", "build"], root + "apps/web");
run("Dependencias API", "npm", ["audit", "--omit=dev"], root + "apps/api");
run("Dependencias web", "npm", ["audit"], root + "apps/web");
run("Compose local", "docker", ["compose", "config", "--quiet"]);
run("Compose pruebas", "docker", [
  "compose",
  "-f",
  "compose.test.yaml",
  "config",
  "--quiet",
]);
run(
  "Compose servidor",
  "docker",
  ["compose", "-f", "compose.server.yaml", "config", "--quiet"],
  root,
  {
    ...process.env,
    POSTGRES_DB: "sigaa_config_check",
    POSTGRES_USER: "sigaa_config_check",
    POSTGRES_PASSWORD: "placeholder_only_not_a_real_secret",
    APP_ORIGIN: "https://sigaa.example.test",
  },
);
const browser = JSON.parse(
  readFileSync(root + "tmp/sprint3-evidence/browser-results.json", "utf8"),
);
writeFileSync(
  output + "test-results.json",
  JSON.stringify(
    {
      date: new Date().toISOString(),
      checks,
      browser,
      limitations: [
        "PostgreSQL 14.22 local; Docker PostgreSQL 16 configured, not executed",
        "Remote server not modified",
        "PO acceptance not inferred",
      ],
    },
    null,
    2,
  ),
);

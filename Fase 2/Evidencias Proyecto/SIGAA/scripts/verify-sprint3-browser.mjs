import { chromium } from "../apps/web/node_modules/playwright/index.mjs";
import pg from "../apps/api/node_modules/pg/lib/index.js";
import { sampleData } from "../apps/api/src/sample-data.js";
import { randomBytes } from "node:crypto";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const database = "sigaa_s3_browser_" + randomBytes(6).toString("hex");
if (!process.env.TEST_DATABASE_URL)
  throw new Error("TEST_DATABASE_URL required");
const url = new URL(process.env.TEST_DATABASE_URL);
url.pathname = "/" + database;
const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
let pool, browser, apiProcess, webProcess;
const output = new URL("tmp/sprint3-evidence/", root);
const report = {
  date: new Date().toISOString(),
  browser: "Chromium",
  checks: [],
};
const passwords = Object.fromEntries(
  ["admin", "teacher", "teacher2", "student", "student2"].map((k) => [
    k,
    randomBytes(20).toString("hex"),
  ]),
);
const origin = "http://127.0.0.1:8099";
async function startApi() {
  apiProcess = spawn(process.execPath, ["src/server.js"], {
    cwd: new URL("apps/api/", root),
    env: {
      ...process.env,
      DATABASE_URL: url.href,
      NODE_ENV: "test",
      APP_ORIGIN: origin,
      PORT: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("API timeout")), 10000);
    apiProcess.stdout.on("data", (b) => {
      const m = String(b).match(/port (\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve("http://127.0.0.1:" + m[1]);
      }
    });
    apiProcess.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("API failed " + code));
    });
  });
}
async function check(label, action) {
  await action();
  report.checks.push({ label, result: "pass" });
  console.log("PASS", label);
}
try {
  await mkdir(output, { recursive: true });
  await admin.query('CREATE DATABASE "' + database + '"');
  pool = new pg.Pool({ connectionString: url.href });
  const dir = new URL("infra/postgres/init/", root);
  for (const file of (await readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await pool.query(await readFile(new URL(file, dir), "utf8"));
  await sampleData(pool, passwords);
  const target = await startApi();
  webProcess = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "--host",
      "127.0.0.1",
      "--port",
      "8099",
      "--strictPort",
    ],
    {
      cwd: new URL("apps/web/", root),
      env: { ...process.env, API_TARGET: target },
      stdio: "ignore",
    },
  );
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(origin)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const login = async (role, email) => {
    await page.getByLabel("Correo institucional", { exact: true }).fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(passwords[role]);
    await page.getByRole("button", { name: "Ingresar al portal" }).click();
    await page
      .getByRole("heading", { name: "Mi inicio", exact: true })
      .waitFor();
  };
  const nav = async (name) => {
    if (
      await page
        .getByRole("button", { name: "Abrir menú", exact: true })
        .isVisible()
    )
      await page
        .getByRole("button", { name: "Abrir menú", exact: true })
        .click();
    await page
      .getByRole("navigation")
      .getByRole("button", { name, exact: true })
      .click();
  };
  const logout = async () => {
    if (
      await page
        .getByRole("button", { name: "Abrir menú", exact: true })
        .isVisible()
    )
      await page
        .getByRole("button", { name: "Abrir menú", exact: true })
        .click();
    await page
      .getByRole("button", { name: "Cerrar sesión", exact: true })
      .click();
    await page.getByRole("heading", { name: "Bienvenido de vuelta" }).waitFor();
  };
  await page.goto(origin);
  await check("Login incorrecto muestra error genérico", async () => {
    await page
      .getByLabel("Correo institucional", { exact: true })
      .fill("admin@sigaa.local");
    await page.getByLabel("Contraseña", { exact: true }).fill("wrong");
    await page.getByRole("button", { name: "Ingresar al portal" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Correo o contraseña incorrectos." })
      .waitFor();
  });
  await check("Login administrador y recarga conservan sesión", async () => {
    await login("admin", "admin@sigaa.local");
    await page.reload();
    await page
      .getByRole("heading", { name: "Mi inicio", exact: true })
      .waitFor();
  });
  await page.screenshot({
    path: fileURLToPath(new URL("01-administracion.png", output)),
    fullPage: true,
  });
  await check(
    "Alta y edición de estudiante persisten desde formulario",
    async () => {
      await nav("Estudiantes");
      await page.getByLabel("Identificador", { exact: true }).fill("UI-100");
      await page.getByLabel("Nombres", { exact: true }).fill("Elena");
      await page.getByLabel("Apellidos", { exact: true }).fill("Prueba");
      await page.getByRole("button", { name: "Guardar estudiante" }).click();
      await page.getByRole("button", { name: "Editar UI-100" }).waitFor();
      await page.getByRole("button", { name: "Editar UI-100" }).click();
      await page
        .getByLabel("Nombres", { exact: true })
        .fill("Elena Actualizada");
      await page.getByRole("button", { name: "Guardar estudiante" }).click();
      await page
        .getByText("Elena Actualizada Prueba", { exact: true })
        .waitFor();
      await page.reload();
      await nav("Estudiantes");
      await page
        .getByText("Elena Actualizada Prueba", { exact: true })
        .waitFor();
    },
  );
  await check(
    "Formulario duplicado conserva entradas y muestra error",
    async () => {
      await page.getByLabel("Identificador", { exact: true }).fill("UI-100");
      await page.getByLabel("Nombres", { exact: true }).fill("Otra");
      await page.getByLabel("Apellidos", { exact: true }).fill("Prueba");
      await page.getByRole("button", { name: "Guardar estudiante" }).click();
      await page.getByRole("alert").filter({ hasText: "Ya existe" }).waitFor();
      assert.equal(
        await page.getByLabel("Identificador", { exact: true }).inputValue(),
        "UI-100",
      );
    },
  );
  await check(
    "Matrícula desde formulario, duplicidad y cierre con historial",
    async () => {
      await nav("Matrículas");
      await page
        .getByLabel("Estudiante a matricular")
        .selectOption({ label: "Elena Actualizada Prueba · UI-100" });
      await page
        .getByLabel("Curso y periodo")
        .selectOption({ label: "2° Medio A · Año escolar 2026" });
      await page.getByRole("button", { name: "Guardar matrícula" }).click();
      await page
        .getByRole("button", {
          name: "Cambiar estado de Elena Actualizada Prueba",
        })
        .waitFor();
      await page
        .getByLabel("Estudiante a matricular")
        .selectOption({ label: "Elena Actualizada Prueba · UI-100" });
      await page
        .getByLabel("Curso y periodo")
        .selectOption({ label: "2° Medio A · Año escolar 2026" });
      await page.getByRole("button", { name: "Guardar matrícula" }).click();
      await page
        .getByRole("alert")
        .filter({ hasText: "ya tiene una matrícula activa" })
        .waitFor();
      await page
        .getByRole("button", {
          name: "Cambiar estado de Elena Actualizada Prueba",
        })
        .click();
      await page
        .getByLabel("Motivo del cambio")
        .fill("Cambio de colegio documentado");
      await page.getByRole("button", { name: "Confirmar cambio" }).click();
      await page.getByText("retirada", { exact: true }).waitFor();
    },
  );
  await page.screenshot({
    path: fileURLToPath(new URL("02-matricula-historial.png", output)),
    fullPage: true,
  });
  await check(
    "Contraseña actual incorrecta no cierra una sesión válida",
    async () => {
      await nav("Seguridad");
      await page
        .getByLabel("Contraseña actual", { exact: true })
        .fill("incorrecta");
      await page
        .getByLabel("Nueva contraseña", { exact: true })
        .fill(randomBytes(20).toString("hex"));
      await page
        .getByRole("button", { name: "Cambiar contraseña", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Correo o contraseña incorrectos." })
        .waitFor();
      await page
        .getByRole("heading", { name: "Seguridad", exact: true })
        .waitFor();
    },
  );
  await check(
    "Docente solo consulta sus estudiantes y no ve edición administrativa",
    async () => {
      await logout();
      await login("teacher", "docente@sigaa.local");
      await nav("Estudiantes");
      await page.getByText("Camila Soto", { exact: true }).waitFor();
      assert.equal(
        await page.getByText("Diego Vega", { exact: true }).count(),
        0,
      );
      assert.equal(
        await page.getByRole("button", { name: "Guardar estudiante" }).count(),
        0,
      );
    },
  );
  await check(
    "Estudiante solo ve sus datos y notas reales, sin datos demo",
    async () => {
      await logout();
      await login("student", "estudiante@sigaa.local");
      await nav("Mis datos");
      await page.getByText("Camila Soto", { exact: true }).first().waitFor();
      assert.equal(
        await page.getByText("Diego Vega", { exact: true }).count(),
        0,
      );
      await nav("Mis notas");
      await page
        .getByText("Aún no tienes notas publicadas.", { exact: false })
        .waitFor();
    },
  );
  await check(
    "Menú móvil 390px abre/cierra, navega y no tiene desbordamiento",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await nav("Mis cursos");
      await page
        .getByRole("heading", { name: "Mis cursos", exact: true })
        .first()
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Abrir menú", exact: true })
          .getAttribute("aria-expanded"),
        "false",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await page.screenshot({
        path: fileURLToPath(new URL("03-estudiante-movil.png", output)),
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Abrir menú", exact: true })
        .click();
      await page
        .getByRole("navigation")
        .evaluate((el) =>
          Promise.all(
            el.getAnimations().map((animation) => animation.finished),
          ),
        );
      await page.screenshot({
        path: fileURLToPath(new URL("04-menu-movil.png", output)),
        fullPage: true,
      });
      await page
        .getByRole("button", { name: "Cerrar menú", exact: true })
        .click();
    },
  );
  await check("Logout impide recuperar datos al recargar", async () => {
    await logout();
    await page.reload();
    await page.getByRole("heading", { name: "Bienvenido de vuelta" }).waitFor();
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await check("Docente programa clase y guarda asistencia real", async () => {
    await login("teacher", "docente@sigaa.local");
    await nav("Asistencia");
    await page
      .getByLabel("Fecha de la clase", { exact: true })
      .fill("2026-09-01");
    await page
      .getByLabel("Bloque", { exact: true })
      .fill("Bloque académico QA");
    await page
      .getByLabel("Título de la clase", { exact: true })
      .fill("Clase de integración");
    await page
      .getByLabel("Objetivo", { exact: true })
      .fill("Comprobar persistencia de asistencia");
    await page
      .getByRole("button", { name: "Crear clase", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Guardado en la base" })
      .waitFor();
    await page
      .getByLabel("Clase", { exact: true })
      .selectOption({
        label:
          "2026-09-01 · Bloque académico QA · Clase de integración · Programada",
      });
    await page
      .getByLabel("Camila Soto", { exact: true })
      .selectOption("present");
    await page
      .getByRole("button", { name: "Guardar asistencia", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Guardado en la base" })
      .waitFor();
    assert.equal(
      (await pool.query("SELECT estado FROM asistencia")).rows[0].estado,
      "presente",
    );
    await page.screenshot({
      path: fileURLToPath(new URL("05-asistencia-real.png", output)),
      fullPage: true,
    });
  });
  await check(
    "Docente guarda borrador, publica y corrige notas con motivo",
    async () => {
      await nav("Notas");
      await page
        .getByLabel("Nombre de la evaluación", { exact: true })
        .fill("Control académico QA");
      await page
        .getByLabel("Fecha de evaluación", { exact: true })
        .fill("2026-09-01");
      await page.getByLabel("Ponderación (%)", { exact: true }).fill("50");
      await page
        .getByRole("button", { name: "Crear evaluación", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Guardado en la base" })
        .waitFor();
      await page
        .getByLabel("Evaluación", { exact: true })
        .selectOption({ label: "Control académico QA · 50.00% · Borrador" });
      await page.getByLabel("Camila Soto", { exact: true }).fill("6.2");
      await page
        .getByRole("button", { name: "Guardar notas", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Guardado en la base" })
        .waitFor();
      assert.equal(
        (await pool.query("SELECT visible_estudiante FROM calificacion"))
          .rows[0].visible_estudiante,
        false,
      );
      await page
        .getByRole("button", {
          name: "Publicar notas al estudiante",
          exact: true,
        })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Guardado en la base" })
        .waitFor();
      await page.getByLabel("Camila Soto", { exact: true }).fill("6.5");
      await page
        .getByRole("button", { name: "Guardar notas", exact: true })
        .click();
      await page
        .getByRole("alert")
        .filter({ hasText: "Explica el motivo" })
        .waitFor();
      await page
        .getByLabel("Motivo de corrección", { exact: true })
        .fill("Corrección de pauta de la prueba");
      await page
        .getByRole("button", { name: "Guardar notas", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Guardado en la base" })
        .waitFor();
      assert.equal(
        (await pool.query("SELECT valor,version FROM calificacion")).rows[0]
          .valor,
        "6.5",
      );
      await page.screenshot({
        path: fileURLToPath(new URL("06-notas-reales.png", output)),
        fullPage: true,
      });
    },
  );
  await check("Docente registra anotaciones públicas y privadas", async () => {
    await nav("Anotaciones");
    for (const visibility of ["estudiante", "privada"]) {
      await page
        .getByLabel("Estudiante", { exact: true })
        .selectOption({ label: "Camila Soto" });
      await page.getByLabel("Tipo", { exact: true }).selectOption("positiva");
      await page.getByLabel("Categoría", { exact: true }).fill("Participación");
      await page
        .getByLabel("Detalle", { exact: true })
        .fill(
          visibility === "privada"
            ? "Nota privada confidencial QA"
            : "Excelente participación en la clase QA",
        );
      await page
        .getByLabel("Visibilidad", { exact: true })
        .selectOption(visibility);
      await page
        .getByRole("button", { name: "Guardar anotación", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Guardado en la base" })
        .waitFor();
    }
    await logout();
  });
  await check(
    "Estudiante consulta asistencia, notas y anotaciones propias en móvil",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await login("student", "estudiante@sigaa.local");
      await nav("Mi asistencia");
      await page.getByText("Clase de integración", { exact: true }).waitFor();
      await nav("Mis notas");
      await page.getByText("6.5", { exact: true }).waitFor();
      await nav("Mis anotaciones");
      await page
        .getByText("Excelente participación en la clase QA", { exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByText("Nota privada confidencial QA", { exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Guardar anotación", exact: true })
          .count(),
        0,
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      );
      await page.screenshot({
        path: fileURLToPath(new URL("07-anotaciones-estudiante.png", output)),
        fullPage: true,
      });
      await page.reload();
      await page.getByRole("heading", { name: "Mi inicio", exact: true }).waitFor();
      await nav("Mis notas");
      await page.getByText("6.5", { exact: true }).waitFor();
      await logout();
    },
  );
  assert.deepEqual(errors, []);
  report.pageErrors = errors;
  report.result = "pass";
} catch (error) {
  const failedPage = browser?.contexts()[0]?.pages()[0];
  if (failedPage) {
    await failedPage.screenshot({
      path: fileURLToPath(new URL("failure.png", output)),
      fullPage: true,
    });
    await writeFile(
      new URL("failure.txt", output),
      await failedPage.locator("body").innerText(),
    );
  }
  report.result = "fail";
  report.error = error.message;
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(
    new URL("browser-results.json", output),
    JSON.stringify(report, null, 2),
  );
  if (browser) await browser.close();
  for (const proc of [webProcess, apiProcess])
    if (proc && proc.exitCode === null) {
      const exit = once(proc, "exit");
      proc.kill("SIGTERM");
      await exit;
    }
  if (pool) await pool.end();
  await admin.query('DROP DATABASE IF EXISTS "' + database + '"');
  await admin.end();
}

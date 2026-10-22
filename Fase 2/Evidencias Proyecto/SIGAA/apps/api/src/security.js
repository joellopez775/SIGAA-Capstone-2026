import {
  randomBytes,
  scrypt,
  timingSafeEqual,
  createHash,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const parameters = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("hex");
export const csrfFor = (token) =>
  createHmac("sha256", token).update("sigaa-csrf-v1").digest("hex");
export function equal(a, b) {
  const left = Buffer.from(String(a ?? ""));
  const right = Buffer.from(String(b ?? ""));
  return left.length === right.length && timingSafeEqual(left, right);
}
export function validPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 12 &&
    Buffer.byteLength(password) <= 256
  );
}
export async function hashPassword(password) {
  if (!validPassword(password))
    throw new Error("password_must_have_12_to_256_bytes");
  const salt = randomBytes(16).toString("hex");
  const key = await derive(password, salt, 64, parameters);
  return `scrypt$131072$8$1$${salt}$${key.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const parts = String(stored ?? "").split("$");
  const valid =
    parts.length === 6 &&
    parts.slice(0, 4).join("$") === "scrypt$131072$8$1" &&
    /^[a-f0-9]{32}$/.test(parts[4]) &&
    /^[a-f0-9]{128}$/.test(parts[5]);
  // Unknown accounts still perform the same expensive derivation.
  const salt = valid ? parts[4] : "00000000000000000000000000000000";
  const key = await derive(
    String(password ?? "").slice(0, 256),
    salt,
    64,
    parameters,
  );
  return valid && equal(key.toString("hex"), parts[5]);
}
export const roleFor = (codes) =>
  codes.includes("ADMINISTRADOR")
    ? "admin"
    : codes.includes("DIRECCION_UTP")
      ? "leadership"
    : codes.includes("INSPECTORIA")
      ? "inspector"
    : codes.some((c) => ["PROFESOR_JEFE", "PROFESOR_ASIGNATURA"].includes(c))
      ? "teacher"
      : codes.includes("ESTUDIANTE")
        ? "student"
        : "unsupported";
export function sessionCookie(req, name) {
  const pairs = String(req.headers.cookie ?? "")
    .split(";")
    .map((s) => s.trim());
  const token = pairs
    .find((s) => s.startsWith(name + "="))
    ?.slice(name.length + 1);
  return /^[a-f0-9]{64}$/.test(token ?? "") ? token : null;
}

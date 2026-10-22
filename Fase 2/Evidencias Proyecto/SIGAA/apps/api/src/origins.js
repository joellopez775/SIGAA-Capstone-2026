// Explicit origins only: never infer trust from Host or forwarded headers.
export function allowedOrigins(origin, additionalOrigins = "", production = false) {
  if (typeof origin !== "string" || typeof additionalOrigins !== "string")
    throw new Error("Origins must be strings");
  const entries = [origin, ...(additionalOrigins === "" ? [] : additionalOrigins.split(",").map((v) => v.trim()))];
  for (const value of entries) {
    let url;
    try { url = new URL(value); } catch { throw new Error("Invalid application origin"); }
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== value ||
        value.includes('*') || (production && url.protocol !== 'https:'))
      throw new Error("Application origins must be exact HTTP(S) origins; HTTPS required in production");
  }
  return new Set(entries);
}

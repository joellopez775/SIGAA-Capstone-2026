BEGIN;

-- Additive migration: never rerun 003 on an existing school database.
CREATE TABLE IF NOT EXISTS sesion_usuario (
    token_hash TEXT PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expira_en TIMESTAMPTZ NOT NULL,
    ultimo_uso_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revocada_en TIMESTAMPTZ,
    CHECK (expira_en > creada_en)
);
CREATE INDEX IF NOT EXISTS idx_sesion_usuario ON sesion_usuario(usuario_id);
CREATE TABLE IF NOT EXISTS limite_login (
    clave TEXT PRIMARY KEY,
    intentos INTEGER NOT NULL,
    ventana TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_limite_login_ventana ON limite_login(ventana);
ALTER TABLE estudiante ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES usuario(id);
ALTER TABLE estudiante ADD COLUMN IF NOT EXISTS actualizado_por UUID REFERENCES usuario(id);
ALTER TABLE matricula ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES usuario(id);
ALTER TABLE matricula ADD COLUMN IF NOT EXISTS actualizado_por UUID REFERENCES usuario(id);
INSERT INTO app_metadata(key,value) VALUES ('security_schema','1')
ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW();
COMMIT;

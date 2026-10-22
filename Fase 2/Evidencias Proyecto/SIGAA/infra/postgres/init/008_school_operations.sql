BEGIN;
-- Additive, repeatable. Historical/manual alerts retain a null engine key.
ALTER TABLE alerta ADD COLUMN IF NOT EXISTS engine_key TEXT;
ALTER TABLE alerta ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS uq_alerta_engine_key ON alerta(engine_key) WHERE engine_key IS NOT NULL;
ALTER TABLE justificacion_ausencia ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE nivel_educativo ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();
DROP TRIGGER IF EXISTS trg_nivel_educativo_actualizado_en ON nivel_educativo;
CREATE TRIGGER trg_nivel_educativo_actualizado_en BEFORE UPDATE ON nivel_educativo
FOR EACH ROW EXECUTE FUNCTION sigaa_actualizar_marca_tiempo();
INSERT INTO app_metadata(key,value) VALUES ('operations_schema','1'),('schema_version','0.8.0')
ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW();
COMMIT;

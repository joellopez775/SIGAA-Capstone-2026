BEGIN;
-- Additive migration: no existing students, alerts or interventions are replaced.
ALTER TABLE apoderado ADD COLUMN IF NOT EXISTS codigo VARCHAR(40);
ALTER TABLE apoderado ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS uq_apoderado_codigo ON apoderado(codigo) WHERE codigo IS NOT NULL;
ALTER TABLE estudiante_apoderado ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE estudiante_apoderado ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1;
ALTER TABLE estudiante_apoderado ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW();
-- If historical data has several principals, stop for review instead of silently changing it.
CREATE UNIQUE INDEX IF NOT EXISTS uq_apoderado_principal ON estudiante_apoderado(estudiante_id) WHERE activo AND es_principal;
CREATE TABLE IF NOT EXISTS caso_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alerta_id UUID NOT NULL REFERENCES alerta(id),
  motivo VARCHAR(2000) NOT NULL,
  prioridad VARCHAR(20) NOT NULL CHECK (prioridad IN ('media','alta','critica')),
  estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','en_curso','cerrado')),
  responsable_id UUID NOT NULL REFERENCES usuario(id),
  siguiente_accion VARCHAR(1000) NOT NULL,
  fecha_seguimiento DATE NOT NULL,
  resultado VARCHAR(2000),
  creado_por UUID NOT NULL REFERENCES usuario(id),
  actualizado_por UUID NOT NULL REFERENCES usuario(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cerrado_en TIMESTAMPTZ,
  revision INTEGER NOT NULL DEFAULT 1,
  CHECK ((estado='cerrado') = (cerrado_en IS NOT NULL)),
  CHECK (estado<>'cerrado' OR (resultado IS NOT NULL AND length(trim(resultado))>=8))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_caso_alerta_activo ON caso_seguimiento(alerta_id) WHERE estado<>'cerrado';
CREATE INDEX IF NOT EXISTS idx_caso_responsable ON caso_seguimiento(responsable_id,estado,fecha_seguimiento);
CREATE TABLE IF NOT EXISTS caso_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id UUID NOT NULL REFERENCES caso_seguimiento(id),
  usuario_id UUID NOT NULL REFERENCES usuario(id),
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('apertura','actividad','cambio','cierre','reapertura')),
  nota VARCHAR(2000) NOT NULL,
  detalle JSONB NOT NULL DEFAULT '{}',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_caso_actividad ON caso_actividad(caso_id,creado_en,id);
DROP TRIGGER IF EXISTS trg_caso_actividad_inmutable ON caso_actividad;
CREATE TRIGGER trg_caso_actividad_inmutable BEFORE UPDATE OR DELETE ON caso_actividad
FOR EACH ROW EXECUTE FUNCTION sigaa_impedir_cambio_inmutable();
DROP TRIGGER IF EXISTS trg_caso_no_eliminar ON caso_seguimiento;
CREATE TRIGGER trg_caso_no_eliminar BEFORE DELETE ON caso_seguimiento
FOR EACH ROW EXECUTE FUNCTION sigaa_impedir_cambio_inmutable();
INSERT INTO app_metadata(key,value) VALUES ('followup_schema','1'),('schema_version','0.9.0')
ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW();
COMMIT;

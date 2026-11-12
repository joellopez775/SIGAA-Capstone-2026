BEGIN;
CREATE TABLE IF NOT EXISTS notificacion_interna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID NOT NULL REFERENCES usuario(id),
  caso_id UUID NOT NULL REFERENCES caso_seguimiento(id),
  revision_caso INTEGER NOT NULL CHECK (revision_caso>0),
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('apertura','actividad','cambio','cierre','reapertura')),
  actor_id UUID NOT NULL REFERENCES usuario(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  leida_en TIMESTAMPTZ,
  UNIQUE(destinatario_id,caso_id,revision_caso)
);
CREATE INDEX IF NOT EXISTS idx_notificacion_destino ON notificacion_interna(destinatario_id,creado_en DESC,id);
INSERT INTO app_metadata(key,value) VALUES('notifications_schema','1'),('schema_version','0.9.1')
ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW();
COMMIT;

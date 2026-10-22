BEGIN;

-- Modelo estudiante: la información académica existe, pero solo se expone cuando
-- el establecimiento la publica expresamente para el estudiante autenticado.

ALTER TABLE evaluacion
    ADD COLUMN IF NOT EXISTS visible_estudiante BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS publicada_en TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS publicada_por UUID REFERENCES usuario(id);

ALTER TABLE calificacion
    ADD COLUMN IF NOT EXISTS visible_estudiante BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS publicada_en TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS publicada_por UUID REFERENCES usuario(id);

ALTER TABLE sesion_clase
    ADD COLUMN IF NOT EXISTS publicada_en TIMESTAMPTZ;

ALTER TABLE anotacion_estudiante
    DROP CONSTRAINT IF EXISTS anotacion_estudiante_visibilidad_check;

ALTER TABLE anotacion_estudiante
    ADD CONSTRAINT anotacion_estudiante_visibilidad_check
        CHECK (visibilidad IN ('privada', 'equipo_docente', 'apoderado', 'estudiante', 'estudiante_apoderado')),
    ADD COLUMN IF NOT EXISTS publicada_en TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS publicada_por UUID REFERENCES usuario(id);

CREATE TABLE IF NOT EXISTS comunicacion_estudiante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    curso_id UUID REFERENCES curso(id),
    curso_asignatura_id UUID REFERENCES curso_asignatura(id),
    tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('informativa', 'acompanamiento', 'reconocimiento', 'recordatorio')),
    titulo VARCHAR(180) NOT NULL,
    detalle TEXT NOT NULL CHECK (length(trim(detalle)) >= 8),
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'publicada', 'retirada')),
    visible_desde TIMESTAMPTZ,
    visible_hasta TIMESTAMPTZ,
    creada_por UUID NOT NULL REFERENCES usuario(id),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (visible_hasta IS NULL OR visible_desde IS NULL OR visible_hasta >= visible_desde)
);

CREATE INDEX IF NOT EXISTS idx_comunicacion_estudiante_publicada
    ON comunicacion_estudiante (estudiante_id, visible_desde DESC)
    WHERE estado = 'publicada';

DROP TRIGGER IF EXISTS trg_comunicacion_estudiante_actualizado_en ON comunicacion_estudiante;
CREATE TRIGGER trg_comunicacion_estudiante_actualizado_en
    BEFORE UPDATE ON comunicacion_estudiante
    FOR EACH ROW EXECUTE FUNCTION sigaa_actualizar_marca_tiempo();

INSERT INTO app_metadata (key, value)
VALUES
    ('schema_version', '0.5.0'),
    ('schema_profile', 'escolar')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

COMMIT;

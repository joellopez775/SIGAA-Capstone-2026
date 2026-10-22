BEGIN;

-- Modelo docente: separa la identidad del funcionario, conserva asignaciones
-- históricas y agrega soporte para planificación y anotaciones escolares.

CREATE TABLE IF NOT EXISTS funcionario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuario(id),
    run VARCHAR(20) UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(120) NOT NULL DEFAULT '',
    email_institucional CITEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'licencia', 'inactivo')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profesor_jefatura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID NOT NULL REFERENCES curso(id),
    funcionario_id UUID NOT NULL REFERENCES funcionario(id),
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE,
    es_titular BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde),
    UNIQUE (curso_id, funcionario_id, vigente_desde)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_profesor_jefatura_titular_vigente
    ON profesor_jefatura (curso_id)
    WHERE es_titular = TRUE AND vigente_hasta IS NULL;

CREATE TABLE IF NOT EXISTS asignacion_docente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_asignatura_id UUID NOT NULL REFERENCES curso_asignatura(id),
    funcionario_id UUID NOT NULL REFERENCES funcionario(id),
    funcion VARCHAR(20) NOT NULL DEFAULT 'titular'
        CHECK (funcion IN ('titular', 'reemplazo', 'apoyo', 'codocencia')),
    vigente_desde DATE NOT NULL,
    vigente_hasta DATE,
    puede_planificar BOOLEAN NOT NULL DEFAULT TRUE,
    puede_registrar_asistencia BOOLEAN NOT NULL DEFAULT TRUE,
    puede_calificar BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (vigente_hasta IS NULL OR vigente_hasta >= vigente_desde),
    UNIQUE (curso_asignatura_id, funcionario_id, vigente_desde)
);

CREATE INDEX IF NOT EXISTS idx_asignacion_docente_funcionario
    ON asignacion_docente (funcionario_id, vigente_hasta);

ALTER TABLE sesion_clase
    ADD COLUMN IF NOT EXISTS titulo VARCHAR(180),
    ADD COLUMN IF NOT EXISTS objetivo TEXT,
    ADD COLUMN IF NOT EXISTS contenido TEXT,
    ADD COLUMN IF NOT EXISTS hora_inicio TIME,
    ADD COLUMN IF NOT EXISTS hora_fin TIME,
    ADD COLUMN IF NOT EXISTS sala VARCHAR(30),
    ADD COLUMN IF NOT EXISTS creada_por UUID REFERENCES usuario(id),
    ADD COLUMN IF NOT EXISTS publicada BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS anotacion_estudiante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    curso_id UUID NOT NULL REFERENCES curso(id),
    curso_asignatura_id UUID REFERENCES curso_asignatura(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('positiva', 'negativa')),
    categoria VARCHAR(80) NOT NULL,
    detalle TEXT NOT NULL CHECK (length(trim(detalle)) >= 8),
    visibilidad VARCHAR(30) NOT NULL DEFAULT 'equipo_docente'
        CHECK (visibilidad IN ('privada', 'equipo_docente', 'apoderado')),
    registrada_por UUID NOT NULL REFERENCES usuario(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'vigente'
        CHECK (estado IN ('vigente', 'anulada')),
    anulada_por UUID REFERENCES usuario(id),
    motivo_anulacion TEXT,
    anulada_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (estado = 'vigente' AND anulada_por IS NULL AND anulada_en IS NULL) OR
        (estado = 'anulada' AND anulada_por IS NOT NULL AND anulada_en IS NOT NULL AND motivo_anulacion IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_anotacion_estudiante_historial
    ON anotacion_estudiante (estudiante_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_anotacion_curso_tipo
    ON anotacion_estudiante (curso_id, tipo, creado_en DESC)
    WHERE estado = 'vigente';

-- Compatibilidad con las referencias simples introducidas en 0.3.0.
INSERT INTO funcionario (usuario_id, nombres)
SELECT DISTINCT u.id, u.nombre
FROM usuario u
JOIN (
    SELECT profesor_id AS usuario_id FROM curso_asignatura WHERE profesor_id IS NOT NULL
    UNION
    SELECT profesor_jefe_id AS usuario_id FROM curso WHERE profesor_jefe_id IS NOT NULL
) asignados ON asignados.usuario_id = u.id
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO asignacion_docente (
    curso_asignatura_id,
    funcionario_id,
    funcion,
    vigente_desde
)
SELECT ca.id, f.id, 'titular', pe.fecha_inicio
FROM curso_asignatura ca
JOIN funcionario f ON f.usuario_id = ca.profesor_id
JOIN curso c ON c.id = ca.curso_id
JOIN periodo_escolar pe ON pe.id = c.periodo_id
WHERE ca.profesor_id IS NOT NULL
ON CONFLICT (curso_asignatura_id, funcionario_id, vigente_desde) DO NOTHING;

INSERT INTO profesor_jefatura (
    curso_id,
    funcionario_id,
    vigente_desde,
    es_titular
)
SELECT c.id, f.id, pe.fecha_inicio, TRUE
FROM curso c
JOIN funcionario f ON f.usuario_id = c.profesor_jefe_id
JOIN periodo_escolar pe ON pe.id = c.periodo_id
WHERE c.profesor_jefe_id IS NOT NULL
ON CONFLICT (curso_id, funcionario_id, vigente_desde) DO NOTHING;

DROP TRIGGER IF EXISTS trg_funcionario_actualizado_en ON funcionario;
CREATE TRIGGER trg_funcionario_actualizado_en
    BEFORE UPDATE ON funcionario
    FOR EACH ROW EXECUTE FUNCTION sigaa_actualizar_marca_tiempo();

DROP TRIGGER IF EXISTS trg_anotacion_estudiante_actualizado_en ON anotacion_estudiante;
CREATE TRIGGER trg_anotacion_estudiante_actualizado_en
    BEFORE UPDATE ON anotacion_estudiante
    FOR EACH ROW EXECUTE FUNCTION sigaa_actualizar_marca_tiempo();

INSERT INTO app_metadata (key, value)
VALUES
    ('schema_version', '0.4.0'),
    ('schema_profile', 'escolar')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

COMMIT;

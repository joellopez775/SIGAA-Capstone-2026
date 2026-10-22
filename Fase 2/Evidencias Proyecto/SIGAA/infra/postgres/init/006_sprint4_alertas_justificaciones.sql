BEGIN;

ALTER TABLE justificacion_ausencia
    ADD COLUMN IF NOT EXISTS sesion_id UUID REFERENCES sesion_clase(id),
    ADD COLUMN IF NOT EXISTS observacion_revision TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_justificacion_sesion_estudiante
    ON justificacion_ausencia (sesion_id, estudiante_id)
    WHERE sesion_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asistencia_estudiante_estado
    ON asistencia (estudiante_id, estado, actualizado_en DESC);

CREATE INDEX IF NOT EXISTS idx_alerta_bandeja
    ON alerta (estado, severidad, creado_en DESC);

INSERT INTO regla_alerta (codigo, version, nombre, tipo, parametros, activa)
VALUES
    ('ASISTENCIA_MENOR_75', 1, 'Asistencia crítica', 'asistencia', '{"operador":"menor_que","umbral":75,"unidad":"porcentaje"}'::jsonb, TRUE),
    ('PROMEDIO_MENOR_40', 1, 'Promedio bajo aprobación', 'calificacion', '{"operador":"menor_que","umbral":4.0,"escala":"1.0-7.0"}'::jsonb, TRUE),
    ('RIESGO_COMBINADO', 1, 'Riesgo académico combinado', 'combinada', '{"asistencia_menor_que":80,"promedio_menor_que":4.5}'::jsonb, TRUE)
ON CONFLICT (codigo, version) DO UPDATE
SET nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    parametros = EXCLUDED.parametros,
    activa = EXCLUDED.activa;

CREATE OR REPLACE VIEW vista_bandeja_alertas AS
SELECT
    a.id,
    a.estudiante_id,
    e.nombres,
    e.apellidos,
    a.severidad,
    a.estado,
    a.titulo,
    r.codigo AS regla_codigo,
    r.version AS regla_version,
    r.parametros AS regla_parametros,
    a.evidencia,
    a.creado_en,
    a.actualizado_en
FROM alerta a
JOIN estudiante e ON e.id = a.estudiante_id
JOIN regla_alerta r ON r.id = a.regla_id;

COMMIT;

BEGIN;

-- Corrección de dominio: SIGAA está dirigido a colegios y liceos.
-- La migración se detiene si el esquema universitario contiene información
-- operacional para evitar una conversión silenciosa o pérdida de datos.
DO $$
DECLARE
    registros BIGINT;
BEGIN
    SELECT
        (SELECT COUNT(*) FROM usuario) +
        (SELECT COUNT(*) FROM usuario_rol) +
        (SELECT COUNT(*) FROM estudiante) +
        (SELECT COUNT(*) FROM programa_academico) +
        (SELECT COUNT(*) FROM periodo_academico) +
        (SELECT COUNT(*) FROM asignatura) +
        (SELECT COUNT(*) FROM seccion) +
        (SELECT COUNT(*) FROM seccion_docente) +
        (SELECT COUNT(*) FROM matricula) +
        (SELECT COUNT(*) FROM evaluacion) +
        (SELECT COUNT(*) FROM calificacion) +
        (SELECT COUNT(*) FROM sesion_clase) +
        (SELECT COUNT(*) FROM asistencia) +
        (SELECT COUNT(*) FROM regla_alerta) +
        (SELECT COUNT(*) FROM alerta) +
        (SELECT COUNT(*) FROM intervencion) +
        (SELECT COUNT(*) FROM evento_auditoria)
    INTO registros;

    IF registros > 0 THEN
        RAISE EXCEPTION
            'Migración escolar cancelada: existen % registros operacionales. Respalde y defina una conversión de datos antes de continuar.',
            registros;
    END IF;
END;
$$;

DROP TABLE evento_auditoria;
DROP TABLE intervencion;
DROP TABLE alerta;
DROP TABLE regla_alerta;
DROP TABLE asistencia;
DROP TABLE sesion_clase;
DROP TABLE calificacion;
DROP TABLE evaluacion;
DROP TABLE matricula;
DROP TABLE seccion_docente;
DROP TABLE seccion;
DROP TABLE estudiante;
DROP TABLE asignatura;
DROP TABLE periodo_academico;
DROP TABLE programa_academico;

CREATE TABLE establecimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rbd VARCHAR(20) UNIQUE,
    nombre VARCHAR(180) NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('colegio', 'liceo')),
    dependencia VARCHAR(30) CHECK (
        dependencia IS NULL OR
        dependencia IN ('municipal', 'sle', 'particular_subvencionado', 'particular_pagado', 'administracion_delegada')
    ),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE periodo_escolar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establecimiento_id UUID NOT NULL REFERENCES establecimiento(id),
    anio SMALLINT NOT NULL CHECK (anio BETWEEN 2000 AND 2200),
    nombre VARCHAR(120) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'planificado'
        CHECK (estado IN ('planificado', 'activo', 'cerrado')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (establecimiento_id, anio),
    CHECK (fecha_inicio < fecha_fin)
);

CREATE TABLE nivel_educativo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    ciclo VARCHAR(30) NOT NULL CHECK (ciclo IN ('parvularia', 'basica', 'media', 'especial', 'adultos')),
    orden SMALLINT NOT NULL CHECK (orden > 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE asignatura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'inactiva')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE curso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id UUID NOT NULL REFERENCES periodo_escolar(id),
    nivel_id UUID NOT NULL REFERENCES nivel_educativo(id),
    letra VARCHAR(5) NOT NULL,
    jornada VARCHAR(20) CHECK (jornada IS NULL OR jornada IN ('manana', 'tarde', 'vespertina', 'completa')),
    sala VARCHAR(30),
    profesor_jefe_id UUID REFERENCES usuario(id),
    capacidad SMALLINT CHECK (capacidad IS NULL OR capacidad > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'planificado'
        CHECK (estado IN ('planificado', 'activo', 'cerrado', 'cancelado')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (periodo_id, nivel_id, letra)
);

CREATE TABLE estudiante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE REFERENCES usuario(id),
    run VARCHAR(20) UNIQUE,
    identificador_interno VARCHAR(40) NOT NULL UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(120) NOT NULL,
    fecha_nacimiento DATE,
    email_institucional CITEXT UNIQUE,
    estado VARCHAR(20) NOT NULL DEFAULT 'regular'
        CHECK (estado IN ('regular', 'suspendido', 'retirado', 'egresado')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE apoderado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE REFERENCES usuario(id),
    run VARCHAR(20) UNIQUE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(120) NOT NULL,
    email CITEXT,
    telefono VARCHAR(30),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE estudiante_apoderado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    apoderado_id UUID NOT NULL REFERENCES apoderado(id),
    parentesco VARCHAR(40),
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    recibe_notificaciones BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (estudiante_id, apoderado_id)
);

CREATE TABLE matricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    curso_id UUID NOT NULL REFERENCES curso(id),
    numero_matricula VARCHAR(40),
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'retirada', 'finalizada', 'anulada')),
    matriculado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalizado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_matricula_curso_activa
    ON matricula (estudiante_id, curso_id)
    WHERE estado = 'activa';

CREATE TABLE curso_asignatura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_id UUID NOT NULL REFERENCES curso(id),
    asignatura_id UUID NOT NULL REFERENCES asignatura(id),
    profesor_id UUID REFERENCES usuario(id),
    horas_semanales NUMERIC(3,1) CHECK (horas_semanales IS NULL OR horas_semanales > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'planificada'
        CHECK (estado IN ('planificada', 'activa', 'cerrada', 'cancelada')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (curso_id, asignatura_id)
);

CREATE TABLE evaluacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_asignatura_id UUID NOT NULL REFERENCES curso_asignatura(id),
    nombre VARCHAR(160) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    ponderacion NUMERIC(5,2) NOT NULL CHECK (ponderacion > 0 AND ponderacion <= 100),
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'publicada', 'cerrada', 'anulada')),
    creada_por UUID NOT NULL REFERENCES usuario(id),
    cerrada_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (curso_asignatura_id, nombre)
);

CREATE TABLE calificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluacion_id UUID NOT NULL REFERENCES evaluacion(id),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    valor NUMERIC(3,1) NOT NULL CHECK (valor BETWEEN 1.0 AND 7.0),
    registrada_por UUID NOT NULL REFERENCES usuario(id),
    motivo_correccion TEXT,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (evaluacion_id, estudiante_id)
);

CREATE TABLE sesion_clase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curso_asignatura_id UUID NOT NULL REFERENCES curso_asignatura(id),
    fecha DATE NOT NULL,
    bloque VARCHAR(40) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada'
        CHECK (estado IN ('programada', 'realizada', 'cancelada')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (curso_asignatura_id, fecha, bloque)
);

CREATE TABLE asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID NOT NULL REFERENCES sesion_clase(id),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    estado VARCHAR(20) NOT NULL
        CHECK (estado IN ('presente', 'ausente', 'atraso', 'justificada', 'pendiente')),
    observacion TEXT,
    registrada_por UUID NOT NULL REFERENCES usuario(id),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (sesion_id, estudiante_id)
);

CREATE TABLE justificacion_ausencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,
    motivo TEXT NOT NULL,
    documento_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    registrada_por UUID NOT NULL REFERENCES usuario(id),
    revisada_por UUID REFERENCES usuario(id),
    revisada_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (fecha_hasta >= fecha_desde)
);

CREATE TABLE regla_alerta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) NOT NULL,
    version INTEGER NOT NULL CHECK (version > 0),
    nombre VARCHAR(160) NOT NULL,
    tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('calificacion', 'asistencia', 'convivencia', 'tendencia', 'combinada')),
    parametros JSONB NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creada_por UUID REFERENCES usuario(id),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (codigo, version)
);

CREATE TABLE alerta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    curso_id UUID REFERENCES curso(id),
    curso_asignatura_id UUID REFERENCES curso_asignatura(id),
    regla_id UUID NOT NULL REFERENCES regla_alerta(id),
    responsable_id UUID REFERENCES usuario(id),
    severidad VARCHAR(20) NOT NULL
        CHECK (severidad IN ('informativa', 'media', 'alta', 'critica')),
    estado VARCHAR(30) NOT NULL DEFAULT 'abierta'
        CHECK (estado IN ('abierta', 'asignada', 'en_seguimiento', 'resuelta', 'descartada')),
    titulo VARCHAR(180) NOT NULL,
    evidencia JSONB NOT NULL,
    vence_en TIMESTAMPTZ,
    resuelta_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE intervencion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alerta_id UUID NOT NULL REFERENCES alerta(id),
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    tipo VARCHAR(40) NOT NULL CHECK (
        tipo IN ('entrevista_estudiante', 'contacto_apoderado', 'reforzamiento', 'derivacion', 'inspectoria', 'observacion', 'otro')
    ),
    nota TEXT NOT NULL,
    fecha_seguimiento DATE,
    resultado VARCHAR(30)
        CHECK (resultado IS NULL OR resultado IN ('pendiente', 'mejora', 'sin_cambio', 'escalada', 'cerrada')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evento_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuario(id),
    accion VARCHAR(80) NOT NULL,
    entidad VARCHAR(80) NOT NULL,
    entidad_id UUID,
    valor_anterior JSONB,
    valor_nuevo JSONB,
    motivo TEXT,
    correlacion_id UUID,
    origen VARCHAR(40) NOT NULL DEFAULT 'aplicacion',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
DECLARE
    tabla TEXT;
BEGIN
    FOREACH tabla IN ARRAY ARRAY[
        'establecimiento', 'periodo_escolar', 'asignatura', 'curso', 'estudiante',
        'apoderado', 'matricula', 'curso_asignatura', 'evaluacion', 'calificacion',
        'sesion_clase', 'asistencia', 'alerta'
    ]
    LOOP
        EXECUTE format('CREATE TRIGGER trg_%I_actualizado_en BEFORE UPDATE ON %I '
            'FOR EACH ROW EXECUTE FUNCTION sigaa_actualizar_marca_tiempo()', tabla, tabla);
    END LOOP;
END;
$$;

CREATE TRIGGER trg_evento_auditoria_inmutable
    BEFORE UPDATE OR DELETE ON evento_auditoria
    FOR EACH ROW EXECUTE FUNCTION sigaa_impedir_cambio_inmutable();

CREATE TRIGGER trg_intervencion_no_eliminar
    BEFORE DELETE ON intervencion
    FOR EACH ROW EXECUTE FUNCTION sigaa_impedir_cambio_inmutable();

CREATE INDEX idx_curso_periodo ON curso (periodo_id, estado);
CREATE INDEX idx_matricula_curso ON matricula (curso_id, estado);
CREATE INDEX idx_curso_asignatura_profesor ON curso_asignatura (profesor_id, estado);
CREATE INDEX idx_calificacion_estudiante ON calificacion (estudiante_id, evaluacion_id);
CREATE INDEX idx_asistencia_estudiante ON asistencia (estudiante_id, sesion_id);
CREATE INDEX idx_justificacion_estudiante ON justificacion_ausencia (estudiante_id, fecha_desde DESC);
CREATE INDEX idx_alerta_bandeja ON alerta (estado, severidad, creado_en DESC);
CREATE INDEX idx_alerta_estudiante ON alerta (estudiante_id, curso_id, creado_en DESC);
CREATE INDEX idx_intervencion_alerta ON intervencion (alerta_id, creado_en DESC);
CREATE INDEX idx_auditoria_entidad ON evento_auditoria (entidad, entidad_id, creado_en DESC);

DELETE FROM rol;

INSERT INTO rol (codigo, nombre, descripcion)
VALUES
    ('ADMINISTRADOR', 'Administrador', 'Configura usuarios, establecimiento, estructura escolar y reglas.'),
    ('DIRECCION_UTP', 'Dirección / UTP', 'Supervisa indicadores, alertas y gestión técnico-pedagógica.'),
    ('PROFESOR_JEFE', 'Profesor jefe', 'Realiza seguimiento integral de su curso y gestiona intervenciones.'),
    ('PROFESOR_ASIGNATURA', 'Profesor de asignatura', 'Gestiona notas y asistencia de las asignaturas que imparte.'),
    ('INSPECTORIA', 'Inspectoría', 'Gestiona asistencia, atrasos y justificaciones autorizadas.'),
    ('ESTUDIANTE', 'Estudiante', 'Consulta exclusivamente su información escolar.'),
    ('APODERADO', 'Apoderado', 'Consulta información de estudiantes bajo su responsabilidad.')
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

INSERT INTO app_metadata (key, value)
VALUES
    ('schema_version', '0.3.0'),
    ('schema_profile', 'escolar')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

COMMIT;

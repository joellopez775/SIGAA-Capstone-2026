BEGIN;

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS programa_academico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'inactivo')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS periodo_academico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'planificado'
        CHECK (estado IN ('planificado', 'activo', 'cerrado')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (fecha_inicio < fecha_fin)
);

CREATE TABLE IF NOT EXISTS asignatura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    creditos SMALLINT NOT NULL DEFAULT 0 CHECK (creditos >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'inactiva')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    password_hash TEXT,
    proveedor_identidad VARCHAR(60),
    identidad_externa TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo'
        CHECK (estado IN ('activo', 'bloqueado', 'inactivo')),
    ultimo_acceso_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (proveedor_identidad, identidad_externa)
);

CREATE TABLE IF NOT EXISTS rol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuario_rol (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    rol_id UUID NOT NULL REFERENCES rol(id),
    alcance JSONB NOT NULL DEFAULT '{}'::JSONB,
    vigente_desde TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vigente_hasta TIMESTAMPTZ,
    asignado_por UUID REFERENCES usuario(id),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (vigente_hasta IS NULL OR vigente_hasta > vigente_desde)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_rol_vigente
    ON usuario_rol (usuario_id, rol_id, alcance)
    WHERE vigente_hasta IS NULL;

CREATE TABLE IF NOT EXISTS estudiante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID UNIQUE REFERENCES usuario(id),
    programa_id UUID REFERENCES programa_academico(id),
    identificador_interno VARCHAR(40) NOT NULL UNIQUE,
    nombre VARCHAR(160) NOT NULL,
    email_institucional CITEXT UNIQUE,
    cohorte SMALLINT CHECK (cohorte BETWEEN 2000 AND 2200),
    estado VARCHAR(20) NOT NULL DEFAULT 'regular'
        CHECK (estado IN ('regular', 'suspendido', 'retirado', 'egresado')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seccion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id UUID NOT NULL REFERENCES periodo_academico(id),
    asignatura_id UUID NOT NULL REFERENCES asignatura(id),
    programa_id UUID REFERENCES programa_academico(id),
    codigo VARCHAR(40) NOT NULL,
    cupo SMALLINT CHECK (cupo IS NULL OR cupo > 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'planificada'
        CHECK (estado IN ('planificada', 'activa', 'cerrada', 'cancelada')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (periodo_id, asignatura_id, codigo)
);

CREATE TABLE IF NOT EXISTS seccion_docente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seccion_id UUID NOT NULL REFERENCES seccion(id),
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    vigente_desde DATE,
    vigente_hasta DATE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (seccion_id, usuario_id),
    CHECK (vigente_hasta IS NULL OR vigente_desde IS NULL OR vigente_hasta >= vigente_desde)
);

CREATE TABLE IF NOT EXISTS matricula (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    seccion_id UUID NOT NULL REFERENCES seccion(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'activa'
        CHECK (estado IN ('activa', 'retirada', 'finalizada', 'anulada')),
    matriculado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalizado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_matricula_activa
    ON matricula (estudiante_id, seccion_id)
    WHERE estado = 'activa';

CREATE TABLE IF NOT EXISTS evaluacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seccion_id UUID NOT NULL REFERENCES seccion(id),
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
    UNIQUE (seccion_id, nombre)
);

CREATE TABLE IF NOT EXISTS calificacion (
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

CREATE TABLE IF NOT EXISTS sesion_clase (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seccion_id UUID NOT NULL REFERENCES seccion(id),
    fecha DATE NOT NULL,
    bloque VARCHAR(40) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'programada'
        CHECK (estado IN ('programada', 'realizada', 'cancelada')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (seccion_id, fecha, bloque)
);

CREATE TABLE IF NOT EXISTS asistencia (
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

CREATE TABLE IF NOT EXISTS regla_alerta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(60) NOT NULL,
    version INTEGER NOT NULL CHECK (version > 0),
    nombre VARCHAR(160) NOT NULL,
    tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('calificacion', 'asistencia', 'tendencia', 'combinada')),
    parametros JSONB NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creada_por UUID REFERENCES usuario(id),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (codigo, version)
);

CREATE TABLE IF NOT EXISTS alerta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    estudiante_id UUID NOT NULL REFERENCES estudiante(id),
    seccion_id UUID REFERENCES seccion(id),
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

CREATE TABLE IF NOT EXISTS intervencion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alerta_id UUID NOT NULL REFERENCES alerta(id),
    usuario_id UUID NOT NULL REFERENCES usuario(id),
    tipo VARCHAR(40) NOT NULL
        CHECK (tipo IN ('entrevista', 'contacto', 'reforzamiento', 'derivacion', 'observacion', 'otro')),
    nota TEXT NOT NULL,
    fecha_seguimiento DATE,
    resultado VARCHAR(30)
        CHECK (resultado IS NULL OR resultado IN ('pendiente', 'mejora', 'sin_cambio', 'escalada', 'cerrada')),
    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evento_auditoria (
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

CREATE OR REPLACE FUNCTION sigaa_actualizar_marca_tiempo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    tabla TEXT;
BEGIN
    FOREACH tabla IN ARRAY ARRAY[
        'programa_academico', 'periodo_academico', 'asignatura', 'usuario',
        'estudiante', 'seccion', 'matricula', 'evaluacion', 'calificacion',
        'sesion_clase', 'asistencia', 'alerta'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_actualizado_en ON %I', tabla, tabla);
        EXECUTE format(
            'CREATE TRIGGER trg_%I_actualizado_en BEFORE UPDATE ON %I '
            'FOR EACH ROW EXECUTE FUNCTION sigaa_actualizar_marca_tiempo()',
            tabla,
            tabla
        );
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION sigaa_impedir_cambio_inmutable()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'La tabla % es inmutable; registre un nuevo evento', TG_TABLE_NAME;
END;
$$;

DROP TRIGGER IF EXISTS trg_evento_auditoria_inmutable ON evento_auditoria;
CREATE TRIGGER trg_evento_auditoria_inmutable
    BEFORE UPDATE OR DELETE ON evento_auditoria
    FOR EACH ROW EXECUTE FUNCTION sigaa_impedir_cambio_inmutable();

DROP TRIGGER IF EXISTS trg_intervencion_no_eliminar ON intervencion;
CREATE TRIGGER trg_intervencion_no_eliminar
    BEFORE DELETE ON intervencion
    FOR EACH ROW EXECUTE FUNCTION sigaa_impedir_cambio_inmutable();

CREATE INDEX IF NOT EXISTS idx_seccion_periodo
    ON seccion (periodo_id, estado);
CREATE INDEX IF NOT EXISTS idx_matricula_seccion
    ON matricula (seccion_id, estado);
CREATE INDEX IF NOT EXISTS idx_calificacion_estudiante
    ON calificacion (estudiante_id, evaluacion_id);
CREATE INDEX IF NOT EXISTS idx_asistencia_estudiante
    ON asistencia (estudiante_id, sesion_id);
CREATE INDEX IF NOT EXISTS idx_alerta_bandeja
    ON alerta (estado, severidad, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_alerta_estudiante
    ON alerta (estudiante_id, seccion_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_intervencion_alerta
    ON intervencion (alerta_id, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad
    ON evento_auditoria (entidad, entidad_id, creado_en DESC);

INSERT INTO rol (codigo, nombre, descripcion)
VALUES
    ('ADMINISTRADOR', 'Administrador', 'Configura usuarios, estructura académica y reglas.'),
    ('DIRECCION_ACADEMICA', 'Dirección Académica', 'Supervisa indicadores, alertas y gestión institucional.'),
    ('COORDINADOR', 'Coordinador o jefe de carrera', 'Realiza seguimiento integral dentro de su alcance.'),
    ('DOCENTE', 'Docente', 'Gestiona sus secciones, evaluaciones y calificaciones.'),
    ('REGISTRO_ACADEMICO', 'Registro Académico', 'Gestiona asistencia y antecedentes académicos autorizados.'),
    ('ESTUDIANTE', 'Estudiante', 'Consulta exclusivamente su propia información.')
ON CONFLICT (codigo) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion;

INSERT INTO app_metadata (key, value)
VALUES
    ('schema_version', '0.2.0'),
    ('schema_profile', 'universitario')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();

COMMIT;

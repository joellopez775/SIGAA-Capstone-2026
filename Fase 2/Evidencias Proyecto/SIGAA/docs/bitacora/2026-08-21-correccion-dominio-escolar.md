# Bitácora — Corrección integral al dominio escolar

Fecha: 21 de agosto de 2026

Historia: PB-035

Decisión: confirmada por el Product Owner

## Contexto

El prototipo y la primera versión del esquema físico se construyeron bajo el
supuesto incorrecto de que SIGAA estaba orientado a educación superior. El
Product Owner aclaró que el sistema se utilizará en liceos o colegios. Los
flujos operativos revisados también describen Dirección/UTP, profesor jefe,
profesor de asignatura e Inspectoría, lo que ratifica el dominio escolar.

## Impacto identificado

- Base de datos 0.2.0: carreras, créditos, cohortes, secciones y matrícula por asignatura.
- Interfaz: comunidad universitaria, campus, carrera, semestre y créditos.
- Datos demo: asignaturas de educación superior y secciones con códigos de carrera.
- Documentación: modelo ER, arquitectura, casos de uso y prototipo.
- Roles: Dirección Académica, coordinación de carrera y Registro Académico.

## Decisiones adoptadas

1. Mantener 0.2.0 como evidencia histórica y aplicar una migración correctiva 0.3.0.
2. Usar establecimiento, periodo escolar, nivel, curso y curso-asignatura.
3. Matricular al estudiante en un curso para un año escolar, no en cada asignatura.
4. Incorporar apoderados y justificaciones de ausencia desde el modelo base.
5. Separar profesor jefe de profesor de asignatura y autorizar siempre en backend.
6. Conservar alertas explicables, intervenciones y auditoría inmutable.
7. Mantener exclusivamente datos sintéticos durante el prototipo.

## Controles de seguridad de la migración

Antes de diseñar la conversión se consultó el servidor y se verificó:

- Usuarios: 0.
- Estudiantes: 0.
- Matrículas: 0.
- Calificaciones: 0.
- Asistencias: 0.
- Roles de demostración: 6.

La migración `003_school_domain.sql` suma todos los registros operacionales y
aborta si encuentra alguno. De esta manera no elimina silenciosamente datos de
una instalación que haya comenzado a operar. El procedimiento de despliegue
incluye además un `pg_dump` previo.

## Resultado técnico

- Perfil de esquema: `escolar`.
- Versión: `0.3.0`.
- Tablas públicas esperadas: 23.
- Roles: Administrador, Dirección/UTP, Profesor jefe, Profesor de asignatura,
  Inspectoría, Estudiante y Apoderado.
- Secuencia 001 → 002 → 003 validada en una base PostgreSQL temporal limpia.
- Datos del prototipo adaptados a un liceo ficticio y cursos de segundo medio.
- Login y vistas docente/estudiante conservan el diseño premium y responsivo.

## Trabajo pendiente después de esta corrección

- Implementar autenticación productiva y RBAC en la API.
- Conectar los casos de uso a PostgreSQL; hoy los datos visibles son sintéticos.
- Construir vistas específicas para UTP, Inspectoría, profesor de asignatura y apoderado.
- Validar reglas, escala, asistencia y permisos con una contraparte real.

## Despliegue verificado

La corrección se publicó en la rama `fase-1-evidencias` y se desplegó en el
servidor macOS del proyecto. Antes de migrar se generó el respaldo:

`~/Services/sigaa-backups/pre-schema-0.3.0-school-20260821.sql`

La reconstrucción remota se ejecutó con una configuración Docker no interactiva
independiente del llavero del usuario. La verificación posterior confirmó:

- Commit de aplicación: `b8c8b07`.
- Tres contenedores saludables: web, API y PostgreSQL.
- Healthcheck API y conexión a base de datos con respuesta `ok`.
- Perfil `escolar`, versión `0.3.0`, 23 tablas y 7 roles.
- Respuesta del prototipo con el establecimiento ficticio configurado.
- Pantalla de acceso escolar comprobada desde `http://servidor-privado:8088/`.

## Evidencias

- `infra/postgres/init/003_school_domain.sql`.
- `docs/design/02-modelo-er-diccionario.md`.
- `docs/design/03-uml-casos-de-uso.md`.
- `docs/design/04-prototipo-navegable.md`.
- `apps/api/src/prototype-data.js`.
- `apps/web/src/App.jsx`.

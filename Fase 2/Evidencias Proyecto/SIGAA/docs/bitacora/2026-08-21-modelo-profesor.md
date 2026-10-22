# Bitácora — Modelo del profesor

Fecha: 21 de agosto de 2026

Historia: PB-038

## Solicitud del Product Owner

Modelar un profesor con uno o varios cursos asignados y permitirle pasar
asistencia, agregar clases futuras, poner notas y registrar anotaciones positivas
o negativas.

## Incremento realizado

- Tres asignaciones docentes sintéticas en dos cursos.
- Selector de curso y asignatura en todos los módulos operacionales.
- Planificación de clases con fecha, hora, bloque, título y objetivo.
- Registro de presente, ausente, atraso o justificación por estudiante.
- Creación de evaluaciones e ingreso de calificaciones entre 1,0 y 7,0.
- Anotaciones positivas o negativas con categoría, detalle, autor y fecha.
- Validación de rol, asignación y pertenencia del estudiante en la API.
- Migración escolar `0.4.0` para funcionario, jefatura, asignación y anotación.

## Verificación

- 13 pruebas de API aprobadas.
- Compilación web de producción aprobada.
- Secuencia de migraciones 001 → 004 validada en PostgreSQL limpio.
- 27 tablas y perfil de esquema `escolar` en la base de prueba.
- Flujos de cursos, planificación, asistencia, notas y anotaciones recorridos en navegador.

## Límite conocido

Los cambios realizados desde la interfaz se almacenan temporalmente en la API
de demostración y se pierden al reiniciar el contenedor. La persistencia real y
la autenticación productiva se implementarán en los siguientes incrementos.

## Despliegue

El incremento fue publicado en el commit `874757e` y desplegado en el servidor
macOS del proyecto. Antes de aplicar la migración se creó el respaldo:

`~/Services/sigaa-backups/pre-schema-0.4.0-teacher-20260821.sql`

La verificación posterior confirmó:

- Esquema `0.4.0`, perfil `escolar` y 27 tablas públicas.
- Web, API y PostgreSQL saludables.
- Endpoint docente autorizado disponible.
- Espacio `Mis cursos` visible desde `http://servidor-privado:8088/`.
- Repositorio del servidor sin modificaciones locales.

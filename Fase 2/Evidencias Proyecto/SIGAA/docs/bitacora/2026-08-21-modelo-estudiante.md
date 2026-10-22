# Bitácora — Modelo del estudiante

Fecha: 21 de agosto de 2026. Historia: PB-039.

## Solicitud del Product Owner

Avanzar con el modelo estudiante usando la misma metodología aplicada al profesor.

## Incremento realizado

- Cinco vistas estudiantiles navegables y responsivas.
- Consulta de asignaturas, notas publicadas, asistencia y agenda personal.
- Anotaciones visibles y mensajes de acompañamiento sin exponer alertas internas.
- Endpoint de solo lectura protegido por rol e identidad del estudiante.
- Migración `0.5.0` con controles de publicación y comunicaciones estudiantiles.

## Verificación previa a publicación

- 15 pruebas de API aprobadas, incluidas ausencia de rol y acceso cruzado.
- Compilación web de producción aprobada.
- Compose validado y servicios locales saludables.
- Esquema local actualizado a `0.5.0`, perfil `escolar`, con 28 tablas públicas.
- Recorrido en navegador aprobado para inicio, asignaturas, asistencia, calendario
  y anotaciones.

## Límite conocido

Los datos son sintéticos. La sesión mediante encabezados y la lectura desde
memoria son mecanismos de demostración, no controles productivos.

## Publicación y despliegue

El incremento fue publicado en el commit `73000c7` y desplegado en el Mac
servidor del proyecto. Antes de migrar se creó el respaldo:

`~/Services/sigaa-backups/pre-schema-0.5.0-student-20260821.sql`

La verificación posterior confirmó esquema `0.5.0`, 28 tablas públicas, web,
API y PostgreSQL saludables, acceso autorizado para `est-001`, rechazo `403`
ante acceso cruzado y repositorio del servidor sin modificaciones locales.

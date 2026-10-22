# Arquitectura de base de datos - SIGAA

Corte posterior a la implementación: 15 de octubre de 2026. Base técnica: a9b6f65, API 0.8.0. Jira actualizado sobre las incidencias existentes. Evidencia técnica para revisión del Product Owner; no acredita reuniones ni aceptación.

## Modelo vigente y alcance

PostgreSQL 16, dominio escolar. Las migraciones versionadas 001 a 008 incluyen estructura escolar, modelos docente/estudiante, preparación de alertas/justificaciones y seguridad. La migración 007 agrega sesiones e intentos de login y autoría en estudiantes/matrículas. La migración 008 agrega clave única del motor, revisiones de concurrencia y marca temporal de niveles; no borra registros. La API informa versión 0.8.0; este número no sustituye la secuencia de migraciones.

:::diagram data

## Diccionario operativo resumido

| Entidad | Datos esenciales | Integridad y uso |
|---|---|---|
| usuario, rol, usuario_rol | email, hash, estado, rol y vigencia | Identidad y permisos determinados por servidor |
| sesion_usuario | token_hash, usuario_id, fechas, revocada_en | Hash como clave; FK a usuario; expiración posterior a creación |
| limite_login | clave, intentos, ventana | Control persistente de intentos, clave derivada no identificador abierto |
| establecimiento, periodo_escolar, nivel_educativo | RBD, año, fechas, nivel | Contexto escolar, unicidad y fechas válidas |
| curso, asignatura, curso_asignatura | periodo, nivel, letra, asignatura | Oferta escolar y relaciones válidas |
| funcionario, asignacion_docente | usuario, asignatura, vigencia, capacidades | Define alcance de profesor titular y apoyo |
| estudiante | identificador, nombres, estado, usuario | Duplicados rechazados; creación/cambio con actor |
| matricula | estudiante, curso, estado, cierre | API impide activa duplicada en el mismo periodo y valida capacidad |
| sesion_clase, asistencia | asignatura, fecha, bloque, estudiante, estado | Un registro por clase/estudiante; no asistencia futura |
| evaluacion, calificacion | asignatura, fecha, peso, estudiante, nota, publicación | Nota 1-7; suma de pesos controlada en transacción; privacidad |
| anotacion_estudiante | estudiante, autor, tipo, detalle, visibilidad | Privada por defecto; anulación por autor con motivo y auditoría |
| evento_auditoria | actor, acción, entidad, antes/después, fecha | Historial generado por API, no editable por usuario común |
| justificacion_ausencia | estudiante, sesion_id, motivo, revisión | Registro/revisión persistentes; aprobación y asistencia en una transacción |
| regla_alerta, alerta | versiones, umbrales, evidencia, responsable y revisión | Motor persistente; clave única por estudiante/curso/código; historial auditado |
| intervencion | estudiante, caso y seguimiento | Casos/intervenciones de Sprint 5 aún pendientes |

El SQL versionado es la referencia exacta de tipos, claves e índices. Este resumen no reemplaza los scripts ni presenta el modelo objetivo como completamente operativo.

## Consistencia de datos

Transacciones y revisiones evitan sobrescrituras. Las notas permanecen privadas hasta publicarse y sus correcciones exigen motivo. El estudiante solo consulta. Bajas y correcciones conservan historial.

## Despliegue y evolución

Volumen persistente y red privada; API con privilegios limitados. 008 es aditiva. No ejecutar 003 ni seeds sobre la base operativa.

Tests sintéticos en bases separadas; respaldo previo verificado por inventario. Respaldo periódico y restauración recurrente pendientes.

## Verificación y evidencia

48 pruebas API en Docker/PostgreSQL 16 verifican integridad, permisos, concurrencia y persistencia. Evidencia: operations-docker-tests.json y recorridos operations-*. Aceptación del PO pendiente.

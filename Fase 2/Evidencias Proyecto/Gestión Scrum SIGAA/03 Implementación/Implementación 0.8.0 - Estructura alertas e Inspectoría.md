# Implementación 0.8.0 - Estructura, alertas e Inspectoría

SIGAA para colegios y liceos. Entrega técnica del 15 de octubre de 2026. Product Owner: Joel López. Código: a9b6f65. Este informe registra desarrollo y pruebas, no una reunión ni aprobación.

## 1. Resultado y alcance

Las brechas técnicas detectadas en las historias de Sprints 2 y 4 están implementadas en la aplicación segura y desplegadas en el Mac servidor. El incremento anterior de Sprint 3 conserva autenticación, permisos, estudiantes, matrícula, asistencia, notas y anotaciones persistentes. La aceptación de las historias sigue pendiente.

| Historia | Resultado implementado | Evidencia verificable |
|---|---|---|
| PB-013 / SCRUM-25 | Crear y editar establecimiento, año escolar, nivel, curso, asignatura y asignación docente | structure-routes.js, interfaz Estructura escolar, pruebas de relaciones, duplicados y concurrencia |
| PB-014 / SCRUM-26 | Instalación Docker nueva reproducida | PostgreSQL 16, API y web saludables; /api/health 0.8.0 |
| PB-020 / SCRUM-32 | Tres reglas configurables, versionadas y persistentes | risk-engine.js; pruebas sin datos, deduplicación, cambio de versión y reapertura |
| PB-021 / SCRUM-33 | Bandeja y contadores; cuatro filtros; responsable, estado e historial | support-routes.js y formularios probados en navegador |
| PB-037 / SCRUM-49 | Registrar, aceptar o rechazar justificaciones | Asistencia y alertas actualizadas atómicamente; rechazo de revisión simultánea y protección del respaldo |

El alcance de Sprint 5 (casos, ficha integral y notificaciones) no se declara terminado. Tampoco se confunden la implementación de un componente, la aceptación de una historia y la entrega académica en Campus.

## 2. Guía de demostración por rol

### Administración

1. Ingresar con la cuenta administrativa. Abrir Estructura escolar.
2. Configurar establecimiento, año escolar y niveles. Después crear asignaturas, cursos y sus asignaciones docentes. Debe existir una cuenta de docente habilitada para asignarla.
3. Usar Editar para corregir datos. Las relaciones principales no se cambian al editar: se conserva el historial. Para retirar registros se cambia su estado; no hay eliminación destructiva.
4. No reducir capacidad por debajo de la matrícula ni cerrar padres con dependencias activas. El formulario muestra errores y conserva los datos ingresados.
5. En Alertas y seguimiento, abrir una regla, ajustar umbral, indicar motivo y guardar una nueva versión. Las versiones anteriores permanecen en la base.

:::pagebreak

### Docente

1. Usar las pantallas Asistencia, Notas y Anotaciones de los cursos asignados. Las notas y anotaciones privadas no se publican al estudiante por defecto.
2. Después de registrar o corregir asistencia/notas publicadas, abrir Alertas y seguimiento y pulsar Recalcular alertas. No hay un proceso automático periódico implementado.
3. Revisar causa, valores y umbral. Filtrar por prioridad, curso, estado o responsable.
4. Gestionar una alerta con motivo; el docente solo puede asignársela a sí mismo y actuar en su alcance. El historial registra actor, fecha y cambio.

### Inspectoría

1. Abrir Justificaciones. Elegir una ausencia existente de una clase realizada y no futura.
2. Registrar motivo y referencia del respaldo (por ejemplo, folio de un documento custodiado por el establecimiento). No subir documentos médicos a Git ni publicar enlaces abiertos.
3. Revisar la solicitud y registrar aprobación o rechazo con fundamento.
4. Aprobar convierte la asistencia a justificada y recalcula alertas en la misma transacción. Rechazar conserva la ausencia. Dos revisiones simultáneas no pueden sobrescribir la decisión.
5. Una justificación aceptada no puede ser revertida desde el formulario docente de asistencia. No se implementó una apelación o reapertura de solicitudes rechazadas.

### Estudiante y Dirección/UTP

El estudiante consulta exclusivamente sus datos, asistencia, notas y anotaciones publicadas. En Mis justificaciones ve fechas y estado; no recibe motivos sensibles, referencia del respaldo ni observaciones internas. No puede aprobar justificaciones ni gestionar alertas.

El rol Dirección/UTP dispone de consulta escolar y gestión de alertas, sin administración de estructura ni revisión de justificaciones. No se creó una cuenta de demostración de Dirección. La instalación no ofrece aislamiento multiinstitución: los roles globales trabajan sobre esta base escolar.

:::pagebreak

## 3. Reglas y significado de los resultados

| Regla | Dato usado | Comportamiento |
|---|---|---|
| Asistencia crítica | Porcentaje de presente + atraso sobre presente + atraso + ausente | Activa por debajo del umbral configurado; justificadas y pendientes excluidas |
| Rendimiento bajo | Suma de nota por ponderación / suma de ponderaciones publicadas del curso | Indicador preventivo, no promedio oficial por asignatura ni nota de promoción |
| Riesgo combinado | Porcentaje de asistencia y rendimiento | Requiere ambos datos y ambos límites configurados |

Las reglas consideran matrículas y contexto escolar activos, sesiones realizadas/publicadas y datos no futuros. Si no existe información suficiente, no se inventa un cero para activar riesgo.

La clave del motor identifica estudiante, curso y código de regla. Recalcular actualiza esa alerta sin crear copias; los cambios de versión preservan la trazabilidad. Cuando deja de cumplirse la condición, la alerta se resuelve. Si vuelve a cumplirse, una alerta resuelta puede reabrirse; una descartada no se reabre automáticamente. Alertas manuales históricas sin clave del motor se conservan.

Cambiar una regla o aprobar una justificación recalcula automáticamente. Cambiar notas/asistencia requiere el botón Recalcular. Los umbrales incluidos son de demostración y deben ser validados por una contraparte escolar antes de uso real.

## 4. Arquitectura y migración

React consume una API Express bajo el mismo origen. La API aplica identidad, CSRF, rol, alcance, validación, control de versiones y transacciones. PostgreSQL conserva las entidades y evento_auditoria. El navegador nunca recibe credenciales de la base.

La migración 008_school_operations.sql agrega clave única de alerta, revisiones para concurrencia, marca temporal de niveles y versión de esquema 0.8.0. Es aditiva y repetible. La API no arranca si faltan las marcas de seguridad u operaciones requeridas.

Instalación local nueva: desde SIGAA ejecutar docker compose up --build. No crea usuarios por defecto. Crear cuentas con npm run user:create dentro del contenedor, pasando JSON por entrada estándar mediante el procedimiento privado del informe Sprint 3. No introducir contraseñas en Git ni en Jira.

Base local existente que ya usa el dominio escolar: respaldar primero; ejecutar docker compose build api, docker compose stop api y docker compose run --rm --no-deps api npm run migrate; finalmente docker compose up -d --build. El migrador aplica 007 y 008 desde los archivos montados. No ejecutar migración histórica 003 ni borrar volúmenes para actualizar. Un fallo obliga a revisar diagnóstico antes de reabrir la aplicación.

Servidor existente: scripts/upgrade-school-operations.py --apply solo permite la ruta conocida del servidor. Conserva un pg_dump privado y comprueba su inventario con pg_restore --list antes de aplicar exclusivamente 008 con el propietario de la base. Después se reconstruyen API/web con compose.hosted.yaml y el archivo privado hosted.env; el túnel no se recrea. Las credenciales de ejecución siguen limitadas, sin facultad de cambiar el esquema.

Se generó respaldo de 111.842 bytes antes de esta migración. La lectura del inventario fue exitosa; no se realizó una restauración completa de ese respaldo en esta ejecución. Si fuera necesario volver al código anterior, mantener el esquema aditivo y desplegar el commit anterior d267804; cualquier restauración de datos requiere evaluación y autorización específica para no perder escrituras posteriores.

HTTPS público: https://winter-mount-aluminum-removable.trycloudflare.com. Enlace temporal, dependiente del Mac y Docker. No se promete TLS en el tramo privado API-PostgreSQL ni disponibilidad productiva. Las contraseñas permanecen fuera del repositorio.

:::pagebreak

## 5. Verificación de calidad

| Entorno | Resultado | Alcance y límite |
|---|---|---|
| Docker / Node 22 / PostgreSQL 16 | 4 unitarias + 44 integración, sin fallos | Bases aisladas; 14 pruebas nuevas de estructura, reglas y justificaciones |
| Chromium local, PostgreSQL 14 aislado | 11 recorridos nuevos aprobados | Formularios, errores, reglas, filtros, historial, permisos y móvil 390 px |
| Regresión local | 14 recorridos aprobados | Login, matrícula, asistencia, publicación de notas, anotaciones y privacidad |
| HTTPS docente/estudiante | 4 recorridos aprobados | Dos roles en escritorio y móvil; sesiones, lectura y permisos |
| HTTPS administración/Inspectoría | 4 recorridos aprobados | Dos roles, menús, lectura API, alcance y pantallas sin desborde |
| Instalación Compose nueva | Tres servicios saludables | Volumen de prueba separado; puertos solo loopback; salud API 0.8.0 |

Se comprobaron persistencia al reiniciar la aplicación, rechazo de edición obsoleta, recálculo concurrente sin duplicados y aprobación simultánea con una sola decisión válida. Se inspeccionaron capturas de escritorio y teléfono; foco de teclado y ausencia de errores JavaScript en los recorridos nuevos. No es una auditoría WCAG completa.

Durante las pruebas se corrigió ambigüedad de tipos SQL, nombres accesibles de selectores, actualización de filtros y espera de sesión en la prueba de recarga. La prueba HTTPS reconoce que un contenedor de aviso vacío no es un error. No se ocultaron fallos de aplicación con datos simulados en producción.

Evidencias JSON: SIGAA/output/evidence/operations-*.json. Scripts reproducibles: apps/api/test/operations.test.js, scripts/verify-operations-browser.mjs, scripts/verify-sprint3-browser.mjs y scripts/verify-operations-hosted.mjs. Las pruebas de escritura generan y eliminan únicamente sus bases temporales. La demo pública no recibió alumnos, notas ni ausencias ficticias para validar esta entrega.

## 6. Estado Scrum y decisión requerida

| Contenedor existente | Puntos actuales | En revisión | Terminados en historias |
|---|---:|---:|---:|
| Sprint 2, id 3 | 13 | 13 | 0 |
| Sprint 3, id 2 | 29 | 29 | 0 |
| Sprint 4, id 37 | 34 | 34 | 0 |

SCRUM-25, 32, 33 y 49 se actualizaron a En revisión con evidencia en sus incidencias existentes. No se crearon sprints, historias ni comentarios duplicados. SCRUM-26, 31 y 34 continúan en revisión. Los 29 puntos de S3 y sus 12 subtareas técnicas no se modifican en esta entrega.

La recuperación técnica de S2/S3 es tardía y no se retrofecha. Sprint 4 conserva fin planificado el 17 de octubre. Tener su alcance técnico implementado al 15 de octubre no acredita cierre, aceptación ni entrega académica. Planning, Daily, retrospectivas y burndown anteriores se conservan como registros de su corte previo, no se inventan reuniones o una velocidad histórica.

Joel debe probar los recorridos por rol y aceptar o devolver cada historia con observaciones. Recomendación de QA: apto para revisión funcional de la demo; requiere validación antes de producción. Pendientes: aceptación del PO, validación escolar de reglas, pruebas de carga, accesibilidad integral, Safari/Firefox, respaldo periódico y disponibilidad sostenida. Los módulos de Sprint 5 y posteriores siguen pendientes según el backlog.

# Arquitectura de software - SIGAA

Corte posterior a la implementación: 15 de octubre de 2026. Base técnica: a9b6f65, API 0.8.0. Jira actualizado sobre las incidencias existentes. Evidencia técnica para revisión del Product Owner; no acredita reuniones ni aceptación.

## Vista implementada

Monolito modular web: React y Nginx presentan la interfaz; Node.js y Express validan identidad, permisos y reglas; PostgreSQL 16 conserva registros. Docker aísla servicios. No se conectan navegadores directamente a la base.

:::diagram architecture

## Responsabilidades y controles

| Componente | Responsabilidad implementada | Límite |
|---|---|---|
| React | Formularios, navegación y estado de consulta | No autoriza operaciones por sí solo |
| Nginx | Servir web y dirigir /api al backend | No publica acceso a PostgreSQL |
| Express | Sesión, CSRF, rol, alcance, validación y transacciones | Estructura, reglas y justificaciones integradas; casos S5 pendientes |
| PostgreSQL | Restricciones, sesiones, auditoría y datos académicos | Usuario de API limitado, red privada |
| Cloudflare | Acceso público HTTPS y túnel | URL temporal, depende del Mac y Docker |

## Seguridad y operación

Las contraseñas usan hash scrypt con sal. La sesión guarda un hash del token y puede expirar o revocarse. En modo HTTPS la cookie es Secure, HttpOnly y SameSite Strict. Las mutaciones exigen origen esperado y token CSRF. Las consultas verifican matrícula activa y asignación docente.

No hay puertos de la base publicados al exterior. El enlace público y el túnel están cifrados; no se afirma que la conexión interna API-PostgreSQL use TLS. El aislamiento de red no equivale a cifrado de todos los tramos.

Los módulos de prototipo conservados no prueban funciones productivas. La aplicación segura permite estudiantes/matrículas al administrador y operación académica al docente; el estudiante consulta sus propios registros publicados. Inspectoría registra y revisa justificaciones y gestiona alertas; Dirección/UTP consulta y gestiona alertas. Los roles globales operan sobre esta instalación: no se promete aislamiento multiinstitución.

## Defensa de la decisión

Un monolito modular reduce complejidad operativa para tres integrantes. Docker fija el entorno y PostgreSQL aplica integridad y transacciones. Los módulos permiten separar reglas sin introducir despliegues independientes innecesarios. La arquitectura se evalúa por pruebas y límites explícitos, no por número de componentes.

## Evidencia técnica y límites

- a9b6f65: estructura escolar, tres reglas configurables, bandeja e Inspectoría conectadas a PostgreSQL; API 0.8.0.
- Pruebas ejecutadas el 15-10: 4 unitarias y 44 de integración aprobadas en Docker/PostgreSQL 16; 11 recorridos nuevos y 14 de regresión en Chromium local; 8 recorridos HTTPS (cuatro roles, escritorio y móvil).
- Evidencias: SIGAA/output/evidence/operations-docker-tests.json, operations-browser-tests.json, operations-regression-browser-tests.json, operations-hosted-tests.json y operations-academic-hosted-tests.json.
- Escrituras de prueba solo en bases aisladas. Despliegue real con respaldo previo y migración aditiva 008; sin seeds ni reinicialización.
- Los umbrales requieren validación escolar. El rendimiento es preventivo, no un promedio oficial. Tras notas/asistencia se pulsa Recalcular; cambios de regla y aprobación de justificación recalculan automáticamente.
- Carga, accesibilidad integral, otros navegadores, operación sostenida y aceptación del PO siguen pendientes.

## Pendientes

Backups periódicos, restauración operativa recurrente, rotación de credenciales administrativas, validación escolar, carga, accesibilidad integral y navegación Safari/Firefox. La demo no constituye una autorización de producción escolar.

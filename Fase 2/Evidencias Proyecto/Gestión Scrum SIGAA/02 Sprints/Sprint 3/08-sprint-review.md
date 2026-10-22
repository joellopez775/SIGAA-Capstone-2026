# Review - Sprint 3

Corte de regularización: 15 de octubre de 2026. Base técnica: commit 899aab6. Fuente operativa: Jira SIGAA, tablero 1. Esta actualización documenta evidencia existente; no acredita reuniones ni aceptación del Product Owner.

Plan documental inicial: 21 de septiembre al 3 de octubre. Jira: Sprint 3 - Actual, activo, del 24 de septiembre al 8 de octubre. El 15 de octubre sigue abierto; la implementación registrada ese día es posterior al plazo. No se modifica ni se oculta esta desviación.

Estado: informe de evidencia para revisión. No acredita reunión celebrada ni aceptación del PO.

| Jira / historia | Puntos | Estado consultado |
|---|---:|---|
| SCRUM-23 / PB-011 Autenticación segura | 8 | En revisión |
| SCRUM-24 / PB-012 Roles y permisos | 8 | En revisión |
| SCRUM-27 / PB-015 Gestión de estudiantes | 8 | En revisión |
| SCRUM-28 / PB-016 Matrículas | 5 | En revisión |

## Evidencia técnica y límites

- 62fbcba: sesiones, permisos, estudiantes y matrículas persistentes.
- dfa0461: PostgreSQL aislado en el Mac servidor y respaldo verificado.
- f48fbc3: publicación HTTPS y cuentas de demostración por rol.
- 899aab6: asistencia, evaluaciones, calificaciones y anotaciones persistentes.
- Pruebas conservadas: 4 unitarias y 30 de integración en Docker / PostgreSQL 16, sin fallos; 14 recorridos en navegador local y 4 recorridos de lectura/login en HTTPS. No son pruebas ejecutadas nuevamente durante esta regularización.
- Evidencias: SIGAA/output/evidence/academic-docker-tests.json, academic-browser-tests.json y academic-hosted-tests.json.
- Alertas, justificaciones completas, cálculo oficial de promedios, carga, accesibilidad integral y validación escolar siguen pendientes. Un esquema SQL no acredita una función conectada.

## Demostración y decisión pendiente

Mostrar el alcance probado en una base de demostración, contrastar criterios y explicar las funciones aún no integradas. Para cada historia registrar: aceptada, devuelta con ajustes o replanificada; fecha real, responsable de decisión y evidencia. Ninguna de estas decisiones se presume en este documento.

## Aprobación pendiente

El PO debe decidir por historia; el equipo debe ratificar sus acuerdos y la contraparte validar los flujos. No se registran aprobaciones ni reuniones no acreditadas.

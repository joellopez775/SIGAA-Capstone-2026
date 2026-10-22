# Sprint Backlog - Sprint 4

Corte posterior a la implementación: 15 de octubre de 2026. Base técnica: a9b6f65, API 0.8.0. Jira actualizado sobre las incidencias existentes. Evidencia técnica para revisión del Product Owner; no acredita reuniones ni aceptación.

Jira: Sprint 4 - Asistencia/Alertas, activo, del 5 al 17 de octubre. Se conserva el sprint existente id 37. La referencia antigua id 36 no se usa.

| Jira / historia | Puntos | Estado consultado |
|---|---:|---|
| SCRUM-31 / PB-019 Registro de asistencia | 8 | En revisión |
| SCRUM-32 / PB-020 Tres reglas explicables de alerta | 8 | En revisión |
| SCRUM-33 / PB-021 Bandeja y dashboard inicial de alertas | 8 | En revisión |
| SCRUM-34 / PB-022 Entrega de avance Fase 2 | 5 | En revisión |
| SCRUM-49 / PB-037 Justificaciones por Inspectoría | 5 | En revisión |
## Trabajo y criterios pendientes

- PB-019 / SCRUM-31: asistencia por clase y estudiante matriculado, cuatro estados, autorización, corrección auditada y persistencia tras reinicio. Evidencia en 899aab6; en revisión.
- PB-020 / SCRUM-32: reglas configurables, datos persistentes, explicación y deduplicación. Integrado en API/interfaz con PostgreSQL, configuración versionada, ausencia de falsos positivos sin datos y recálculo sin duplicación; en revisión.
- PB-021 / SCRUM-33: bandeja persistente, filtros y cambios auditados. Integrado con cuatro filtros, responsable, estado, contadores e historial; en revisión.
- PB-022 / SCRUM-34: informe de avance actualizado y trazable; revisión del PO y entrega/feedback académico pendientes.
- PB-037 / SCRUM-49: solicitud, revisión, respaldo protegido y actualización auditada de asistencia. Flujo persistente de aprobación/rechazo; aprobación actualiza asistencia y alertas atómicamente. Respaldo mediante referencia privada, sin publicar archivos médicos; en revisión.

## Trazabilidad

Fuente: consulta Jira sprint = 37, corte 15-10-2026. Se conservan las claves existentes. Cada cambio debe enlazar commit, prueba y decisión; el documento no cambia automáticamente los estados de Jira.

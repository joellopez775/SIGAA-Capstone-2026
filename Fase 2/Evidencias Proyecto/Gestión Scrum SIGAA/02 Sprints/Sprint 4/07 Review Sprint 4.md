# Review - Sprint 4

Corte posterior a la implementación: 15 de octubre de 2026. Base técnica: a9b6f65, API 0.8.0. Jira actualizado sobre las incidencias existentes. Evidencia técnica para revisión del Product Owner; no acredita reuniones ni aceptación.

Jira: Sprint 4 - Asistencia/Alertas, activo, del 5 al 17 de octubre. Se conserva el sprint existente id 37. La referencia antigua id 36 no se usa.

Estado: informe de evidencia para revisión. No acredita reunión celebrada ni aceptación del PO.

| Jira / historia | Puntos | Estado consultado |
|---|---:|---|
| SCRUM-31 / PB-019 Registro de asistencia | 8 | En revisión |
| SCRUM-32 / PB-020 Tres reglas explicables de alerta | 8 | En revisión |
| SCRUM-33 / PB-021 Bandeja y dashboard inicial de alertas | 8 | En revisión |
| SCRUM-34 / PB-022 Entrega de avance Fase 2 | 5 | En revisión |
| SCRUM-49 / PB-037 Justificaciones por Inspectoría | 5 | En revisión |

## Evidencia técnica y límites

- a9b6f65: estructura escolar, tres reglas configurables, bandeja e Inspectoría conectadas a PostgreSQL; API 0.8.0.
- Pruebas ejecutadas el 15-10: 4 unitarias y 44 de integración aprobadas en Docker/PostgreSQL 16; 11 recorridos nuevos y 14 de regresión en Chromium local; 8 recorridos HTTPS (cuatro roles, escritorio y móvil).
- Evidencias: SIGAA/output/evidence/operations-docker-tests.json, operations-browser-tests.json, operations-regression-browser-tests.json, operations-hosted-tests.json y operations-academic-hosted-tests.json.
- Escrituras de prueba solo en bases aisladas. Despliegue real con respaldo previo y migración aditiva 008; sin seeds ni reinicialización.
- Los umbrales requieren validación escolar. El rendimiento es preventivo, no un promedio oficial. Tras notas/asistencia se pulsa Recalcular; cambios de regla y aprobación de justificación recalculan automáticamente.
- Carga, accesibilidad integral, otros navegadores, operación sostenida y aceptación del PO siguen pendientes.

## Demostración y decisión pendiente

Mostrar el alcance probado en una base de demostración, contrastar criterios y explicar las funciones aún no integradas. Para cada historia registrar: aceptada, devuelta con ajustes o replanificada; fecha real, responsable de decisión y evidencia. Ninguna de estas decisiones se presume en este documento.

## Aprobación pendiente

El PO debe decidir por historia; el equipo debe ratificar sus acuerdos y la contraparte validar los flujos. No se registran aprobaciones ni reuniones no acreditadas.

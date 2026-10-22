# Épicas y Product Backlog vigente

Fuente de estados: Jira consultado el 15-10-2026. El plan maestro anterior es una línea base histórica, no la fuente de estado actual.

Este documento presenta una vista revisable en GitHub. Los puntos y la asignación definitiva se confirman durante Sprint Planning.

## Criterios de priorización

- `Must`: necesario para el objetivo, la seguridad o una evaluación Capstone.
- `Should`: aporta valor relevante, pero admite una alternativa temporal.
- `Could`: se implementa solo si existe capacidad después de los Must.
- Primero se reducen riesgos de validación, arquitectura, datos y seguridad.

## Épicas

| Épica | Resultado esperado | Sprints propuestos |
|---|---|---|
| Descubrimiento y producto | Problema, usuarios, visión y backlog validados | Sprint 0–1 |
| Diseño y arquitectura | Arquitectura, ER, UML, API y NFR coherentes | Sprint 1–2 |
| Seguridad y plataforma | Autenticación, RBAC, CI y Docker | Sprint 2 |
| Gestión escolar | Establecimiento, niveles, cursos, estudiantes, apoderados, matrículas y notas | Sprint 2–3 |
| Asistencia y alertas | Asistencia, reglas y bandeja priorizada | Sprint 4 |
| Seguimiento | Casos, intervenciones, ficha 360 y avisos | Sprint 5 |
| Analítica y auditoría | Dashboard, reportes y trazabilidad | Sprint 6 |
| Calidad y cierre | Pruebas, manuales, despliegue y defensa | Sprint 6–Release final |

:::pagebreak

## Backlog priorizado y estado vigente

Los puntos y estados provienen de Jira. Las prioridades conservan la línea base; no son una repriorización acordada. Sin sprint significa backlog de producto, no una asignación nueva.

| Historia / Jira | Prioridad | Puntos | Asignación actual | Estado |
|---|---|---:|---|---|
| PB-001 Validar problema usuarios y restricciones / SCRUM-13 | Must | 5 | Sprint 0 - Histórico | En revisión |
| PB-002 Product Vision y cuatro pilares / SCRUM-14 | Must | 3 | Sprint 0 - Histórico | En revisión |
| PB-003 Backlog priorizado y estimado / SCRUM-15 | Must | 5 | Sprint 0 - Histórico | En revisión |
| PB-004 Definition of Done / SCRUM-16 | Must | 2 | Sprint 0 - Histórico | En revisión |
| PB-005 Repositorio README y trazabilidad / SCRUM-17 | Must | 3 | Sprint 0 - Histórico | En revisión |
| PB-006 Arquitectura y decisiones técnicas / SCRUM-18 | Must | 5 | Sprint 1 - Histórico | Terminada |
| PB-007 Modelo ER y diccionario de datos / SCRUM-19 | Must | 5 | Sprint 1 - Histórico | En revisión |
| PB-008 Prototipo navegable validado / SCRUM-20 | Must | 5 | Sprint 1 - Histórico | En revisión |
| PB-009 UML de flujos principales / SCRUM-21 | Must | 5 | Sprint 1 - Histórico | En curso |
| PB-010 Entrega y presentación Fase 1 / SCRUM-22 | Must | 5 | Sprint 1 - Histórico | En revisión |
| PB-011 Autenticación segura / SCRUM-23 | Must | 8 | Sprint 3 - Actual | En revisión |
| PB-012 Roles y permisos / SCRUM-24 | Must | 8 | Sprint 3 - Actual | En revisión |
| PB-013 Estructura escolar / SCRUM-25 | Must | 8 | Sprint 2 - Histórico | En revisión |
| PB-014 Entorno Docker reproducible / SCRUM-26 | Must | 5 | Sprint 2 - Histórico | En revisión |
| PB-015 Gestión de estudiantes / SCRUM-27 | Must | 8 | Sprint 3 - Actual | En revisión |
| PB-016 Matrículas / SCRUM-28 | Must | 5 | Sprint 3 - Actual | En revisión |
| PB-017 Evaluaciones y calificaciones / SCRUM-29 | Must | 8 | Sin sprint | En revisión |
| PB-018 Importación validada / SCRUM-30 | Should | 5 | Sin sprint | Pendiente |
| PB-019 Registro de asistencia / SCRUM-31 | Must | 8 | Sprint 4 - Asistencia/Alertas | En revisión |
| PB-020 Tres reglas explicables de alerta / SCRUM-32 | Must | 8 | Sprint 4 - Asistencia/Alertas | En revisión |
| PB-021 Bandeja y dashboard inicial de alertas / SCRUM-33 | Must | 8 | Sprint 4 - Asistencia/Alertas | En revisión |
| PB-022 Entrega de avance Fase 2 / SCRUM-34 | Must | 5 | Sprint 4 - Asistencia/Alertas | En revisión |
| PB-023 Casos de seguimiento / SCRUM-35 | Must | 8 | Sin sprint | Pendiente |
| PB-024 Ficha integral del estudiante / SCRUM-36 | Must | 8 | Sin sprint | En curso |
| PB-025 Notificaciones / SCRUM-37 | Should | 5 | Sin sprint | Pendiente |
| PB-026 Indicadores agregados / SCRUM-38 | Should | 8 | Sin sprint | Pendiente |
| PB-027 Exportación de reportes / SCRUM-39 | Could | 5 | Sin sprint | Pendiente |
| PB-028 Auditoría de cambios sensibles / SCRUM-40 | Must | 8 | Sin sprint | Pendiente |
| PB-029 Pruebas integrales seguridad y rendimiento / SCRUM-41 | Must | 8 | Sin sprint | En curso |
| PB-030 Manual técnico y despliegue / SCRUM-42 | Must | 5 | Sin sprint | En revisión |
| PB-031 Manual de usuario / SCRUM-43 | Should | 5 | Sin sprint | Pendiente |
| PB-032 Innovación y propuesta de valor / SCRUM-44 | Must | 3 | Sin sprint | Pendiente |
| PB-033 Entrega final Fase 2 / SCRUM-45 | Must | 8 | Sin sprint | Pendiente |
| PB-034 Defensa y retrospectiva del proyecto / SCRUM-46 | Must | 5 | Sin sprint | Pendiente |
| PB-035 Corregir dominio universitario a escolar / SCRUM-47 | Must | 8 | Sprint 1 - Histórico | Terminada |
| PB-036 Gestión de apoderados / SCRUM-48 | Must | 5 | Sin sprint | En curso |
| PB-037 Justificaciones por Inspectoría / SCRUM-49 | Must | 5 | Sprint 4 - Asistencia/Alertas | En revisión |
| PB-038 Modelo docente / SCRUM-50 | Must | 13 | Sprint 1 - Histórico | En revisión |
| PB-039 Modelo estudiante / SCRUM-51 | Must | 13 | Sprint 1 - Histórico | En curso |
| PB-040 Docker de equipo y aislamiento de servidor / SCRUM-52 | Must | 8 | Sprint 1 - Histórico | En curso |

## Criterio de lectura

No se confunde una subtarea terminada con aceptación de su historia. Estructura escolar, alertas y justificaciones pasaron a En revisión tras a9b6f65; asistencia, notas y autenticación también esperan aceptación. No se marca Terminada una historia sin aceptación. Las tarjetas consultadas no tienen asignatario: el equipo debe ratificar responsables.

## Cambios y trazabilidad

Mantener claves PB y SCRUM existentes. Una nueva prioridad requiere decisión del PO y revisión de capacidad. No crear una segunda historia para un arrastre de sprint. Los datos de esta edición se respaldan en 04 Evidencias/jira-corte-2026-10-15.json.

## Actualización técnica 0.8.0

- a9b6f65: estructura escolar, tres reglas configurables, bandeja e Inspectoría conectadas a PostgreSQL; API 0.8.0.
- Pruebas ejecutadas el 15-10: 4 unitarias y 44 de integración aprobadas en Docker/PostgreSQL 16; 11 recorridos nuevos y 14 de regresión en Chromium local; 8 recorridos HTTPS (cuatro roles, escritorio y móvil).
- Evidencias: SIGAA/output/evidence/operations-docker-tests.json, operations-browser-tests.json, operations-regression-browser-tests.json, operations-hosted-tests.json y operations-academic-hosted-tests.json.
- Escrituras de prueba solo en bases aisladas. Despliegue real con respaldo previo y migración aditiva 008; sin seeds ni reinicialización.
- Los umbrales requieren validación escolar. El rendimiento es preventivo, no un promedio oficial. Tras notas/asistencia se pulsa Recalcular; cambios de regla y aprobación de justificación recalculan automáticamente.
- Carga, accesibilidad integral, otros navegadores, operación sostenida y aceptación del PO siguen pendientes.

Las cuatro transiciones del 15-10 conservan claves y pertenencia a sprint. Evidencia adicional: SIGAA/output/evidence/operations-jira-update.json. Las demás filas conservan el corte previo; no se presume cierre de los Sprints 0/1 ni del producto completo.

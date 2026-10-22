# Expediente documental SIGAA

Corte vigente: 15 de octubre de 2026. Proyecto escolar para colegios y liceos. Esta edición regulariza evidencia; no acredita reuniones ni aprobaciones no registradas.

## Documentos vigentes y ubicaciones únicas

| Bloque | Ubicación PDF | Situación |
|---|---|---|
| Producto y mapas | PDF/01 Producto | Mapas gráficos corregidos; estados del backlog conciliados con Jira |
| Sprint 2 | PDF/02 Sprints/Sprint 2 | Nueve documentos; reconstrucción explícita, no ceremonia acreditada |
| Sprint 3 | PDF/02 Sprints/Sprint 3 | Diez documentos de gestión actualizados; informes técnicos históricos 10-12 conservados |
| Sprint 4 e informe Fase 2 | SIGAA/output/pdf/Sprint 4 (desde raíz del repo) | Diez PDF existentes actualizados, sin segunda copia |
| Reflexión Fase 2 | PDF/02 Sprints/Reflexión Fase 2.pdf | Base factual para validar en equipo, no entrega firmada |
| Arquitectura de software y datos | SIGAA/output/pdf (desde raíz del repo) | Documentos independientes actualizados |
| Evidencia técnica reciente | PDF/03 Implementación | Informe de operación académica e Implementación 0.8.0 con guía y pruebas |
| Carta Gantt vigente | [Excel por sprints](<05 Planificación/Carta Gantt SIGAA por sprints.xlsx>) | Fechas de trabajo restante sincronizadas con Jira el 15-10-2026; sustituye la Gantt base para planificación actual |

Las fuentes editables del Sprint 4 están en 02 Sprints/Sprint 4; sus PDF permanecen en la ruta existente indicada. No se crean archivos con sufijos final, v2 o copia. Los enlaces de documentos antiguos remiten a la fuente única actualizada cuando corresponde.

## Lectura del avance

Sprint 2: 13 puntos actuales en revisión. Sprint 3: 29 puntos en revisión; 12 subtareas técnicas terminadas. Sprint 4: 34 puntos en revisión. No hay historias terminadas dentro de esos tres conjuntos al corte. Esto no equivale a ausencia de implementación.

Jira mantiene id 3 para Sprint 2, id 2 para Sprint 3 e id 37 para Sprint 4. Los sprints históricos 0-2 aparecen future; Sprints 3 y 4 siguen activos. No se cerraron, iniciaron, renombraron ni duplicaron sprints en esta regularización.

## Históricos que no describen la versión actual

### Actualización de planificación del 15 de octubre

La carta Gantt editable de `05 Planificación` es la referencia vigente del trabajo restante. El estado y sprint reales se distinguen de la disponibilidad técnica y del reparto propuesto. Cambiar el Excel no modifica Jira automáticamente.

- Se reutilizaron las 114 tarjetas existentes y sus 40 historias (255 puntos). No se crearon historias, tareas ni reuniones adicionales.
- Sprint 4 (id 37): seis historias y 42 puntos, incluyendo PB-017 como complemento de ocho puntos. La cifra de 34 puntos de los cortes anteriores describe el conjunto previo.
- Sprint 5 (id 38): 19–31 octubre, cuatro historias y 26 puntos. Sprint 6 (id 40): 2–14 noviembre, seis historias y 37 puntos. Sprint 7 (id 39): 16–28 noviembre, una historia y ocho puntos. Los tres están planificados, no iniciados.
- Defensa y cierre: SCRUM-46 queda en backlog con trabajo previsto del 23 noviembre al 12 diciembre. SCRUM-30 y SCRUM-39 permanecen sin fecha.
- Se registraron inicio y vencimiento del trabajo restante en las 36 historias con fechas. Las historias históricas conservan su pertenencia y las fechas de recuperación no acreditan ejecución pasada.
- GEST-S5, GEST-S6 y GEST-S7 se siguen en SCRUM-77, 78, 81, 84 y 85; OPS-01 en SCRUM-52; OPS-02 en SCRUM-41. Son referencias a tarjetas existentes, sin volver a contar puntos.
- El avance de Fase 2 corresponde al 12–17 octubre; la entrega final y presentación, al 16–21 noviembre; las presentaciones finales de Fase 3, al 30 noviembre–12 diciembre. Confirmar día y hora concretos en Campus.

Al verificar, Sprint 1 apareció activo con fechas 14–28 octubre, distintas de su ventana documental agosto–septiembre. También SCRUM-36 y SCRUM-48 aparecieron Pendiente, frente a En curso al iniciar la sincronización. No se solicitaron esos cambios ni se revirtieron sin confirmación. El Excel conserva la evidencia técnica parcial y refleja el estado leído: dos historias Terminada, 22 En revisión, cuatro En curso y 12 Pendiente. No se cerró ni inició ningún sprint ni se aprobó ninguna historia.

Evidencia de cambios y comprobación: `04 Evidencias/gantt-jira-sync-2026-10-15.json`. Los párrafos y PDF anteriores conservan su corte histórico; no acreditan el estado posterior de esta sincronización.

Los Sprints 0 y 1, los informes técnicos de entregas previas, la Gantt base y los documentos generales de defensa de septiembre conservan su contexto histórico. No usarlos como parte de estado actual sin leer este índice y los expedientes actualizados. No se borra su evidencia ni se retrofechan aprobaciones.

La referencia actual de arquitectura es Arquitectura de Software - SIGAA.pdf y Arquitectura de Base de Datos - SIGAA.pdf. La guía general de defensa y su compilación de septiembre son históricas y no prevalecen sobre estos documentos. El modelo ER objetivo continúa siendo objetivo, no prueba de implementación completa.

:::pagebreak

## Pendientes humanos y académicos

- Confirmar responsabilidades y disponibilidad reales.
- Revisar y aceptar o devolver historias como Product Owner.
- Registrar retrospectivas y Daily cuando ocurran, con participantes efectivos.
- Validar flujos y umbrales con una contraparte educativa.
- Validar las respuestas grupales de reflexión Fase 2.
- Registrar entrega en Campus y feedback docente. No se ha realizado esa entrega desde esta regularización.

## Fuentes y mantenimiento

Estados: 04 Evidencias/jira-corte-2026-10-15.json. Código vigente: commit a9b6f65; operación académica anterior 899aab6 y antecedentes 62fbcba, dfa0461, f48fbc3. Pruebas: SIGAA/output/evidence. Generación selectiva reproducible: scripts/generate-scrum-pdfs.py --manifest scripts/document-regularization.json. Los PDF se actualizan sobre sus rutas canónicas.

## Corte posterior a la implementación 0.8.0

- a9b6f65: estructura escolar, tres reglas configurables, bandeja e Inspectoría conectadas a PostgreSQL; API 0.8.0.
- Pruebas ejecutadas el 15-10: 4 unitarias y 44 de integración aprobadas en Docker/PostgreSQL 16; 11 recorridos nuevos y 14 de regresión en Chromium local; 8 recorridos HTTPS (cuatro roles, escritorio y móvil).
- Evidencias: SIGAA/output/evidence/operations-docker-tests.json, operations-browser-tests.json, operations-regression-browser-tests.json, operations-hosted-tests.json y operations-academic-hosted-tests.json.
- Escrituras de prueba solo en bases aisladas. Despliegue real con respaldo previo y migración aditiva 008; sin seeds ni reinicialización.
- Los umbrales requieren validación escolar. El rendimiento es preventivo, no un promedio oficial. Tras notas/asistencia se pulsa Recalcular; cambios de regla y aprobación de justificación recalculan automáticamente.
- Carga, accesibilidad integral, otros navegadores, operación sostenida y aceptación del PO siguen pendientes.

Backlogs, tableros, releases y reviews de S2/S4, Fase 2, arquitecturas y Product Backlog reflejan esta actualización. Planning, Daily, retrospectivas, burndown y expediente S3 conservan el corte anterior: no son actas nuevas ni una medición posterior. Los puntos pendientes de aceptación no disminuyen al pasar a revisión. No interpretar sus antiguos pendientes técnicos como un nuevo bloqueo: prevalece el informe Implementación 0.8.0. Generación selectiva: scripts/operations-documentation.json.

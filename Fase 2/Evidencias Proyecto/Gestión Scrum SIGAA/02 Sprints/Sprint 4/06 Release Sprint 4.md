# Release y entrega técnica - Sprint 4

Corte posterior a la implementación: 15 de octubre de 2026. Base técnica: a9b6f65, API 0.8.0. Jira actualizado sobre las incidencias existentes. Evidencia técnica para revisión del Product Owner; no acredita reuniones ni aceptación.

Jira: Sprint 4 - Asistencia/Alertas, activo, del 5 al 17 de octubre. Se conserva el sprint existente id 37. La referencia antigua id 36 no se usa.

## Incremento disponible

La versión implementada es a9b6f65 (API 0.8.0), sobre la operación académica 899aab6. Está desplegada en el Mac servidor con HTTPS. Es una entrega técnica para revisión; no se creó una release formal aceptada ni se cerró el sprint.

## Evidencia técnica y límites

- a9b6f65: estructura escolar, tres reglas configurables, bandeja e Inspectoría conectadas a PostgreSQL; API 0.8.0.
- Pruebas ejecutadas el 15-10: 4 unitarias y 44 de integración aprobadas en Docker/PostgreSQL 16; 11 recorridos nuevos y 14 de regresión en Chromium local; 8 recorridos HTTPS (cuatro roles, escritorio y móvil).
- Evidencias: SIGAA/output/evidence/operations-docker-tests.json, operations-browser-tests.json, operations-regression-browser-tests.json, operations-hosted-tests.json y operations-academic-hosted-tests.json.
- Escrituras de prueba solo en bases aisladas. Despliegue real con respaldo previo y migración aditiva 008; sin seeds ni reinicialización.
- Los umbrales requieren validación escolar. El rendimiento es preventivo, no un promedio oficial. Tras notas/asistencia se pulsa Recalcular; cambios de regla y aprobación de justificación recalculan automáticamente.
- Carga, accesibilidad integral, otros navegadores, operación sostenida y aceptación del PO siguen pendientes.

## Operación de la demostración

La aplicación usa HTTPS mediante un túnel temporal Cloudflare y una base privada en el Mac servidor. Las cuentas existentes se mantienen; sus contraseñas no se incluyen en informes ni Git. El enlace puede cambiar y depende del servidor.

Revisar el manual de despliegue y los informes técnicos 10, 11 y 12 del Sprint 3. No restaurar una base ni ejecutar seeds de prueba sobre la demo pública. El código 0.8.0 fue desplegado y comprobado por HTTPS. El informe de Implementación 0.8.0 incluye uso, migración y límites.

## Cierre

Entregar documentación no cierra el sprint. La release aceptada, validación escolar y aprobación del PO siguen pendientes donde no constan.

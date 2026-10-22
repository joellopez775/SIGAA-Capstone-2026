# Release y entrega técnica - Sprint 3

Corte de regularización: 15 de octubre de 2026. Base técnica: commit 899aab6. Fuente operativa: Jira SIGAA, tablero 1. Esta actualización documenta evidencia existente; no acredita reuniones ni aceptación del Product Owner.

Plan documental inicial: 21 de septiembre al 3 de octubre. Jira: Sprint 3 - Actual, activo, del 24 de septiembre al 8 de octubre. El 15 de octubre sigue abierto; la implementación registrada ese día es posterior al plazo. No se modifica ni se oculta esta desviación.

## Incremento disponible

La versión de código utilizada como evidencia es 899aab6, posterior a la implementación segura 62fbcba y al despliegue f48fbc3. La etiqueta funcional de la API es 0.7.0; no se ha creado una nueva release GitHub para esta regularización.

## Evidencia técnica y límites

- 62fbcba: sesiones, permisos, estudiantes y matrículas persistentes.
- dfa0461: PostgreSQL aislado en el Mac servidor y respaldo verificado.
- f48fbc3: publicación HTTPS y cuentas de demostración por rol.
- 899aab6: asistencia, evaluaciones, calificaciones y anotaciones persistentes.
- Pruebas conservadas: 4 unitarias y 30 de integración en Docker / PostgreSQL 16, sin fallos; 14 recorridos en navegador local y 4 recorridos de lectura/login en HTTPS. No son pruebas ejecutadas nuevamente durante esta regularización.
- Evidencias: SIGAA/output/evidence/academic-docker-tests.json, academic-browser-tests.json y academic-hosted-tests.json.
- Alertas, justificaciones completas, cálculo oficial de promedios, carga, accesibilidad integral y validación escolar siguen pendientes. Un esquema SQL no acredita una función conectada.

## Operación de la demostración

La aplicación usa HTTPS mediante un túnel temporal Cloudflare y una base privada en el Mac servidor. Las cuentas existentes se mantienen; sus contraseñas no se incluyen en informes ni Git. El enlace puede cambiar y depende del servidor.

Revisar el manual de despliegue y los informes técnicos 10, 11 y 12 del Sprint 3. No restaurar una base ni ejecutar seeds de prueba sobre la demo pública. No se despliega código en este trabajo documental.

## Cierre

Entregar documentación no cierra el sprint. La release aceptada, validación escolar y aprobación del PO siguen pendientes donde no constan.

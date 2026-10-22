# Release candidate — v0.1.0-inception

Estado: candidata; no etiquetar como release final hasta aprobación del Product Owner.

## Contenido

- Línea base de producto y alcance MVP.
- Product Backlog inicial de 34 ítems.
- Artefactos Scrum de Sprint 0.
- Plan de 18 semanas y roadmap de sprints.
- Documento oficial de definición Fase 1.
- Arquitectura preliminar y ADR iniciales.
- Entorno Docker con aplicación web, API y PostgreSQL.
- Pruebas, scripts de verificación y documentación de ejecución.

## Ejecución

```bash
cd SIGAA
docker compose up --build --detach
sh scripts/verify-docker.sh
```

## Resultado validado

- `web`: healthy en puerto 8088.
- `api`: healthy en puerto 3000.
- `db`: healthy en red interna.
- API directa y proxy web responden correctamente.
- Base de datos `sigaa` accesible mediante la API.

## Limitaciones conocidas

- No existen todavía módulos académicos funcionales; la interfaz es una prueba de integración.
- No hay autenticación ni RBAC.
- No hay datos reales ni migraciones del dominio académico.
- La CI está disponible como plantilla, pero no activa por permisos del token.
- Falta validación con contraparte.

## Criterio de publicación

Después de la aprobación del Product Owner se podrá crear la etiqueta `v0.1.0-inception`. La etiqueta no implica cierre de PB-001 ni aceptación de funcionalidades futuras.

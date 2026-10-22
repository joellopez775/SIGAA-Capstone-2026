# Informe de tecnologías a utilizar

## Resumen

Se generó el informe técnico que propone y justifica la línea base tecnológica de SIGAA. El documento está redactado en futuro para responder a la formulación de entrega "qué tecnologías usaremos" y diferencia expresamente las decisiones aprobadas técnicamente de aquellas que aún requieren ratificación del equipo.

## Contenido documentado

- Frontend: React 19, Vite 8, CSS responsivo y migración gradual a TypeScript.
- Backend: Node.js 22, Express 5, API JSON, ESM y acceso PostgreSQL mediante `pg`.
- Persistencia: PostgreSQL 16, migraciones SQL versionadas, integridad e índices.
- Infraestructura: Docker Compose, imágenes Alpine, Nginx y healthchecks.
- Acceso seguro: Cloudflare Tunnel, Cloudflare Access, TLS y redes internas aisladas.
- Seguridad: RBAC, secretos fuera de Git, consultas parametrizadas, auditoría y headers web.
- Calidad: pruebas unitarias, integración, E2E, seguridad, rendimiento y GitHub Actions.
- Colaboración: Git/GitHub, Markdown, Mermaid/PlantUML, ADR y artefactos Scrum.
- Alternativas evaluadas, criterios de selección, plan de adopción y decisiones pendientes.

## Evidencia

- PDF: `output/pdf/Informe de Tecnologías a Utilizar - SIGAA.pdf`
- Extensión: 12 páginas A4.
- Fecha: 2026-08-26.
- Responsable documental: Equipo SIGAA.

## Verificación

El archivo fue renderizado completamente a imágenes y revisado visualmente página por página. También se verificaron metadatos, cantidad de páginas, extracción de texto, términos tecnológicos obligatorios y ausencia de páginas vacías.

## Estado

Informe generado y verificado. La línea base continúa aceptada técnicamente para el prototipo y pendiente de ratificación formal por los tres integrantes según ADR-001.

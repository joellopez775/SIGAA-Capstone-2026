# ADR-001 — Stack tecnológico del MVP

- Estado: aceptado técnicamente para el prototipo; ratificación del equipo pendiente.
- Fecha de decisión simulada: 2026-08-25.
- Historias relacionadas: PB-006, PB-007, PB-011 y PB-014.

## Contexto

SIGAA necesita una aplicación web demostrable en 18 semanas, con control de acceso, datos relacionales, pruebas automatizadas y despliegue reproducible. El equipo debe reducir la cantidad de tecnologías nuevas y privilegiar herramientas que pueda mantener durante el semestre.

## Decisión

- Frontend: React; migración gradual a TypeScript antes de implementar módulos productivos.
- Backend/API: Node.js con Express para el prototipo y la primera vertical funcional. Se reevaluará NestJS únicamente si la complejidad de módulos justifica el costo de migración.
- Base de datos: PostgreSQL.
- Autenticación: sesiones seguras o tokens de corta duración, definidos durante el diseño de seguridad.
- Pruebas: unitarias y de integración en el ecosistema seleccionado; pruebas end-to-end para flujos críticos.
- Infraestructura local: Docker y Docker Compose.
- Control de versiones y CI: GitHub y GitHub Actions.
- Diagramas y documentación: Mermaid/PlantUML y Markdown versionado.

## Razones

- TypeScript permite compartir lenguaje y modelos entre frontend y backend.
- PostgreSQL es adecuado para relaciones académicas e integridad de datos.
- Docker reduce diferencias entre ambientes y facilita la evaluación.
- GitHub concentra código, issues, evidencia y automatización.

## Alternativas evaluadas

| Alternativa | Ventaja | Costo/riesgo |
|---|---|---|
| Django + PostgreSQL | Administración y ORM maduros | Dos lenguajes si frontend usa TypeScript |
| Spring Boot + PostgreSQL | Estructura empresarial robusta | Mayor carga inicial y configuración |
| Supabase como backend | Velocidad de prototipo | Dependencia externa y menor control del backend |

## Consecuencias

- El equipo reduce el cambio tecnológico inmediato y aprovecha la base Express ya verificada.
- TypeScript se incorporará por módulo, evitando una reescritura completa durante Fase 1.
- Las variables se documentarán en `.env.example` sin secretos.
- Las migraciones serán versionadas.
- El diseño deberá separar interfaz, aplicación, dominio e infraestructura.
- La decisión se reconsiderará si una prueba técnica de Sprint 1 revela un bloqueo.

## Evidencia de la decisión

- Web React, API Express y PostgreSQL ejecutan juntos con Docker Compose.
- Existen pruebas automatizadas básicas de la API.
- El prototipo de Sprint 1 usa la misma base y no requiere servicios externos.
- La arquitectura documenta separación modular, RBAC, auditoría y migraciones.

## Condición de ratificación

La decisión queda técnicamente aceptada para continuar. Agustín Sorolla y Matías Martínez deben confirmar que pueden ejecutar y mantener el stack antes de declarar RET-05 cerrada.

## Criterios de aprobación utilizados

- Todos los integrantes pueden ejecutar un proyecto mínimo.
- Existe soporte para pruebas y migraciones.
- El despliegue funciona mediante Docker Compose.
- El stack permite implementar RBAC y auditoría.
- El docente no identifica una incompatibilidad con los resultados de aprendizaje.

# Informe de cierre — Sprint 0 Inception

## Resumen ejecutivo

Sprint 0 estableció la línea base de SIGAA y recuperó el atraso documental detectado durante la semana 2. Se generaron los artefactos de producto, Scrum, planificación académica y arquitectura preliminar; además se adelantó una base técnica ejecutable con Docker.

De los 18 puntos comprometidos, 13 están listos para aceptación del Product Owner. PB-001, de 5 puntos, no puede considerarse terminada porque no existe evidencia de validación con una contraparte educativa. El cumplimiento candidato del compromiso es 72,2%. PB-014, Docker reproducible, fue adelantada fuera del compromiso y se informa separadamente.

## Información del sprint

- Sprint: Sprint 0 — Inception.
- Periodo: 10 al 22 de agosto de 2026.
- Product Owner: Joel López.
- Equipo: Joel López, Agustín Sorolla y Matías Martínez.
- Sprint Goal: crear una línea base validable con visión, actores, MVP, backlog, DoD, riesgos, repositorio y evidencias.
- Rama: `fase-1-evidencias`.
- Release candidata: `v0.1.0-inception`.

## Trabajo realizado

### Producto y descubrimiento

- Product Vision y declaración de valor.
- Problema, usuarios, beneficiarios y cuatro pilares.
- Alcance MVP y exclusiones explícitas.
- Mapa de actores e Impact Mapping.
- Preguntas y criterios para validación externa.
- Métricas de éxito e hipótesis por validar.

### Gestión Scrum

- Product Backlog con 34 ítems, prioridad MoSCoW, puntos, sprint, responsable, dependencia y evidencia.
- Sprint Planning y Sprint Backlog de Sprint 0.
- Scrumboard, registro Daily e impedimentos.
- Definition of Done.
- Registro inicial de diez riesgos.
- Sprint Review, Retrospective preliminar y release candidate.
- Sprint Planning y backlog candidato de Sprint 1.

### Planificación académica

- Revisión del instructivo, cronograma, formularios y rúbrica.
- Documento de definición del Proyecto APT en plantilla institucional.
- Plan maestro con 11 hojas.
- Carta Gantt de 18 semanas.
- Matriz de entregables y cobertura de rúbrica.
- Infografía del cronograma y los sprints.
- Contenido grupal base de la evaluación formativa en español e inglés.

### Diseño técnico

- ADR-001 de stack tecnológico propuesto.
- ADR-002 de entorno Docker aceptado.
- Arquitectura preliminar de contenedores.
- Módulos, modelo conceptual y secuencia principal de alertas.
- Requisitos no funcionales iniciales.

### Base ejecutable adelantada

- Aplicación React/Vite servida por Nginx.
- API Node.js.
- PostgreSQL 16 con inicialización y volumen persistente.
- Dockerfiles y Docker Compose.
- Healthchecks, proxy interno y variables configurables.
- Scripts de verificación para shell y PowerShell.
- Plantilla de GitHub Actions.

## Evidencia y calidad

- Commits base: `1e88b0c` y `6a6b62e`.
- Archivos versionados de SIGAA antes del cierre: 51.
- Documentos Markdown antes del cierre: 22.
- Pruebas API: 3 aprobadas, 0 fallidas.
- Build web: aprobado.
- Servicios Docker: 3 de 3 saludables.
- Auditoría npm: 0 vulnerabilidades reportadas en la ejecución realizada.
- Revisión visual: interfaz operativa y conexión con base `sigaa` confirmada.

## Cumplimiento del compromiso

| Historia | Puntos | Estado propuesto | Observación |
|---|---:|---|---|
| PB-001 | 5 | No terminada | Falta validación externa; arrastrar a Sprint 1 |
| PB-002 | 3 | Lista para aceptar | Product Vision y cuatro pilares disponibles |
| PB-003 | 5 | Lista para aceptar | Backlog documentado y planificado |
| PB-004 | 2 | Lista para aceptar | DoD versionada |
| PB-005 | 3 | Lista para aceptar | Repositorio, README y trazabilidad publicados |

## Desviaciones y deuda de proceso

- No existe burndown real porque no se registraron puntos diariamente desde el inicio.
- Solo existe una Daily consolidada.
- La retrospectiva requiere ratificación de todo el equipo.
- Falta validación de una contraparte educativa.
- Faltan RUT, docente, sección y reflexiones individuales.
- Scrum Master y responsabilidades técnicas no están ratificados.
- La CI no está activa porque el token de GitHub no posee permiso `workflow`.

## Elementos que pasan a Sprint 1

- PB-001: validación de problema, usuarios y reglas.
- Datos formales y trabajo individual de Fase 1.
- Ratificación de roles y ADR-001.
- Activación de CI.
- Registro Daily y burndown desde el primer día.
- Arquitectura, ER, UML, prototipo y presentación de Fase 1.

## Evaluación del Sprint Goal

Parcialmente logrado. La línea base validable existe y está publicada; la validación externa que convertiría esa base en una línea base validada continúa pendiente.

## Recomendación al Product Owner

Aprobar el cierre condicionado de Sprint 0, aceptando PB-002, PB-003, PB-004 y PB-005; devolver PB-001 al Product Backlog; aceptar PB-014 como trabajo adelantado sin incorporarla a la velocidad comprometida; y autorizar la transición a Sprint 1 con las acciones RET-01 a RET-07.

El sprint no se marcará como cerrado ni se creará la etiqueta `v0.1.0-inception` hasta recibir la decisión explícita del Product Owner.

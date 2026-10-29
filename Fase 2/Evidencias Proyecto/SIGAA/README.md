# SIGAA — Sistema Integral de Gestión Académica y Alertas Tempranas

Proyecto Capstone 2026 de Ingeniería en Informática, sede Plaza Vespucio.

## Inicio rápido con Docker

El único requisito de ejecución es Docker Desktop o Docker Engine con Compose.

```bash
cd "Fase 2/Evidencias Proyecto/SIGAA"
cp .env.example .env
# Asigna POSTGRES_PASSWORD en .env antes de continuar.
docker compose up --build
```

- Aplicación: <http://localhost:8088>
- API: <http://localhost:3000/health>
- Diagnóstico de base de datos: <http://localhost:3000/db-health>

La guía completa está en [`docs/06-docker-entorno.md`](docs/06-docker-entorno.md).
El procedimiento para el equipo y el despliegue aislado está en
[`docs/07-manual-equipo-y-servidor-seguro.md`](docs/07-manual-equipo-y-servidor-seguro.md).

Para comprobar los servicios después de levantarlos:

```bash
sh scripts/verify-docker.sh
```

## Acceso real y migración del Sprint 3

El portal usa cuentas PostgreSQL, contraseñas con scrypt y sesiones HttpOnly.
Las cuentas y cabeceras de demostración anteriores ya no conceden acceso.
La primera instalación no crea usuarios ni contraseñas por defecto.

Lee el [informe y manual del Sprint 3](<output/pdf/Sprint 3 - Implementación real y verificación.pdf>)
para crear la primera cuenta mediante `npm run user:create`, generar datos
sintéticos opcionales o actualizar una base existente con la migración **007**.
No reinicialices volúmenes ni vuelvas a ejecutar la antigua migración 003.

Configura `APP_ORIGIN` con el origen exacto del navegador. En producción es
obligatorio HTTPS. El rol se obtiene de la sesión del servidor: administración
gestiona estudiantes/matrículas; docentes consultan su alcance y estudiantes solo
sus datos. El cambio de contraseña y cierre global están en **Seguridad**.

El portal operativo es `apps/web/src/SecureApp.jsx`. El antiguo `App.jsx` y
`prototype-data.js` se conservan como referencia del prototipo, sin conexión al
servidor operativo. Las interfaces completas de los módulos siguientes deben
integrarse con la API real: no se presentan datos inventados como productivos.

Pruebas independientes (no usan el volumen de desarrollo):

```bash
docker compose -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from api-tests
docker compose -f compose.test.yaml down
```

La plantilla de integración continua está en `ci/sigaa-ci.yml.example`. Para activarla se debe copiar a `.github/workflows/sigaa-ci.yml` usando una credencial de GitHub con permiso `workflow`.

## Estado vigente del código: API 0.9.1 · Sprint 5

Corte: 28-10-2026. Casos, apoderados y ficha integral se complementan con avisos
internos persistentes, asignaturas vigentes y calendario propio del estudiante.
El docente puede publicar o retirar clases programadas sin registrar asistencia.
El acceso se verifica en la API por identidad, rol y curso vigente.

- [Avance, manual, migración y pruebas 0.9.1](<output/pdf/Avance de desarrollo Sprint 5 - SIGAA.pdf>).
- [UML de los flujos persistentes](<output/pdf/UML de flujos persistentes - SIGAA.pdf>).
- Evidencia actual: `output/evidence/sprint-5-completion/`.
- [Antecedentes 0.9.0 del Sprint 5](<../Gestión Scrum SIGAA/PDF/02 Sprints/Sprint 5/>).

Validación: 6 unitarias y 66 de integración en Docker con PostgreSQL 16;
27 recorridos Chromium (8 portal/avisos, 8 seguimiento, 11 operación escolar),
compilación web, instalación Docker nueva y persistencia de cuentas/sesiones
tras reiniciar base y API. Nginx renueva la resolución del servicio `api` para
recuperarse de cambios de IP. Pruebas aisladas con datos ficticios.

SCRUM-35, SCRUM-36, SCRUM-48, SCRUM-37, SCRUM-51 y SCRUM-21 se presentan para
revisión. SCRUM-52 mantiene pendiente el ensayo del equipo y HTTPS desde varios
dispositivos. No se acredita aceptación, integración a main ni despliegue 0.9.1.
Los informes y la presentación anteriores conservan su corte; este incremento
actualiza sus pendientes técnicos sin atribuir reuniones o cierres nuevos.

Para una base escolar existente: respaldar y verificar restauración, revisar
apoderados principales duplicados, ejecutar `docker compose build api`,
`docker compose stop api`, `docker compose run --rm --no-deps api npm run migrate`
y luego `docker compose up -d --build`. El migrador aplica 007, 008, 009 y 010.
Esto corresponde a `compose.yaml`; un servidor con base externa requiere
adaptar la configuración y usar su rol migrador. Un rol SQL restringido necesita
SELECT, INSERT y UPDATE sobre `notificacion_interna`, además de sus permisos
previos. No subir credenciales ni respaldos al repositorio.

Nunca ejecutar 003 ni eliminar volúmenes para actualizar. La instalación nueva
aplica 001-010 automáticamente y no crea cuentas por defecto. La migración 009
se detiene ante varios apoderados principales históricos para revisión, sin
eliminar vínculos arbitrariamente. La 010 no genera avisos históricos.

## Antecedente desplegado: API 0.8.0

Código a9b6f65, desplegado el 15-10-2026 con PostgreSQL 16 y HTTPS. Incluye
administración escolar, tres reglas configurables, bandeja con historial y
justificaciones de Inspectoría, además de los flujos académicos y acceso seguro.
Guía, migración, límites y pruebas en
[Implementación 0.8.0](<../Gestión Scrum SIGAA/PDF/03 Implementación/Implementación 0.8.0 - Estructura alertas e Inspectoría.pdf>).

Pruebas del corte histórico 0.8.0: 4 unitarias + 44 integración en Docker, 25 recorridos locales y
8 HTTPS. Evidencia en `output/evidence/operations-*.json`. Las historias quedan
en revisión del PO; no se han cerrado los sprints ni simulado ceremonias.

## Antecedente: recuperación de Sprint 3

Al 15 de octubre de 2026 se regulariza técnicamente el Sprint 3: autenticación,
permisos y persistencia de estudiantes/matrículas implementados y probados con
PostgreSQL real. Evidencia reproducible en `output/evidence/sprint-3/`.
La aceptación del PO y la instalación/verificación en el servidor siguen siendo
pasos separados. Docker Desktop no estuvo disponible para ejecutar contenedores
en esta verificación local; el informe especifica versiones y cobertura.
No se altera la planificación ni se inventan ceremonias del Sprint 4.

Product Owner confirmado: Joel López. Los demás roles continúan propuestos hasta ratificación del equipo.

## Entregables iniciales

- `entregables/fase-1/1.5_Definicion_Proyecto_APT_SIGAA.docx`: definición del proyecto en la plantilla oficial.
- `entregables/fase-1/Presentacion_SIGAA_Fase_1_Sprint1.pptx`: presentación editable del avance y decisiones solicitadas al Product Owner.
- `entregables/gestion/Plan_Maestro_Scrum_SIGAA.xlsx`: calendario oficial, roadmap de sprints, Product Backlog, carta Gantt, matriz de entregables, cobertura de rúbrica, RACI, riesgos, Definition of Done y plantilla de burndown.
- `entregables/gestion/Cronograma_Sprints_SIGAA_2026.png`: infografía del cronograma y los sprints.
- `output/pdf/Manual_Instalacion_Desarrollo_y_Colaboracion_SIGAA.pdf`: manual ilustrado para instalar Docker, clonar, modificar, probar y subir cambios.

## Documentación viva

- [`docs/README.md`](docs/README.md): índice y reglas de trazabilidad.
- [`docs/01-product-vision.md`](docs/01-product-vision.md): visión, alcance y cuatro pilares.
- [`docs/02-actores-impact-mapping.md`](docs/02-actores-impact-mapping.md): actores, necesidades e Impact Mapping.
- [`docs/03-product-backlog.md`](docs/03-product-backlog.md): épicas y backlog priorizado.
- [`docs/04-riesgos.md`](docs/04-riesgos.md): riesgos, mitigaciones y disparadores.
- [`docs/05-git-y-evidencias.md`](docs/05-git-y-evidencias.md): flujo Git y estándar de evidencias.
- [`docs/06-docker-entorno.md`](docs/06-docker-entorno.md): ejecución reproducible y diagnóstico.
- [`docs/fase-1/01-formativa-fase-1.md`](docs/fase-1/01-formativa-fase-1.md): contenido base para la evaluación formativa.
- [`docs/scrum/definition-of-done.md`](docs/scrum/definition-of-done.md): Definition of Done.
- [`docs/scrum/sprint-0/`](docs/scrum/sprint-0/): expediente del Sprint 0.
- [`docs/scrum/sprint-0/07-informe-cierre.md`](docs/scrum/sprint-0/07-informe-cierre.md): informe auditado para decisión del Product Owner.
- [`docs/scrum/sprint-0/08-acta-aprobacion-po.md`](docs/scrum/sprint-0/08-acta-aprobacion-po.md): acta de aprobación pendiente.
- [`docs/scrum/sprint-1/`](docs/scrum/sprint-1/): Planning, backlog, tablero, Daily y burndown del Sprint 1.
- [`docs/scrum/sprint-2/`](docs/scrum/sprint-2/): Review y Retrospective preparadas para regularización y ratificación.
- [`docs/scrum/sprint-3/`](docs/scrum/sprint-3/): Planning, Sprint Backlog, estructura Jira y guía de Review/Retro vigentes.
- [`docs/defensa/01-arquitectura-metodologia-y-sprints.md`](docs/defensa/01-arquitectura-metodologia-y-sprints.md): defensa consolidada y estado real del proyecto.
- [`docs/design/00-arquitectura-preliminar.md`](docs/design/00-arquitectura-preliminar.md): diseño técnico inicial.
- [`docs/design/01-arquitectura-contenedores.md`](docs/design/01-arquitectura-contenedores.md): arquitectura de contenedores.
- [`docs/design/02-modelo-er-diccionario.md`](docs/design/02-modelo-er-diccionario.md): modelo lógico y diccionario de datos.
- [`docs/design/03-uml-casos-de-uso.md`](docs/design/03-uml-casos-de-uso.md): casos de uso y secuencia principal.
- [`docs/design/04-prototipo-navegable.md`](docs/design/04-prototipo-navegable.md): alcance y verificación del prototipo.
- [`docs/adr/ADR-001-stack-tecnologico.md`](docs/adr/ADR-001-stack-tecnologico.md): decisión tecnológica propuesta.
- [`docs/adr/ADR-002-entorno-docker.md`](docs/adr/ADR-002-entorno-docker.md): decisión de usar Docker Compose.
- [`docs/bitacora/2026-08-21-avance-inicial.md`](docs/bitacora/2026-08-21-avance-inicial.md): primer registro de avance.

## Alcance MVP propuesto

SIGAA centraliza estudiantes, matrículas, calificaciones y asistencia; aplica reglas configurables de riesgo; genera alertas explicables; asigna responsables; registra intervenciones; y muestra indicadores de seguimiento con control de acceso y auditoría.

Quedan fuera de la primera versión la analítica predictiva, integraciones avanzadas con plataformas externas y una aplicación móvil nativa.

## Cadencia

- Sprint 0: descubrimiento, visión, backlog, DoD, riesgos y repositorio.
- Sprints 1–7: incrementos quincenales alineados con los hitos Duoc.
- Release final: semanas 17–18, defensa, correcciones y cierre de evidencias.

Cada sprint debe dejar Sprint Planning, Sprint Backlog, tablero, seguimiento diario, impedimentos, burndown, pruebas, Review, release y Retrospective.

Todo cambio material debe actualizar una entrada de bitácora y enlazar la evidencia correspondiente. Una tarea no puede pasar a `Terminado` si la evidencia no está registrada.

## Datos pendientes

- RUT de cada integrante.
- Confirmación de la contraparte o establecimiento validador.
- Sección, docente y datos formales de portada que correspondan.
- Validación formal con una contraparte o usuarios representativos.
- Ratificación del stack tecnológico por el equipo.
- Ratificación de los roles propuestos: Joel (Product Owner/arquitectura), Agustín (Scrum Master/frontend-UX) y Matías (datos/calidad); los tres como Developers.

## Próximos documentos

1. Product Vision y cuatro pilares.
2. Análisis del caso, mapa de actores, mapa mental e Impact Mapping.
3. Épicas, historias de usuario, criterios de aceptación y Story Map.
4. Sprint 0 y Sprint 1: Planning, Sprint Backlog, tablero y evidencias.
5. Documento de diseño: arquitectura, ER, UML y requisitos no funcionales.
6. Plan de pruebas, manual técnico/de despliegue y manual de usuario.

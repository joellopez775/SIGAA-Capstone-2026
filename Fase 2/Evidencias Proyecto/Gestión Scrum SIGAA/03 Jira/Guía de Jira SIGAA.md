# Guía de Jira aplicada a SIGAA

Fecha de actualización: 24 de septiembre de 2026.

## Estado de implementación en Jira

- Sitio: <https://sigaa-duoc-2026.atlassian.net>
- Espacio: `SIGAA`
- Clave asignada por Jira: `SCRUM`
- Tablero: Scrum, con backlog y sprints habilitados.
- Flujo configurado: Pendiente -> Seleccionada -> En curso -> En revisión ->
  Terminada.
- Importación ejecutada el 24 de septiembre de 2026: 60 actividades creadas
  correctamente, compuestas por 8 épicas, 40 historias y 12 subtareas.
- Importación complementaria ejecutada el 24 de septiembre de 2026: 21 actividades
  creadas correctamente, compuestas por 1 épica documental y 20 tareas.
- Segunda regularización ejecutada el 24 de septiembre de 2026: 29 actividades
  creadas correctamente, compuestas por 1 épica, 5 backlogs, 21 Daily y 2
  retrospectivas. Todas ingresaron en estado `En revisión`.
- Jira se adopta operativamente desde el Sprint 3; no se reconstruyen métricas
  ficticias para los sprints anteriores.

Esta guía convierte la planificación Scrum documentada en el repositorio en una
forma de trabajo concreta dentro de Jira. Jira será el tablero operativo; GitHub
seguirá siendo la fuente del código y este repositorio conservará las actas,
decisiones y evidencias formales.

## 1. Configuración recomendada

Crear un proyecto de **Jira Software** con estos datos:

| Configuración | Valor |
|---|---|
| Plantilla | Scrum |
| Nombre | SIGAA |
| Clave | SIGAA |
| Administración | Gestionado por el equipo |
| Funciones activas | Backlog, Sprints, Informes y estimación |
| Estimación | Story points |

El proyecto gestionado por el equipo es suficiente para tres integrantes y
permite adaptar el tablero sin depender constantemente de un administrador de
Jira. Para conservar automáticamente las relaciones épica-historia-subtarea del
CSV se necesita usar la importación administrativa indicada en la sección 4.

### Integrantes

- Joel López: Product Owner y desarrollador.
- Agustín: desarrollador.
- Matías: desarrollador.
- Los tres participan en programación, pruebas, documentación, Review y
  Retrospective.

Jira necesita la cuenta Atlassian real de cada integrante para asignar tarjetas.
El CSV no incluye correos porque todavía no están confirmados. Después de invitar
al equipo se asignan las tarjetas sugeridas del Sprint 3.

## 2. Tipos de trabajo

| Tipo en Jira | Uso en SIGAA | Ejemplo |
|---|---|---|
| Epic | Resultado grande que atraviesa varios sprints | Seguridad y plataforma |
| Story | Necesidad que entrega valor a un usuario | PB-011 Autenticación segura |
| Task | Trabajo técnico o documental independiente | Preparar migración de datos |
| Sub-task | Parte concreta de una historia | Implementar hash de contraseñas |
| Bug | Comportamiento incorrecto comprobable | Un estudiante visualiza otro perfil |

Las historias mantienen el identificador `PB-###` en el resumen para conservar
la trazabilidad con `docs/03-product-backlog.md`.

## 3. Flujo del tablero

Configurar estas columnas, de izquierda a derecha:

1. **Pendiente:** existe en el Product Backlog, pero no está comprometida.
2. **Seleccionada:** quedó comprometida en el Sprint Planning y puede comenzar.
3. **En curso:** alguien está trabajando activamente en ella.
4. **En revisión:** código, prueba y documentación esperan revisión o aceptación.
5. **Terminada:** cumple la Definition of Done y fue aceptada cuando corresponde.

Reglas del equipo:

- Máximo tres historias simultáneamente en `En curso`, una por integrante.
- Una historia no entra en `Terminada` sin evidencia de prueba y vínculo al
  commit o pull request.
- La última columna debe estar asociada a la categoría verde `Done`; Jira usa
  esa columna para calcular Sprint Report, Burndown y velocidad.
- Un bloqueo se indica con la bandera de impedimento y un comentario que explique
  qué falta, quién puede resolverlo y desde cuándo existe.

## 4. Importar el backlog preparado

Archivo preparado:

`entregables/gestion/jira/SIGAA Backlog para Jira.csv`

La primera importación ya fue realizada en el sitio indicado arriba. El archivo
se conserva como evidencia, respaldo y referencia para futuras instalaciones;
no debe volver a importarse en el mismo espacio porque duplicaría las tarjetas.

La carga complementaria de gestión ágil se conserva en
`entregables/gestion/jira/SIGAA Entregables Scrum para Jira.csv`. Contiene una
épica y 20 actividades documentales. Fue importada el 24 de septiembre de 2026
y no debe volver a cargarse en el mismo espacio porque generaría duplicados.

### Opción recomendada: conservar jerarquía

Una persona con permisos administrativos debe ingresar a:

`Configuración de Jira -> Sistema -> Importación de sistema externo -> CSV`.

Durante el asistente:

1. Seleccionar UTF-8 y la coma como separador.
2. Elegir el proyecto SIGAA existente.
3. Mapear `Work item ID` con el identificador de elemento de trabajo.
4. Mapear `Parent` con Padre.
5. Mapear `Work type`, `Summary`, `Description`, `Priority`, `Status`,
   `Story Points` y `Labels` con sus campos equivalentes.
6. Usar `Sprint` como referencia, pero no mapearlo en la primera importación. Así
   no se inventa actividad histórica ni se comprometen automáticamente historias
   que solo estaban proyectadas para un sprint. Después se crea el Sprint 3 y se
   mueven únicamente PB-011, PB-012, PB-015 y PB-016.
7. Validar antes de importar y corregir cualquier valor no reconocido.

Las filas padre están ubicadas antes que sus hijas, requisito necesario para
reconstruir la jerarquía.

### Opción sin permisos administrativos

En `Filtros -> Buscar elementos de trabajo -> Más acciones -> Importar desde
CSV`, importar únicamente historias y tareas. Este importador permite creación
masiva, pero puede no conservar jerarquías de varios niveles. En ese caso, crear
las ocho épicas manualmente y asociar cada historia desde el campo `Parent`.

## 5. Sprints de SIGAA

Crear los sprints en el Backlog y respetar las fechas del cronograma oficial.
La situación vigente es:

| Sprint | Estado al 24-09-2026 | Objetivo |
|---|---|---|
| Sprint 0 | Cierre documentado; revisar el acta de aprobación del PO | Definir visión, backlog, riesgos y forma de trabajo |
| Sprint 1 | Ejecutado; existen elementos en revisión | Diseñar arquitectura, datos y prototipo navegable |
| Sprint 2 | Finalizado con trabajo arrastrado | Preparar base técnica de seguridad y plataforma |
| Sprint 3 | Activo, 21-09 al 03-10 | Autenticación, permisos y persistencia escolar real |
| Sprint 4 | Futuro | Asistencia, reglas de alerta y avance de Fase 2 |
| Sprint 5 | Futuro | Seguimiento e intervenciones |
| Sprint 6 | Futuro | Analítica, auditoría y pruebas integrales |
| Sprint 7 | Futuro | Manuales, entrega final y preparación de defensa |

Solo debe mantenerse un sprint activo. Los sprints futuros pueden prepararse,
pero no iniciarse hasta cerrar el vigente. Jira se adopta como tablero operativo
desde Sprint 3; los sprints 0 a 2 permanecen como registro documental en GitHub y
no deben reconstruirse artificialmente porque eso distorsionaría los informes.

## 6. Sprint 3 aplicado

Objetivo: permitir que un usuario autenticado opere únicamente dentro de su rol
y que estudiantes y matrículas se lean y escriban realmente en PostgreSQL.

| Historia | Puntos | Responsable sugerido | Resultado comprobable |
|---|---:|---|---|
| PB-011 Autenticación segura | 8 | Joel | Sesiones seguras, contraseñas con hash y cierre de sesión |
| PB-012 Roles y permisos | 8 | Agustín | Profesor y estudiante solo acceden a lo autorizado |
| PB-015 Gestión de estudiantes | 8 | Matías | Altas y cambios persisten en PostgreSQL |
| PB-016 Matrículas | 5 | Equipo | Matrícula válida, sin duplicados y persistente |

La historia compartida PB-016 se divide en subtareas para que los tres aporten.
La responsabilidad indicada organiza el trabajo; la revisión cruzada sigue
siendo obligatoria.

## 7. Contenido mínimo de cada tarjeta

### Historia

- Frase: `Como [rol], quiero [necesidad], para [beneficio]`.
- Criterios de aceptación verificables.
- Story points.
- Épica y sprint.
- Responsable.
- Dependencias y riesgos relevantes.

### Subtarea

- Acción concreta, resultado esperado y forma de comprobarla.
- Responsable único.
- No asignar story points a subtareas para los informes del sprint; Jira calcula
  el Burndown con historias, tareas o bugs de nivel estándar.

### Bug

- Pasos para reproducir.
- Resultado actual y resultado esperado.
- Ambiente y evidencia.
- Severidad y relación con la historia afectada.

## 8. Relación con GitHub

Usar la clave que Jira genere en ramas, commits y pull requests:

```text
feature/SIGAA-123-autenticacion-segura
fix/SIGAA-145-bloqueo-acceso-estudiante
SIGAA-123: implementar expiracion de sesion
```

Cada pull request debe incluir:

- clave Jira;
- resumen del cambio;
- pruebas ejecutadas;
- capturas o evidencia cuando corresponda;
- actualización documental necesaria.

No guardar contraseñas, tokens, claves privadas ni secretos de Jira en tarjetas,
comentarios, commits o archivos versionados.

## 9. Rutina del equipo

### Inicio del sprint

1. El Product Owner ordena las historias por valor y urgencia.
2. El equipo revisa criterios, dependencias y capacidad.
3. Se define un objetivo único y se mueven las historias al sprint.
4. Cada historia se divide en subtareas y recibe responsable.
5. Se inicia el sprint con fecha de término y objetivo escritos en Jira.

### Durante el sprint

- Cada integrante actualiza sus tarjetas antes del Daily.
- El Daily responde: qué terminé, qué haré y qué me bloquea.
- Los cambios de alcance se comentan en Jira; no se agregan historias en silencio.
- Las evidencias se enlazan antes de mover el trabajo a revisión.

### Cierre

1. Revisar el Sprint Report y el Burndown.
2. En la Review, demostrar solo historias comprobables.
3. Joel acepta o rechaza cada historia como Product Owner.
4. Lo no terminado vuelve al backlog y se replanifica; no se marca artificialmente
   como terminado.
5. Registrar la Retrospective con una mejora concreta para el sprint siguiente.

## 10. Filtros útiles

Reemplazar `SIGAA` si Jira asigna otra clave:

```jql
project = SIGAA ORDER BY Rank ASC
project = SIGAA AND sprint in openSprints() ORDER BY Rank ASC
project = SIGAA AND sprint in openSprints() AND statusCategory != Done
project = SIGAA AND assignee = currentUser() AND statusCategory != Done
project = SIGAA AND issuetype = Bug AND statusCategory != Done
project = SIGAA AND labels = sprint-3 ORDER BY priority DESC
```

## 11. Indicadores para el informe Capstone

- Burndown del Sprint 3.
- Puntos comprometidos y puntos terminados.
- Historias aceptadas y arrastradas.
- Bugs abiertos y resueltos.
- Cambios de alcance ocurridos durante el sprint.
- Evidencias de Sprint Review y mejora acordada en Retrospective.

Jira entrega estos indicadores si las tarjetas se actualizan diariamente y la
columna final está configurada correctamente.

## 12. Fuentes oficiales consultadas

- Atlassian, *Use your Scrum backlog*.
- Atlassian, *Create work items using the CSV importer*.
- Atlassian, *Import data from a CSV file*.
- Atlassian, *Configure columns*.
- Atlassian, *What is the sprint burndown report?*.
- Atlassian, *Generate a report*.

Consulta realizada el 24 de septiembre de 2026. Enlaces directos disponibles en
la bitácora de esta implementación.

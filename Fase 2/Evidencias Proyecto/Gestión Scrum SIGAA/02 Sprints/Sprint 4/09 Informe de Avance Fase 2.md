# Informe de avance del Proyecto APT - Fase 2

SIGAA - Gestión académica para colegios y liceos. Corte: 15 de octubre de 2026.

Equipo: Joel López, Agustín Sorolla y Matías Martínez. Product Owner: Joel López. Elaboración documental basada en repositorio y Jira; pendiente de revisión del equipo y entrega académica. No consta recepción ni evaluación del docente.

## 1. Resumen del avance del proyecto

SIGAA busca centralizar información académica y facilitar detección y seguimiento de riesgos mediante reglas explicables. La implementación vigente dispone de acceso por roles, estudiantes y matrículas persistentes, y funciones de asistencia, evaluaciones, notas y anotaciones conectadas a PostgreSQL. La interfaz distingue docente y estudiante y está desplegada para demostración con HTTPS.

La actualización a9b6f65 incorpora administración escolar, alertas configurables y justificaciones persistentes. No se afirma que el MVP completo esté terminado: casos de seguimiento, avisos e indicadores avanzados todavía necesitan integración o desarrollo. Las cuentas son de demostración y no autorizan tratar datos reales de estudiantes.

### Objetivos y ajustes

| Objetivo | Resultado comprobable | Estado y límite |
|---|---|---|
| Acceso seguro por identidad y rol | Sesiones persistentes, hash, expiración, revocación, permisos y CSRF | Implementado y probado; historias en revisión |
| Centralizar estudiantes y matrículas | Escritura, consultas, validaciones, auditoría y concurrencia en PostgreSQL | Implementado; aceptación pendiente |
| Registrar actividad académica | Asistencia por clase, evaluaciones, publicación de notas y anotaciones con visibilidad | Implementado en 899aab6; revisión pendiente |
| Detectar riesgos explicables | Tres reglas versionadas, datos persistentes, explicación y deduplicación | Implementado y probado; validación escolar y aceptación pendientes |
| Coordinar apoyo y seguimiento | Bandeja con responsables/estados e Inspectoría con actualización de asistencia | Alcance S4 implementado; casos e intervenciones de S5 pendientes |

Se mantiene el objetivo escolar. Se priorizó completar seguridad y persistencia antes de ampliar funciones. No se refecha el trabajo técnico adelantado ni se atribuye a una ceremonia histórica. El desarrollo formal se enmarca en Fase 2 desde el 31 de agosto, según el cronograma ya adoptado.

### Metodología y ajustes

Se mantiene Scrum adaptado al equipo de tres integrantes. Jira conserva tareas e historias y Git guarda código, documentos y evidencias. La regularización identifica desviaciones del proceso: Daily no acreditadas, aprobaciones pendientes y dos sprints activos simultáneamente. La existencia de documentos no demuestra que los eventos Scrum hayan ocurrido.

Los Sprints 3 y 4 siguen activos en Jira. El Sprint 3 tenía término configurado el 8 de octubre y su implementación técnica consta el 15: existe retraso. El Sprint 4 tiene término configurado el 17 de octubre; su cierre no se anticipa. El PO deberá acordar recuperación y cierre, sin fabricar fechas.

### Evidencias de avance y calidad

Actualización 0.8.0, posterior al corte documental anterior:

- a9b6f65: estructura escolar, tres reglas configurables, bandeja e Inspectoría conectadas a PostgreSQL; API 0.8.0.
- Pruebas ejecutadas el 15-10: 4 unitarias y 44 de integración aprobadas en Docker/PostgreSQL 16; 11 recorridos nuevos y 14 de regresión en Chromium local; 8 recorridos HTTPS (cuatro roles, escritorio y móvil).
- Evidencias: SIGAA/output/evidence/operations-docker-tests.json, operations-browser-tests.json, operations-regression-browser-tests.json, operations-hosted-tests.json y operations-academic-hosted-tests.json.
- Escrituras de prueba solo en bases aisladas. Despliegue real con respaldo previo y migración aditiva 008; sin seeds ni reinicialización.
- Los umbrales requieren validación escolar. El rendimiento es preventivo, no un promedio oficial. Tras notas/asistencia se pulsa Recalcular; cambios de regla y aprobación de justificación recalculan automáticamente.
- Carga, accesibilidad integral, otros navegadores, operación sostenida y aceptación del PO siguen pendientes.

Antecedentes: 62fbcba implementó seguridad; dfa0461 alojó la base privada; f48fbc3 publicó HTTPS; 899aab6 conectó la operación académica. Los informes técnicos del Sprint 3 conservan estos cortes. operations-* acredita las pruebas actuales; academic-* conserva su ejecución anterior. El inventario del respaldo se verificó, sin afirmar una restauración completa en esta entrega.

:::pagebreak

## 2. Monitoreo del plan de trabajo

Las áreas de competencia se relacionan con los módulos informados por el equipo; no se afirma que estas frases sean una transcripción oficial del perfil de egreso. Las duraciones son ventanas planificadas, no horas efectivamente trabajadas. Los focos individuales son propuestas por ratificar.

| Área de competencia | Actividad | Recursos | Ventana / duración | Responsable propuesto | Observación | Estado | Ajuste |
|---|---|---|---|---|---|---|---|
| Arquitectura de software | Actualizar arquitectura y límites | Diagramas, código y Docker | Revisión documental al 15-10 | Joel; revisión del equipo | Arquitectura actual distingue demo y funciones pendientes | Ajustada | Incorporar sesión, CSRF y túnel |
| Análisis y desarrollo de modelos de datos | Persistir estudiantes, matrícula y operación académica | PostgreSQL, SQL y pruebas | S3 y continuación al 15-10 | Matías; apoyo del equipo | Persistencia comprobada; aceptación pendiente | Con retraso | No atribuir entrega a septiembre |
| Programación de software | Conectar interfaz y API segura | React, Express y pruebas | S3 y S4, ventanas de dos semanas | Equipo | Datos propios por rol; flujos académicos disponibles | En curso | Priorizar integración real |
| Calidad de software | Verificar permisos y persistencia | Docker y navegador | Corte de pruebas 15-10 | Equipo | 48 pruebas API aprobadas y recorridos nuevos/regresión | En curso | Completar carga, accesibilidad y otros navegadores |
| Análisis y planificación de requerimientos | Validar alertas y flujos escolares | Contraparte, criterios y Jira | S4; validación sin fecha acordada | Agustín; apoyo del equipo | Umbrales aún son hipótesis | Con retraso | Acordar validación antes de aceptar reglas |
| Gestión de proyectos informáticos | Regularizar expediente y avance Fase 2 | Pauta docente, Jira, Git y PDF | Regularización 15-10 | Equipo; Joel revisa | No hay actas suficientes para cerrar eventos | Ajustada | Usar registros comprobables y pendientes explícitos |

### Estados de referencia en Jira

| Conjunto actual | Puntos | En curso | En revisión | Terminados |
|---|---:|---:|---:|---:|
| Sprint 2, id 3 | 13 | 0 | 13 | 0 |
| Sprint 3, id 2 | 29 | 0 | 29 | 0 |
| Sprint 4, id 37 | 34 | 0 | 34 | 0 |

La tabla cuenta puntos de historias actualmente asociadas, no subtareas ni capacidad histórica. Las 12 subtareas técnicas de Sprint 3 están terminadas, pero sus cuatro historias siguen en revisión. No se infiere porcentaje global del proyecto de estos conjuntos.

:::pagebreak

## 3. Ajustes a partir del monitoreo

### Facilitadores y dificultades

Docker y las migraciones facilitan reproducibilidad. Las pruebas aisladas permiten validar cambios sin alterar la base de la demo. La separación docente/estudiante permitió comprobar privacidad y alcance.

La interfaz avanzó antes que seguridad y persistencia, lo que obligó a una integración posterior. Los documentos quedaron desactualizados y algunos daban por terminado trabajo de prototipo. También faltan mediciones diarias y validación escolar. Se corrigieron los estados documentales y se conservaron las incertidumbres en vez de reconstruir una velocidad artificial.

### Actividades ajustadas o eliminadas

No se eliminan requisitos académicos. Se sustituye la simulación en memoria por operaciones persistentes en los módulos ya integrados. Se retira del informe la afirmación anterior de 29/34 puntos terminados y su proyección automática de cierre. Se mantienen los identificadores de Jira sin crear duplicados.

### Actividades no iniciadas o retrasadas

- Revisar y aceptar reglas, bandeja y justificaciones: SCRUM-32, SCRUM-33 y SCRUM-49 pasaron a En revisión el 15-10 tras la implementación y pruebas. La estructura escolar SCRUM-25 también pasó a En revisión.
- Casos de seguimiento y notificaciones: SCRUM-35 y SCRUM-37, pendientes. La ficha integral SCRUM-36 sigue en curso.
- Validación externa, acuerdos reales del equipo y decisiones de review: por registrar.
- Operación estable, respaldos periódicos, pruebas de carga y accesibilidad: pendientes.
- Entrega en Campus y retroalimentación docente: sin evidencia de recepción al corte.

Estrategia propuesta: revisar primero el incremento persistente con el PO, acordar responsables y alcance restante, planificar el alcance restante de Sprint 5 y actualizar evidencia junto con Jira. Las fechas de recuperación deberán acordarse con el equipo; no se inventan compromisos.

## 4. Conclusión y entrega

El proyecto cuenta con una base funcional real para demostración y evidencia técnica verificable. El avance documental queda regularizado, pero las aprobaciones, validación escolar y funciones restantes no se declaran completas. SCRUM-34 permanece En revisión hasta la decisión del PO y el registro de la entrega correspondiente.

Adjuntos del expediente: mapas y producto en Gestión Scrum SIGAA/PDF/01 Producto; Sprints 2 y 3 en Gestión Scrum SIGAA/PDF/02 Sprints; Sprint 4 en SIGAA/output/pdf/Sprint 4; evidencia técnica vigente en Gestión Scrum SIGAA/PDF/03 Implementación. Las contraseñas y respaldos privados quedan fuera del repositorio.

# Sprint Retrospective 0

Estado: análisis preliminar basado en evidencia; pendiente de ratificación del equipo.

## Lo que funcionó

- Se recuperó rápidamente una línea base documental que no existía.
- Los artefactos se mantuvieron versionados y enlazados.
- El alcance se acotó explícitamente como MVP.
- Docker permitió validar web, API y PostgreSQL en un mismo entorno.
- Las pruebas y healthchecks detectaron un conflicto real de puerto antes de entregar el entorno.
- Los datos no confirmados fueron rotulados como pendientes y no se inventaron validaciones.

## Lo que dificultó el trabajo

- Inicio tardío del proceso documental.
- Falta de contraparte educativa confirmada.
- Datos formales y reflexiones individuales incompletos.
- Roles de Scrum Master y responsables técnicos sin ratificar.
- No existió registro Daily desde el inicio.
- No se capturaron datos diarios para un burndown real.
- El token de GitHub no permite activar workflows; la plantilla CI quedó pendiente.

## Aprendizajes

- La evidencia debe generarse durante el trabajo y formar parte de la DoD.
- El trabajo adelantado debe mostrarse por separado del compromiso del sprint.
- Un documento generado no equivale a una historia aceptada.
- Un burndown retroactivo sin datos reales sería engañoso; el próximo sprint debe iniciar su medición el primer día.
- Los puertos y dependencias deben ser configurables para reducir fallos entre equipos.

## Acciones de mejora para Sprint 1

| ID | Acción | Responsable | Fecha objetivo | Criterio de cierre |
|---|---|---|---|---|
| RET-01 | Registrar Daily breve por cada día de trabajo | Scrum Master por confirmar | Desde 24-08 | Entrada fechada y enlazada |
| RET-02 | Iniciar burndown con puntos reales el primer día | Scrum Master por confirmar | 24-08 | Línea base y actualización diaria |
| RET-03 | Validar problema, reglas y usuarios con contraparte | Product Owner | 26-08 | Minuta o correo de validación |
| RET-04 | Completar RUT, docente, sección y reflexiones | Cada integrante | 24-08 | Plantillas completas |
| RET-05 | Ratificar roles y ADR-001 | Equipo | 24-08 | Acta de acuerdo |
| RET-06 | Cerrar cada sesión con evidencia y commit | Equipo | Continuo | Historia enlazada al commit |
| RET-07 | Activar CI con credencial `workflow` | Product Owner/administrador | Sprint 1 | Workflow ejecutado correctamente |

## Ratificación

Joel López puede aprobar las acciones desde su rol de Product Owner, pero la retrospectiva del equipo debe ser revisada por Agustín Sorolla y Matías Martínez. Sus observaciones se agregarán sin reemplazar este registro.

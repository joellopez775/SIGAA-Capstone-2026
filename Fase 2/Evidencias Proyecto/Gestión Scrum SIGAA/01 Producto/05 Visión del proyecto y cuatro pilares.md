# Product Vision — SIGAA

Estado: dominio escolar confirmado por el Product Owner; pendiente validación externa.

## Declaración de visión

Para equipos directivos, UTP, docentes e inspectoría de establecimientos educacionales que necesitan detectar y gestionar oportunamente el riesgo académico, SIGAA es una plataforma web de gestión y alertas tempranas que centraliza estudiantes, matrículas, calificaciones y asistencia; aplica reglas de riesgo explicables; asigna responsables; y conserva evidencia del seguimiento.

A diferencia del uso fragmentado de planillas y sistemas aislados, SIGAA integra los datos y las acciones posteriores a una alerta en un flujo trazable, controlado por roles y reproducible mediante un despliegue documentado.

## Problema

La información académica suele estar distribuida entre planillas, correos y plataformas separadas. Esta fragmentación dificulta:

- Detectar a tiempo el deterioro de notas o asistencia.
- Comprender por qué un estudiante fue marcado en riesgo.
- Priorizar casos según su severidad.
- Asignar responsables y verificar acciones realizadas.
- Auditar cambios y medir la efectividad del seguimiento.

## Usuarios y beneficiarios

| Grupo | Necesidad principal | Valor esperado |
|---|---|---|
| Dirección y UTP | Visión consolidada y priorización | Indicadores y casos críticos visibles |
| Profesor jefe | Seguimiento integral de su curso | Alertas e intervenciones comprensibles |
| Profesor de asignatura | Registro de notas y asistencia | Menor duplicación y permisos acotados |
| Inspectoría/orientación | Asistencia y seguimiento coordinado | Justificaciones, responsables e historial |
| Administración | Control de usuarios y estructura escolar | Datos consistentes y permisos definidos |
| Estudiantes y apoderados | Consulta y apoyo oportuno | Información clara antes de una situación crítica |

## Cuatro pilares

### 1. Centralización confiable

Una fuente única para estudiantes, estructura académica, matrículas, notas y asistencia, con validaciones y trazabilidad.

### 2. Alertas explicables

Las alertas se generan mediante reglas configurables y muestran los datos que justifican su activación. La primera versión no depende de modelos predictivos opacos.

### 3. Seguimiento accionable

Cada caso puede asignarse, comentarse, intervenirse y cerrarse con responsable, fecha, resultado e historial.

### 4. Seguridad y evidencia

Acceso por roles, auditoría de cambios sensibles, datos sintéticos o anonimizados y evidencia verificable en GitHub.

## Objetivo del producto

Desarrollar y validar durante el semestre 2026 un MVP web que centralice información académica, genere alertas tempranas explicables y permita gestionar su seguimiento de forma segura, trazable y reproducible.

## Alcance MVP

Incluye:

- Autenticación y control de acceso por roles.
- Gestión de establecimiento, años escolares, niveles, cursos y asignaturas.
- Gestión de estudiantes, apoderados y matrículas anuales por curso.
- Registro o importación controlada de calificaciones y asistencia.
- Tres reglas configurables de alerta.
- Bandeja priorizada de alertas.
- Asignación, intervención, seguimiento y cierre de casos.
- Ficha integral del estudiante.
- Dashboard básico y reportes principales.
- Auditoría, pruebas y despliegue con Docker.

No incluye en la primera versión:

- Predicción automatizada del riesgo.
- Aplicación móvil nativa.
- Integraciones productivas con plataformas ministeriales o institucionales.
- Gestión financiera, biblioteca o recursos humanos.
- Operación multiinstitución avanzada.

## Métricas de éxito propuestas

| Métrica | Meta inicial | Forma de verificación |
|---|---:|---|
| Flujo académico crítico completado | 100% | Prueba end-to-end con datos sintéticos |
| Alertas con explicación visible | 100% | Casos de prueba de las tres reglas |
| Casos con responsable e historial | 100% | Consulta de auditoría y seguimiento |
| Historias Must aceptadas | ≥ 85% de puntos | Product Backlog y Sprint Reviews |
| Defectos críticos abiertos al cierre | 0 | Registro de defectos |
| Despliegue reproducible | 1 comando documentado | Prueba en ambiente limpio |

## Hipótesis por validar

- La contraparte necesita alertas basadas inicialmente en notas y asistencia.
- Tres roles operativos son suficientes para el MVP.
- La explicación de las reglas mejora la confianza y la capacidad de actuar.
- Los datos sintéticos permiten validar el flujo sin exponer datos personales.

## Criterio de validación de la visión

La visión se considera validada cuando el equipo, el docente y una contraparte representativa confirman el problema, los usuarios, el alcance MVP y al menos tres indicadores de éxito. Debe quedar una minuta o correo como evidencia.

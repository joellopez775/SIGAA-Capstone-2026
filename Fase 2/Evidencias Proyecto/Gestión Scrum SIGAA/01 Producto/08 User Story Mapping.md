# User Story Mapping

## Objetivo del usuario

Detectar oportunamente riesgos académicos y coordinar acciones de apoyo con
información escolar confiable, autorizada y trazable.

## Mapa por actividades

| Actividad del usuario | Preparar acceso | Organizar contexto escolar | Registrar operación | Detectar riesgo | Actuar y seguir | Evaluar resultados |
|---|---|---|---|---|---|---|
| Historias base | PB-011, PB-012, PB-014 | PB-013, PB-015, PB-016, PB-036 | PB-017, PB-019, PB-037, PB-038, PB-039 | PB-020, PB-021 | PB-023, PB-024, PB-025 | PB-026, PB-027, PB-028, PB-029 |
| Evidencia | Sesión y permisos | Cursos y matrículas persistentes | Notas, asistencia y anotaciones | Alerta con regla explicable | Caso, intervención y aviso | Indicadores, reporte y auditoría |

## Cortes de entrega

### Release 1 - Base operativa segura

- PB-011 Autenticación segura.
- PB-012 Roles y permisos.
- PB-013 Estructura escolar.
- PB-014 Docker reproducible.
- PB-015 Gestión de estudiantes.
- PB-016 Matrículas.

Resultado: usuarios autenticados operan sobre datos escolares persistentes y
solo dentro de su alcance.

### Release 2 - Gestión académica y alertas

- PB-017 Evaluaciones y calificaciones.
- PB-019 Registro de asistencia.
- PB-020 Reglas explicables.
- PB-021 Bandeja de alertas.
- PB-022 Avance Fase 2.
- PB-037 Justificaciones.
- PB-038 Modelo docente.
- PB-039 Modelo estudiante.

Resultado: se registran hechos académicos y se generan alertas comprensibles.

### Release 3 - Seguimiento y cierre

- PB-023 a PB-034.

Resultado: alertas se transforman en acciones trazables, indicadores, manuales,
pruebas y defensa final.

## Dependencias principales

1. PB-011 y PB-012 anteceden cualquier dato sensible.
2. PB-013 y PB-016 entregan el curso y periodo necesarios para notas y asistencia.
3. PB-017 y PB-019 alimentan PB-020.
4. PB-020 alimenta PB-021 y PB-023.
5. PB-023 alimenta ficha integral, notificaciones e indicadores.

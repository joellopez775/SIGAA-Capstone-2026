# Bitácora - portal del estudiante

Fecha simulada: 28 de agosto de 2026.

## Necesidad detectada

La vista existente correspondía a coordinación o docencia. Se requería una
experiencia personal para que cada estudiante consulte su situación académica
sin acceder a información de terceros ni a herramientas de gestión interna.

## Incremento construido

- Selector de experiencia en el acceso demostrativo.
- Portal personal de Camila Soto con identidad y avance curricular.
- Resumen de promedio, asistencia y créditos inscritos.
- Cuatro asignaturas con promedios y calificaciones parciales.
- Tabla de últimas notas y ponderaciones.
- Agenda de evaluaciones, entregas y presentaciones.
- Mensaje de acompañamiento académico.
- Alternancia controlada entre vista coordinación y vista estudiante.

## Verificación

| Control | Resultado |
|---|---|
| Build web | Correcto |
| Pruebas API | 9/9 aprobadas después de incorporar login por roles |
| Docker Compose | Servicios operativos |
| Entrada como estudiante | Operativa |
| Asignaturas visibles | 4 |
| Calificaciones visibles | 12 sintéticas |
| Errores de consola | 0 |

## Límites

- El acceso continúa siendo demostrativo y no implementa autenticación real.
- Las notas, asignaturas, docentes y fechas son datos sintéticos.
- La persistencia productiva y los permisos RBAC corresponden a sprints futuros.

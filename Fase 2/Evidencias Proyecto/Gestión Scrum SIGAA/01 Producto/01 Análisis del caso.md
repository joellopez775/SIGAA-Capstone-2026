# Análisis del caso SIGAA

## Situación

Los liceos y colegios registran asistencia, calificaciones, anotaciones,
matrículas y antecedentes de seguimiento en múltiples planillas o sistemas poco
conectados. Esta fragmentación retrasa la detección de estudiantes que requieren
apoyo y dificulta explicar por qué una alerta fue generada y qué acciones se
realizaron después.

## Problema central

Los equipos escolares no disponen de una vista única, oportuna y trazable que
conecte información académica, asistencia, convivencia y seguimiento. Como
resultado, las decisiones son tardías, dependen de consolidaciones manuales y
pueden perder continuidad entre profesores, Inspectoría, UTP y orientación.

## Usuarios afectados

- Estudiantes: necesitan consultar su información y recibir apoyo oportuno.
- Docentes: necesitan operar únicamente sobre sus cursos asignados.
- Profesor jefe: necesita una visión integral de su curso.
- Inspectoría: necesita asistencia, atrasos y justificaciones trazables.
- UTP: necesita seguimiento académico e indicadores confiables.
- Orientación o convivencia: necesita gestionar casos e intervenciones.
- Apoderados: requieren información autorizada y comprensible.
- Dirección: necesita indicadores agregados para tomar decisiones.

## Causas

1. Datos repartidos entre herramientas y responsables.
2. Falta de reglas de alerta comunes y explicables.
3. Ausencia de una ficha integral con control de acceso.
4. Seguimientos y acuerdos sin historial verificable.
5. Reportes preparados manualmente y con información desactualizada.

## Consecuencias

- Intervenciones tardías.
- Duplicación de registros.
- Riesgo de acceso indebido a datos escolares.
- Dificultad para evaluar si una acción de apoyo funcionó.
- Baja trazabilidad para auditoría y toma de decisiones.

## Solución propuesta

SIGAA será una aplicación web para centralizar gestión escolar y alertas
tempranas. Incluirá autenticación y permisos por rol, cursos y matrículas,
calificaciones, asistencia, anotaciones, reglas explicables de alerta, casos de
seguimiento, intervenciones, notificaciones, indicadores y auditoría.

## Alcance MVP

Incluye perfiles docente y estudiante, estructura escolar, estudiantes,
matrículas, evaluaciones, notas, asistencia, alertas explicables y seguimiento
básico. Excluye inicialmente analítica predictiva, aplicación móvil nativa e
integraciones avanzadas con plataformas externas.

## Restricciones

- Equipo de tres integrantes con tiempo académico limitado.
- Desarrollo principal desde Fase 2 según cronograma docente.
- Datos de demostración sin información personal real.
- Despliegue reproducible con Docker.
- Acceso remoto sin exponer PostgreSQL ni el resto del equipo servidor.

## Criterios de éxito

- Los usuarios solo acceden a funciones y datos autorizados.
- Los registros persisten en PostgreSQL y sobreviven reinicios.
- Una alerta indica la regla y los datos que la originaron.
- Cada intervención conserva responsable, fecha y resultado.
- El sistema puede ejecutarse de forma reproducible mediante Docker.

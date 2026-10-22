# Catálogo de historias de usuario SIGAA

Fecha de corte: 24 de septiembre de 2026.

Las estimaciones usan puntos de historia: expresan esfuerzo relativo, complejidad e
incertidumbre; no equivalen a horas. Los criterios son la base de aceptación y se
pueden refinar antes de comprometer la historia, pero no durante su desarrollo sin
registrar el cambio.

## Descubrimiento y producto

### PB-001 — Validar problema, usuarios y restricciones · 5 puntos · Must

Como equipo SIGAA, queremos validar el problema con actores escolares para construir
una solución útil y viable.

- Existe una definición verificable del problema y su alcance.
- Se identifican actores, necesidades, restricciones y supuestos.
- La contraparte revisa el análisis y sus observaciones quedan registradas.

### PB-002 — Visión del producto y cuatro pilares · 3 puntos · Must

Como Product Owner, quiero una visión compartida para orientar las decisiones del proyecto.

- La visión indica usuarios, necesidad, solución y valor esperado.
- Define los pilares de prevención, trazabilidad, colaboración y seguridad.
- El documento está versionado y disponible para el equipo.

### PB-003 — Backlog priorizado y estimado · 5 puntos · Must

Como equipo, queremos un backlog ordenado para saber qué construir primero.

- Cada elemento tiene identificador, resultado, prioridad y estimación.
- Los elementos están vinculados a una épica y sprint propuesto.
- El Product Owner puede reordenarlos sin perder trazabilidad.

### PB-004 — Criterio común de terminado · 2 puntos · Must

Como equipo, queremos una definición de terminado para evaluar todos los incrementos igual.

- Incluye código revisado, pruebas, documentación y evidencia.
- Exige que secretos y datos personales no estén en el repositorio.
- Está visible y es aplicada antes de cerrar una historia.

### PB-005 — Repositorio y trazabilidad · 3 puntos · Must

Como integrante, quiero un repositorio ordenado para colaborar y encontrar evidencias.

- El README explica propósito, estructura y ejecución.
- Los cambios se vinculan a una historia o actividad.
- Los entregables y bitácoras usan ubicaciones y nombres consistentes.

## Diseño, arquitectura y entrega Fase 1

### PB-006 — Arquitectura y decisiones técnicas · 5 puntos · Must

Como equipo técnico, queremos una arquitectura definida para desarrollar sin contradicciones.

- Se describen componentes, responsabilidades, comunicaciones y despliegue.
- Las decisiones relevantes incluyen contexto, alternativa elegida y consecuencias.
- La arquitectura es coherente con Docker, PostgreSQL y la seguridad esperada.

### PB-007 — Modelo de datos y diccionario · 5 puntos · Must

Como desarrollador, quiero un modelo de datos escolar para implementar persistencia consistente.

- El modelo contiene entidades, claves, relaciones y cardinalidades.
- El diccionario explica campos críticos, tipos y restricciones.
- Las reglas evitan duplicidades e inconsistencias académicas evidentes.

### PB-008 — Prototipo navegable · 5 puntos · Must

Como usuario escolar, quiero recorrer un prototipo para validar tempranamente la experiencia.

- Se puede iniciar sesión y cambiar entre vistas de docente y estudiante.
- Los flujos principales se recorren sin enlaces rotos.
- El feedback de validación se registra y prioriza.

### PB-009 — Diagramas UML principales · 5 puntos · Must

Como equipo, queremos representar los flujos críticos para alinear comportamiento e implementación.

- Se documentan al menos autenticación, asistencia, notas y seguimiento.
- Actores, pasos y respuestas del sistema son comprensibles.
- Los diagramas coinciden con alcance, roles y arquitectura vigente.

### PB-010 — Entrega y presentación Fase 1 · 5 puntos · Must

Como equipo Capstone, queremos entregar la Fase 1 completa para demostrar definición y planificación.

- Se incluyen todos los documentos exigidos por la pauta.
- La presentación mantiene coherencia con repositorio y planificación.
- La versión entregada y el feedback docente quedan registrados.

### PB-035 — Migración del dominio universitario a escolar · 8 puntos · Must

Como establecimiento, quiero que conceptos y datos correspondan a colegios y liceos.

- La interfaz usa curso, nivel, asignatura, profesor, estudiante y apoderado.
- El modelo de datos elimina o adapta conceptos universitarios incompatibles.
- Migraciones, documentación y demo son coherentes con la versión escolar.

### PB-038 — Modelo funcional del profesor · 13 puntos · Must

Como profesor, quiero gestionar mis cursos para registrar la actividad académica de forma segura.

- Solo visualiza cursos y asignaturas que tiene asignados.
- Puede planificar clases, pasar asistencia, ingresar notas y anotaciones.
- Las operaciones se validan, persisten y dejan trazabilidad.

### PB-039 — Modelo funcional del estudiante · 13 puntos · Must

Como estudiante, quiero consultar mi situación académica para entender mi progreso.

- Visualiza únicamente sus asignaturas, notas, asistencia y calendario.
- Las anotaciones visibles indican tipo, fecha y contexto permitido.
- La información proviene de datos persistentes y respeta permisos.

### PB-040 — Docker y aislamiento del servidor · 8 puntos · Must

Como equipo, queremos ejecutar SIGAA de forma reproducible sin exponer el servidor ni la base de datos.

- Un clon limpio inicia con Docker siguiendo el manual.
- La base de datos no publica su puerto hacia Internet.
- El acceso externo usa HTTPS y solo expone el servicio necesario.

## Seguridad, plataforma y gestión escolar

### PB-011 — Autenticación segura · 8 puntos · Must

Como usuario, quiero iniciar y cerrar sesión de forma segura para proteger mi cuenta.

- Las contraseñas se guardan con hash y nunca se registran en texto plano.
- La sesión expira, se puede revocar y los errores no revelan datos sensibles.
- Los secretos se inyectan mediante configuración fuera del repositorio.

### PB-012 — Roles y permisos · 8 puntos · Must

Como establecimiento, quiero restringir cada acción por rol y alcance para proteger los datos.

- Estudiantes solo consultan su información autorizada.
- Profesores operan únicamente sus cursos y asignaturas.
- Los intentos no autorizados devuelven 403 y cuentan con pruebas positivas y negativas.

### PB-013 — Estructura escolar · 8 puntos · Must

Como administrador, quiero configurar la estructura del establecimiento para contextualizar la gestión.

- Se administran establecimiento, año, niveles, cursos y asignaturas.
- Las relaciones inválidas o duplicadas se rechazan con mensajes claros.
- Los registros permanecen disponibles después de reiniciar el servicio.

### PB-014 — Entorno Docker reproducible · 5 puntos · Must

Como desarrollador, quiero levantar la solución con Docker para evitar diferencias entre equipos.

- Un único procedimiento inicia web, API y base de datos.
- Existen comprobaciones de salud y dependencias ordenadas.
- La configuración de ejemplo no contiene secretos reales.

### PB-015 — Gestión de estudiantes · 8 puntos · Must

Como personal autorizado, quiero crear y actualizar estudiantes para mantener registros vigentes.

- Los campos obligatorios y el identificador se validan.
- Los duplicados se rechazan de forma controlada.
- Creación y cambios persisten y registran actor y fecha.

### PB-016 — Matrículas · 5 puntos · Must

Como encargado académico, quiero matricular estudiantes para asociarlos a un curso y periodo.

- Solo permite curso y periodo válidos.
- Impide más de una matrícula activa equivalente.
- Conserva estado e historial y permite consultarlos tras reiniciar la API.

### PB-017 — Evaluaciones y calificaciones · 8 puntos · Must

Como profesor, quiero crear evaluaciones e ingresar notas para informar el progreso académico.

- Solo opera en cursos y asignaturas asignados.
- Valida escala, ponderación, fecha y estudiante matriculado.
- Calcula resultados sin perder el historial de cambios.

### PB-018 — Importación validada · 5 puntos · Should

Como encargado académico, quiero importar datos masivos para reducir trabajo manual.

- Se ofrece plantilla con formato y campos permitidos.
- Una vista previa informa filas válidas y errores antes de confirmar.
- La importación evita duplicados y entrega un resumen descargable.

### PB-036 — Apoderados y vínculos · 5 puntos · Must

Como establecimiento, quiero vincular apoderados con estudiantes para mantener responsables identificados.

- Un estudiante admite uno o más apoderados y se identifica el principal.
- Los datos de contacto se validan y su acceso está restringido.
- Los cambios de vínculo conservan historial y responsable.

## Asistencia, alertas y seguimiento

### PB-019 — Registro de asistencia · 8 puntos · Must

Como profesor, quiero registrar asistencia por clase para disponer de información oportuna.

- Solo se listan estudiantes matriculados en el curso.
- Registra presente, ausente, atrasado o justificado con fecha y autor.
- Impide duplicar asistencia de la misma clase y permite corrección auditada.

### PB-020 — Reglas explicables de alerta · 8 puntos · Must

Como equipo de apoyo, quiero alertas comprensibles para detectar riesgos tempranos.

- Existen al menos tres reglas configurables basadas en datos disponibles.
- Cada alerta explica qué regla y datos la activaron.
- Se evitan duplicados activos y se puede probar cada regla.

### PB-021 — Bandeja y panel de alertas · 8 puntos · Must

Como equipo de apoyo, quiero priorizar alertas para atender primero los casos urgentes.

- Permite filtrar por prioridad, curso, estado y responsable.
- Muestra motivo, fecha, estudiante y acción siguiente.
- Los cambios de estado quedan registrados.

### PB-022 — Entrega de avance Fase 2 · 5 puntos · Must

Como equipo Capstone, queremos presentar un incremento integrado para demostrar avance real.

- La demo se ejecuta desde una versión identificada del repositorio.
- Documentación, pruebas y producto reflejan el mismo alcance.
- Observaciones de evaluación quedan convertidas en acciones trazables.

### PB-023 — Casos de seguimiento · 8 puntos · Must

Como profesional de apoyo, quiero gestionar casos para coordinar intervenciones.

- Un caso tiene motivo, prioridad, estado, responsable y fechas.
- Permite registrar actividades y próximos pasos sin sobrescribir el historial.
- El acceso depende del rol y alcance autorizado.

### PB-024 — Ficha integral del estudiante · 8 puntos · Must

Como profesional autorizado, quiero una vista integral para tomar decisiones con contexto.

- Resume matrícula, asistencia, notas, alertas, anotaciones e intervenciones autorizadas.
- La fuente y fecha de actualización son visibles.
- Datos sensibles se ocultan para roles sin permiso.

### PB-025 — Notificaciones · 5 puntos · Should

Como usuario responsable, quiero recibir avisos relevantes para actuar a tiempo.

- Los eventos notificables y destinatarios están definidos.
- Evita envíos duplicados y registra estado de entrega.
- El contenido no expone información sensible innecesaria.

### PB-037 — Justificaciones de inasistencia · 5 puntos · Must

Como Inspectoría, quiero registrar y resolver justificaciones para mantener asistencia correcta.

- Vincula la justificación a estudiante, fecha y ausencia existente.
- Registra motivo, respaldo, estado y funcionario responsable.
- La aprobación actualiza la asistencia y conserva la trazabilidad.

## Analítica, calidad y cierre

### PB-026 — Indicadores agregados · 8 puntos · Should

Como directivo, quiero indicadores consolidados para conocer tendencias sin revisar casos uno a uno.

- Presenta métricas definidas de asistencia, rendimiento y alertas.
- Permite filtrar por periodo, nivel y curso.
- Los totales coinciden con datos de origen y muestran fecha de actualización.

### PB-027 — Exportación de reportes · 5 puntos · Could

Como directivo, quiero exportar reportes para compartir resultados autorizados.

- Exporta filtros y columnas visibles en un formato acordado.
- El archivo incluye fecha, periodo y responsable de generación.
- Respeta permisos y evita exponer campos no autorizados.

### PB-028 — Auditoría de cambios sensibles · 8 puntos · Must

Como responsable de seguridad, quiero auditar cambios para investigar acciones críticas.

- Registra actor, acción, fecha, entidad y valores relevantes antes/después.
- Los usuarios comunes no pueden modificar el registro.
- Se puede consultar por actor, fecha, entidad y tipo de acción.

### PB-029 — Pruebas integrales, seguridad y rendimiento · 8 puntos · Must

Como equipo, queremos verificar el sistema antes de liberarlo para reducir fallas.

- Los flujos críticos cuentan con pruebas repetibles y resultados registrados.
- Se revisan permisos, entradas, secretos y dependencias.
- El rendimiento se mide con escenario, volumen, umbral y resultado explícitos.

### PB-030 — Manual técnico y despliegue · 5 puntos · Must

Como administrador técnico, quiero instrucciones completas para instalar, operar y recuperar SIGAA.

- Incluye requisitos, configuración, despliegue, respaldo y restauración.
- Los comandos se prueban desde un entorno limpio.
- Diferencia claramente configuración de desarrollo y producción.

### PB-031 — Manual de usuario · 5 puntos · Should

Como usuario escolar, quiero una guía simple para ejecutar mis tareas sin asistencia técnica.

- Está organizado por rol y por tarea frecuente.
- Usa capturas vigentes y lenguaje no técnico.
- Incluye solución de errores comunes y canal de ayuda.

### PB-032 — Innovación y propuesta de valor · 3 puntos · Must

Como jurado, quiero entender el valor diferencial para evaluar la contribución de SIGAA.

- Se explican problema, beneficiarios, novedad e impacto medible.
- Las afirmaciones se apoyan en evidencia o se rotulan como hipótesis.
- La propuesta es coherente con el incremento demostrado.

### PB-033 — Entrega final Fase 2 · 8 puntos · Must

Como equipo Capstone, queremos entregar la Fase 2 completa y trazable para su evaluación.

- Se verifica la pauta punto por punto y se registra la evidencia.
- Código, documentos, Jira y demo corresponden a la misma versión.
- La entrega se prueba antes del plazo y queda respaldada.

### PB-034 — Defensa y retrospectiva del proyecto · 5 puntos · Must

Como equipo, queremos defender y evaluar el proyecto para demostrar resultados y aprendizaje.

- La defensa cubre problema, solución, arquitectura, proceso, demo y métricas.
- Cada integrante conoce su parte y responde sobre su contribución.
- La retrospectiva final registra logros, dificultades, aprendizajes y acciones futuras.

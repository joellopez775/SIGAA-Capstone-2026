# Registro inicial de riesgos

Escala: probabilidad de 1 a 3 multiplicada por impacto de 1 a 3. Un puntaje de 6 a 9 requiere seguimiento prioritario.

| ID | Riesgo | P | I | Puntaje | Mitigación | Responsable propuesto | Disparador |
|---|---|---:|---:|---:|---|---|---|
| R-01 | No contar con contraparte o validación real | 3 | 3 | 9 | Confirmar establecimiento y validaciones quincenales | Product Owner | Sin contacto al cerrar Sprint 0 |
| R-02 | Alcance excesivo para 18 semanas | 3 | 3 | 9 | Congelar MVP Must y controlar cambios | Product Owner | Velocidad insuficiente durante dos sprints |
| R-03 | Exposición de datos sensibles | 2 | 3 | 6 | Datos sintéticos/anonimizados, RBAC y auditoría | Responsable de seguridad | Solicitud de datos reales sin acuerdo |
| R-04 | Evidencias y documentación atrasadas | 3 | 2 | 6 | Incluir evidencia en DoD y cerrar dentro del sprint | Scrum Master | Historia sin evidencia en Review |
| R-05 | Integración tardía | 2 | 3 | 6 | CI desde Sprint 2, ramas cortas y contratos API | Equipo | Rama sin integrar por más de tres días |
| R-06 | Reglas de alerta poco útiles | 2 | 3 | 6 | Reglas explicables y umbrales validados | Datos/calidad | Alto número de falsos positivos |
| R-07 | Ausencia de un integrante | 2 | 2 | 4 | Trabajo en pares y documentación compartida | Scrum Master | Bloqueo superior a dos días |
| R-08 | Falla durante demo o despliegue | 2 | 3 | 6 | Docker, checklist, respaldo y ensayo | DevOps | Build inestable en semana 14 |
| R-09 | Pruebas poco representativas | 2 | 2 | 4 | Trazar casos a criterios y usar datos límite | Calidad | Criterios sin caso de prueba |
| R-10 | Incumplimiento de hitos Duoc | 2 | 3 | 6 | Revisión semanal, buffer y alertas de plazo | Equipo | Desviación mayor a tres días |

## Riesgos inmediatos

Al 21 de agosto de 2026, los riesgos R-01, R-02, R-04 y R-10 requieren atención inmediata. El Sprint 0 debe terminar con una contraparte identificada, un MVP acotado, documentación versionada y responsables confirmados.

## Revisión

El registro se revisa en cada Daily cuando aparece un disparador y formalmente durante Sprint Review y Retrospective. Todo riesgo materializado se convierte en impedimento y recibe una acción, responsable y fecha.

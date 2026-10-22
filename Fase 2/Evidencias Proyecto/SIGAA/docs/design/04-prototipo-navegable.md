# Prototipo navegable - Sprint 1

Estado: implementado y verificado internamente con datos sintéticos; pendiente de prueba externa.

## Objetivo

Validar navegación, jerarquía de información y explicabilidad antes de construir autenticación, roles y persistencia productiva.

## Pantallas

1. Acceso demo: identifica el carácter sintético y determina el rol mediante credenciales de demostración.
2. Dashboard: indicadores, estudiantes prioritarios y alertas recientes.
3. Estudiantes: búsqueda y listado con asistencia, promedio y nivel de riesgo.
4. Ficha: contexto académico, indicadores, alertas e historial de intervención.
5. Alertas: bandeja filtrable con severidad, regla y evidencia.
6. Portal del estudiante: avance del año escolar, promedio, asistencia, asignaturas,
   notas parciales, agenda y recomendaciones personales.

## Navegación de prueba

1. Ingresar en modo demostración.
2. Abrir el dashboard y confirmar cuatro indicadores.
3. Seleccionar un estudiante prioritario.
4. Revisar la causa de su alerta.
5. Volver a la bandeja y filtrar por severidad.

## Criterios de aceptación internos

- Navegación sin recargar entre las vistas del prototipo.
- Diseño usable desde 320 px de ancho.
- Estados vacío, carga y error identificables.
- Datos rotulados como sintéticos.
- Cada alerta muestra regla, valor observado y umbral.
- La aplicación conserva el healthcheck de API y base de datos.

## Límites

- El acceso demo no autentica usuarios.
- Las acciones no persisten cambios productivos.
- Las reglas y umbrales son ejemplos por validar.
- No se utilizan datos personales reales.

## Prueba interna

| Caso | Resultado esperado | Estado |
|---|---|---|
| Ingreso demo | Mostrar dashboard | Aprobado en navegador |
| Buscar estudiante | Filtrar por nombre, identificador o curso | Aprobado: 1 resultado para Camila |
| Abrir ficha | Mostrar indicadores y alertas | Aprobado: evidencia de asistencia visible |
| Filtrar alertas | Reducir resultados visibles | Aprobado: 2 alertas de severidad alta |
| API no disponible | Mostrar aviso controlado | Cubierto por estado de error; prueba de interrupción pendiente |
| Vista móvil | Sin desbordamiento horizontal | Aprobado a 390 x 844 px |

## Evidencia de verificación

- Build web: aprobado con Vite.
- Pruebas API: 6 aprobadas, 0 fallidas.
- Docker Compose: web, API y PostgreSQL saludables.
- Consola del navegador: 0 errores durante los flujos revisados.

## Iteración visual premium - 28 de agosto de 2026

Después de la primera revisión visual se descartó la apariencia SaaS genérica y
se definió una identidad cercana a un establecimiento educacional de alto nivel,
con referencias de interacción propias de macOS.

Cambios aplicados:

- Paleta institucional en verde biblioteca, marfil, latón y tonos minerales.
- Jerarquía editorial con títulos serif y texto de interfaz basado en fuentes
  del sistema para conservar nitidez y evitar dependencias externas.
- Navegación flotante con iconos, contador de alertas y perfil contextual.
- Barra superior con buscador tipo Command Palette, notificaciones y contexto
  de navegación.
- Indicadores con micrográficos, acentos diferenciados y estados más sobrios.
- Superficies con profundidad, vidrio sutil y bordes suaves, sin depender de
  imágenes generadas ni componentes externos.
- Portada institucional con sello, composición editorial y acceso demostrativo.

Verificación de la iteración:

- Compilación de producción completada sin errores.
- Contenedor web reconstruido y operativo.
- Consola del navegador sin errores en login y dashboard.
- Vista móvil comprobada sin desborde horizontal.

## Portal del estudiante - 28 de agosto de 2026

Se incorporó una experiencia diferenciada para evitar que el estudiante vea
controles o información propios de coordinación. Un único formulario consulta
la API y dirige a la vista docente o estudiante según la cuenta autenticada.

La vista de estudiante incluye:

- Identidad, curso, nivel y estado escolar.
- Avance del año escolar y evaluaciones registradas.
- Promedio general, asistencia global y establecimiento.
- Cuatro asignaturas con docente, asistencia y promedio actual.
- Tres calificaciones sintéticas por asignatura, con ponderación.
- Tabla de últimas calificaciones.
- Agenda de evaluaciones y entregas próximas.
- Mensaje de acompañamiento académico.
- Navegación funcional entre inicio, asignaturas, asistencia, calendario y anotaciones.
- Historial de asistencia y porcentajes por asignatura.
- Anotaciones positivas o por mejorar publicadas expresamente al estudiante.

Los datos siguen siendo exclusivamente sintéticos. Esta experiencia no expone
las reglas internas, la bandeja global ni los antecedentes de otros estudiantes.

El endpoint `GET /api/student/workspace/:id` verifica el rol y la coincidencia
entre el estudiante de la sesión demo y el identificador solicitado. Las pruebas
automatizadas cubren ausencia de rol, intento de acceso cruzado y exclusión de
alertas internas.

### Cuentas demo

- Docente: `docente@sigaa.demo` / `Docente2026!`.
- Estudiante: `estudiante@sigaa.demo` / `Estudiante2026!`.

El endpoint `POST /auth/demo-login` valida ambos perfiles y responde `401` para
credenciales incorrectas. No genera una sesión persistente ni sustituye la
autenticación segura planificada para Sprint 2.

## Corrección al dominio escolar — 21 de agosto de 2026

El Product Owner confirmó que SIGAA se utilizará en colegios y liceos. Se
conservaron la identidad premium, la navegación responsiva y los flujos de
demostración, pero se sustituyó todo contexto universitario visible:

- El acceso identifica una comunidad educativa y un portal del establecimiento.
- La vista de personal representa a una profesora jefe de 2° Medio A.
- Las secciones universitarias se reemplazaron por cursos escolares.
- Carrera, cohorte y créditos se reemplazaron por nivel, curso, año escolar y
  evaluaciones registradas.
- Las asignaturas de educación superior se sustituyeron por Matemática, Lengua
  y Literatura, Historia y Ciencias Naturales.
- El acompañamiento se atribuye a profesor jefe y UTP.

El alcance actual sigue siendo un prototipo sintético: la API entrega datos de
demostración y la persistencia funcional será implementada en los siguientes
sprints sobre el esquema escolar 0.3.0.

## Identidad visual oficial - 28 de agosto de 2026

Se incorporó el logo oficial entregado por el Product Owner como activo del
producto. La versión completa identifica la pantalla de acceso y una variante
compacta, obtenida mediante recorte visual no destructivo, aparece en las barras
laterales de los portales docente y estudiante. El archivo fuente se conserva
sin modificaciones en `apps/web/src/assets/sigaa-logo.png`.

## Navegación móvil refinada

La navegación móvil se rediseñó siguiendo principios observados en la experiencia
web móvil de Apple: controles mínimos, superficies translúcidas, jerarquía clara
y respeto por las áreas seguras del dispositivo. La referencia se utilizó como
criterio de interacción y acabado, sin copiar su identidad visual.

- Encabezado superior compacto de 54 px con marca y perfil.
- Menú circular tipo hamburger en la esquina superior derecha.
- Navegación desplegable a pantalla completa con transición escalonada.
- Fondo translúcido con desenfoque y separación visual ligera.
- Etiquetas e iconos conservados para facilitar el reconocimiento.
- Espaciado inferior compatible con `safe-area-inset-bottom` en iPhone.
- Implementación equivalente para los portales docente y estudiante.

## Espacio de trabajo docente — 21 de agosto de 2026

La vista de personal evolucionó a un modelo docente operacional con múltiples
asignaciones. El profesor puede navegar por sus cursos, planificar clases
futuras, registrar asistencia, crear evaluaciones, ingresar notas y agregar
anotaciones positivas o negativas. La API rechaza escrituras sin rol docente y
valida que cada estudiante pertenezca a la asignación indicada.

La experiencia fue comprobada de extremo a extremo con datos sintéticos. Las
escrituras son temporales hasta conectar la API con PostgreSQL; el esquema
físico correspondiente ya está disponible en la migración 004.

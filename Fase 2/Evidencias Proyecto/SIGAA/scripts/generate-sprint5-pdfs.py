"""Build the three canonical Sprint 5 PDFs from verified local evidence."""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'output/evidence/sprint-5'
OUT = ROOT.parent / 'Gestión Scrum SIGAA/PDF/02 Sprints/Sprint 5'
OUT.mkdir(parents=True, exist_ok=True)
validation = json.loads((EVIDENCE / 'validation.json').read_text())
browser = json.loads((EVIDENCE / 'browser-results.json').read_text())
jira = json.loads((EVIDENCE / 'jira-status.json').read_text())
assert validation['result'] == browser['result'] == 'passed'
GREEN = colors.HexColor('#184c3b')
INK = colors.HexColor('#233d34')
GOLD = colors.HexColor('#bd974b')
LIGHT = colors.HexColor('#edf3ef')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleS', fontName='Helvetica-Bold', fontSize=27, leading=31, textColor=GREEN, spaceAfter=15))
styles.add(ParagraphStyle(name='SubS', fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=GREEN, spaceBefore=13, spaceAfter=7))
styles.add(ParagraphStyle(name='BodyS', fontName='Helvetica', fontSize=10.2, leading=14.5, textColor=INK, spaceAfter=8))
styles.add(ParagraphStyle(name='SmallS', fontName='Helvetica', fontSize=8.4, leading=11.5, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name='CodeS', fontName='Courier', fontSize=8.2, leading=11.5, textColor=INK, spaceAfter=8))
styles.add(ParagraphStyle(name='HeadS', fontName='Helvetica-Bold', fontSize=8.4, leading=11.5, textColor=colors.white))

def p(s, style='BodyS'):
    return Paragraph(s, styles[style])

def title(kicker, heading, subtitle=None):
    result = [p(kicker.upper(), 'SmallS'), p(heading, 'TitleS')]
    if subtitle:
        result.append(p(subtitle))
    return result

def table(rows, widths=None):
    cells = [[p(escape(str(c)).replace('\n','<br/>'),'HeadS' if i == 0 else 'SmallS') for c in row] for i,row in enumerate(rows)]
    t = Table(cells, colWidths=widths, hAlign='LEFT', repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),GREEN),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,colors.white]),
        ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),
        ('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9),
        ('LINEBELOW',(0,0),(-1,0),1,GOLD)]))
    return t

def shot(name, max_height=320, max_width=510):
    image = Image(str(EVIDENCE / name))
    scale = min(max_width/image.imageWidth, max_height/image.imageHeight)
    image.drawWidth = image.imageWidth*scale
    image.drawHeight = image.imageHeight*scale
    image.hAlign = 'CENTER'
    return image

def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(GREEN);canvas.rect(0,A4[1]-15,A4[0],15,fill=1,stroke=0)
    canvas.setStrokeColor(GOLD);canvas.line(42,44,A4[0]-42,44)
    canvas.setFont('Helvetica',8);canvas.setFillColor(INK)
    canvas.drawString(42,30,'SIGAA | Sprint 5 | Corte: 28 de octubre de 2026')
    canvas.drawRightString(A4[0]-42,30,str(doc.page))
    canvas.restoreState()

def build(name, story):
    doc = SimpleDocTemplate(str(OUT/name),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=40,bottomMargin=59,
                            title=name.removesuffix('.pdf'),author='Equipo SIGAA',subject='Capstone 2026 - avance verificable del Sprint 5')
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    print(name)

technical = title('Incremento 0.9.0 · PB-023 / PB-036 / PB-024','Implementación y verificación','Casos, apoderados y ficha integral. Código y pruebas en el repositorio SIGAA-Capstone-2026; incremento preparado para revisión del Product Owner.')
technical += [p('Resultado comprobado','SubS'),p('Los tres módulos funcionan contra PostgreSQL en un entorno local aislado con datos ficticios. Incluyen API, interfaz, migración, permisos y trazabilidad. No se modificó el despliegue público ni se presentó esta entrega como aprobada por el equipo.'),
 table([['Historia existente','Implementación entregada','Puntos'],['SCRUM-35 / PB-023','Apertura desde alerta; responsable; intervención; próxima acción; cierre y reapertura con historial.',8],['SCRUM-48 / PB-036','Registro y edición; vínculo con estudiantes; principal único; desactivación e historial.',5],['SCRUM-36 / PB-024','Ficha con notas, asistencia, anotaciones, alertas, casos, intervenciones y apoderados según rol.',8]],[110,350,51]),
 p('Alcance y estado','SubS'),p('21 puntos implementados para revisión de 26 planificados en el Sprint 5. SCRUM-37 / PB-025 (notificaciones, 5 puntos) permanece pendiente. La preferencia de avisos no envía mensajes. No se implementa un portal de inicio de sesión para apoderados en este incremento.'),
 p('Base de evidencia','SubS'),p(f"{validation['unitTests']} pruebas unitarias y {validation['integrationTests']} pruebas de integración aprobadas; {len(browser['checks'])} recorridos de navegador aprobados. Compilación web correcta. Los resultados son del entorno de prueba indicado, no una certificación del servidor público."),
 p('Repositorio: <link href="https://github.com/joellopez775/SIGAA-Capstone-2026" color="#184c3b">github.com/joellopez775/SIGAA-Capstone-2026</link>','SmallS'),PageBreak()]
technical += title('Arquitectura','Datos, API y consistencia')
technical += [p('La interfaz React llama a la API Express con la sesión existente y protección contra solicitudes falsificadas. La API vuelve a comprobar identidad, rol, curso y revisión del registro antes de escribir. Los cambios se guardan dentro de una transacción y generan auditoría.'),
table([['Entidad','Relación y reglas'],['apoderado','Código interno único, contacto, estado y revisión. Se conservan las filas históricas y sus identificadores.'],['estudiante_apoderado','Vínculo único estudiante-apoderado; parentesco, estado y preferencia. Solo un principal activo por estudiante.'],['caso_seguimiento','Deriva de una alerta. Responsable, prioridad, estado, próxima acción, fecha y resultado de cierre. Un caso activo por alerta.'],['caso_actividad','Aperturas, intervenciones, cambios, cierres y reaperturas. Historial protegido contra modificación y eliminación.'],['evento_auditoria','Conserva actor, fecha y valores antes/después. Comparte transacción con el cambio de negocio.']],[130,381]),
p('Rutas principales (prefijo web /api)','SubS'),
table([['Ruta','Operación'],['/guardians; /guardians/:id','GET lista/detalle; POST crea; PUT modifica con motivo y revisión.'],['/guardians/:id/links; /guardian-links/:id','POST vincula; PATCH cambia parentesco, principal o estado.'],['/followup/cases; /followup/cases/:id','GET lista/detalle; POST abre; PATCH actualiza, cierra o reabre.'],['/followup/cases/:id/activities','POST registra una intervención y actualiza próxima acción/fecha.'],['/students/:id/dossier','GET lectura coherente de las secciones autorizadas.']],[225,286]),
p('La ficha usa una transacción de lectura consistente. Notas y asistencias corresponden a registros publicados. Las listas tienen paginación; la ficha avisa si una sección supera 500 registros. Cerrar un caso no cambia automáticamente el estado de la alerta.'),PageBreak()]
technical += title('Control de acceso','Permisos y privacidad')
technical += [table([['Rol','Apoderados','Casos y ficha'],['Administración','Crea, edita, vincula y desactiva con motivo.','Gestiona casos y consulta ficha institucional.'],['Inspectoría','Mismos permisos de gestión del registro.','Gestiona casos y consulta ficha institucional.'],['Dirección / UTP','Consulta registro, vínculos e historial; sin edición.','Gestiona casos y consulta ficha institucional.'],['Docente','Sin registro global; en ficha ve nombre y parentesco, sin teléfono ni correo.','Solo cursos vigentes asignados. Modifica únicamente casos bajo su responsabilidad.'],['Estudiante','Sin acceso al registro ni contactos.','Solo su propia ficha académica publicada. Sin alertas, casos ni intervenciones internas.']],[100,200,211]),
p('Protecciones verificadas','SubS'),p('Una URL o identificador ajeno no concede acceso. Cambiar una asignación docente revoca el acceso al curso en la próxima consulta. Las anotaciones privadas de otro autor se ocultan también al equipo de gestión; la ficha del estudiante muestra únicamente anotaciones publicadas para él.'),
p('Los apoderados se identifican con un código interno estable, sin exigir RUN. Si hay vínculos activos, primero deben cerrarse antes de desactivar la persona. Promover un nuevo principal convierte al anterior en secundario y registra ambos cambios. No hay eliminación física desde estos módulos.'),
p('Conflictos y errores','SubS'),p('Las ediciones usan expectedRevision. Si otra persona modifica el registro, la API responde conflicto y la pantalla pide recargar. Los índices únicos y bloqueos de transacción impiden crear dos casos activos para la misma alerta o dos principales activos para el mismo estudiante.'),
p('Límites','SubS'),p('El alcance institucional sigue el modelo de un establecimiento del sistema existente; no se declara aislamiento entre múltiples instituciones. La ficha no sustituye certificados, promedios oficiales ni evaluaciones profesionales. La autorización para tratar datos reales requiere revisión del establecimiento.'),PageBreak()]
technical += title('Verificación reproducible','Pruebas y resultado QA')
technical += [p('Entorno: Node.js 22, PostgreSQL 14 local aislado y Chromium automatizado. Bases efímeras con nombres aleatorios y datos ficticios; sin credenciales ni alumnos reales en Git. Docker no estaba disponible, por lo que no se declara ejecutada una prueba de contenedores o PostgreSQL 16 para esta versión.'),
table([['Conjunto','Resultado','Cobertura'],['Unitarias',str(validation['unitTests'])+' / '+str(validation['unitTests']),'Contraseñas, sesiones, orígenes, roles y validación base.'],['Integración',str(validation['integrationTests'])+' / '+str(validation['integrationTests']),'44 pruebas anteriores y 13 nuevas: permisos, concurrencia, historial, ficha y persistencia.'],['Navegador',str(len(browser['checks']))+' recorridos','Administración, Inspectoría, docente y estudiante. Escritorio y anchos móviles 390/320.'],['Regresión web',str(validation['regressionScenarios'])+' recorridos','Catálogos, alertas, justificaciones y navegación de módulos anteriores.'],['Compilación web','Correcta','Paquete de producción generado con Vite.']],[95,100,316]),
p('Casos de mayor riesgo cubiertos','SubS'),p('Acceso sin sesión; solicitudes sin protección; docente de otro curso; ficha de otro estudiante; notas borrador; anotaciones privadas; duplicados; dos cambios simultáneos; cierre sin resultado; intervención después del cierre; reapertura; historial inmutable; migración repetida y reinicio de API.'),
p('Evidencia reproducible','SubS'),p('Pruebas: apps/api/test/followup.test.js. Navegador: scripts/verify-followup-browser.mjs. Resultados y capturas: output/evidence/sprint-5/. La prueba crea y elimina únicamente su propia base efímera. TEST_DATABASE_URL debe apuntar a una instancia aislada donde se permita crear bases.'),
p('cd apps/api &amp;&amp; npm test<br/>TEST_DATABASE_URL=… npm run test:integration<br/>cd ../..<br/>TEST_DATABASE_URL=… node scripts/verify-followup-browser.mjs<br/>npm --prefix apps/web run build','CodeS'),
p('Conclusión de QA','SubS'),p('Apto con observaciones para revisión funcional del incremento en el entorno verificado. Falta la aceptación del Product Owner, el ensayo en Docker/PostgreSQL 16 y la migración/despliegue verificado del servidor. No se declara auditoría completa de accesibilidad, carga ni seguridad de toda la aplicación.'),PageBreak()]
technical += title('Operación','Instalación, migración y entrega')
technical += [p('Instalación nueva','SubS'),p('Clonar el repositorio nuevo y trabajar dentro de Fase 2/Evidencias Proyecto/SIGAA. Crear .env desde .env.example con una contraseña aleatoria privada. docker compose up --build -d inicializa 001–009 en un volumen vacío. No incluye cuentas ni contraseñas por defecto; el sembrador local solo admite una base vacía y datos ficticios.'),
p('Actualizar una instalación escolar existente','SubS'),p('1. Respaldar la base y verificar su restauración en un entorno aislado. Reservar una ventana de mantenimiento y comprobar que 001–008 ya están aplicadas.<br/>2. Revisar vínculos históricos con más de un principal activo; resolverlos con aprobación del responsable de datos. La migración se detiene si encuentra esa inconsistencia.<br/>3. Construir la API nueva, detener sus escrituras y aplicar npm run migrate con una cuenta administrativa autorizada. El migrador aplica 007, 008 y 009; nunca volver a ejecutar 003 sobre una base existente.<br/>4. Si la instalación utiliza un rol SQL restringido, conceder acceso a las nuevas tablas antes de iniciar la API; no sustituirlo por una cuenta administrativa en ejecución.<br/>5. Reconstruir web/API y comprobar /health (0.9.0), acceso por rol, vínculos, casos, ficha e historial. La API exige followup_schema=1.'),
p('Permisos del rol de ejecución (adaptar el nombre local)','SubS'),p('GRANT SELECT, INSERT, UPDATE ON caso_seguimiento<br/>TO &lt;rol_de_ejecucion&gt;;<br/>GRANT SELECT, INSERT ON caso_actividad<br/>TO &lt;rol_de_ejecucion&gt;;','CodeS'),
p('El rol necesita además los permisos ya usados en apoderado, estudiante_apoderado y evento_auditoria. No se otorgan DELETE ni cambios al historial. Las credenciales y respaldos permanecen fuera del repositorio.'),
p('Reversión controlada','SubS'),p('Si falla una comprobación, detener la nueva API, conservar evidencia y evaluar volver a la imagen anterior sin eliminar las tablas añadidas. No ejecutar docker compose down -v ni borrar filas para recuperar el servicio. Restaurar un respaldo solo con autorización y tras evaluar las escrituras posteriores.'),
p('Versión entregada','SubS'),p('0.9.0 preparada en la rama de trabajo y solicitud de revisión del repositorio nuevo. La aprobación, integración a main y despliegue son pasos posteriores. Los PDF históricos conservan su fecha de corte. Este documento es la referencia técnica del incremento del 28-10-2026.')]
build('01 Implementación y verificación Sprint 5.pdf',technical)

manual = title('Guía práctica','Manual de uso · Sprint 5','Datos de ejemplo en las capturas. Usa tu cuenta personal; los permisos dependen de tu rol.')
manual += [p('1. Registrar un apoderado','SubS'),p('Desde Apoderados, busca primero por nombre o código. Si no existe, completa código interno, nombres y apellidos; correo y teléfono son opcionales. Pulsa Guardar apoderado. El código debe ser único y no cambia después.'),
shot('01-apoderados.png',300),p('2. Vincularlo a estudiantes','SubS'),p('Abre el registro y despliega Vincular estudiante. Selecciona estudiante, parentesco, estado y si será principal. Explica el motivo y guarda. Si designas un nuevo principal, el anterior queda como secundario. No se crea otro registro de la misma persona para cada hijo.'),
p('Editar o desactivar','SubS'),p('Editar datos de contacto requiere un motivo. Para terminar un vínculo, ábrelo y desmarca activo y principal; si quedan otros apoderados, asigna primero otro principal. El historial permanece. Desactiva la persona únicamente cuando no tenga vínculos activos.'),PageBreak()]
manual += title('Acompañamiento','Abrir y atender un caso')
manual += [p('1. Revisa Alertas y seguimiento. Recalcula después de cambios académicos si corresponde.<br/>2. En Casos de seguimiento, selecciona una alerta de origen que no esté resuelta ni descartada.<br/>3. Elige responsable y prioridad; escribe el motivo, la próxima acción y su fecha.<br/>4. Pulsa Crear caso. Solo puede existir un caso activo por alerta.'),
shot('02-casos.png',310),p('Registrar una intervención','SubS'),p('En la bandeja, pulsa Abrir caso y despliega Registrar intervención. Describe una acción realmente realizada y define el siguiente paso con fecha. Guarda. El historial registra autor y hora; no puede reescribirse para simular acciones pasadas.'),
p('Usa los filtros por estado, curso, estudiante y responsable. Un docente solo puede modificar los casos que tiene a su cargo dentro de sus cursos. Administración, Inspectoría y Dirección/UTP pueden gestionar los casos institucionales.'),PageBreak()]
manual += title('Continuidad y trazabilidad','Cerrar, reabrir y corregir')
manual += [shot('03-historial.png',310),p('Cerrar un caso','SubS'),p('En Cambiar estado, responsable o cerrar, selecciona Cerrado. Registra el fundamento y un resultado de al menos ocho caracteres. Guarda. El caso conserva sus intervenciones; la alerta se gestiona por separado.'),
p('Reabrir','SubS'),p('Abre un caso cerrado y elige Reabrir caso. Indica el fundamento, responsable, próxima acción y fecha. Se agrega un evento de reapertura; el cierre anterior no desaparece.'),
table([['Mensaje o situación','Qué hacer'],['El registro cambió','Pulsa Recargar caso o Recargar apoderado. Revisa el cambio antes de guardar otra vez.'],['Ya existe un registro','Busca y usa el apoderado o caso existente. No cambies el código solo para evitar el aviso.'],['Responsable sin permiso','Selecciona a alguien con rol vigente y acceso al curso.'],['Caso cerrado','Reabre con fundamento antes de registrar otra intervención.']],[140,371]),PageBreak()]
manual += title('Consulta autorizada','Leer la ficha integral')
manual += [p('En Ficha integral selecciona al estudiante. La cuenta de estudiante abre únicamente su propia ficha. Usa Actualizar ficha para consultar el último estado guardado; cada sección puede plegarse para facilitar la lectura.'),
shot('05-ficha-movil.png',330),
p('Qué aparece','SubS'),p('Matrículas, notas y asistencia publicadas, y anotaciones visibles. El equipo autorizado consulta además alertas, casos, actividades, intervenciones históricas y apoderados activos. El docente no recibe teléfonos ni correos de apoderados; el estudiante no recibe seguimiento interno.'),
p('En teléfono','SubS'),p('Toca el botón circular del menú, desplázate por sus opciones y elige el módulo. El menú se cierra al navegar. En teclado, Tab recorre controles y Escape cierra el menú. Los formularios se adaptan a una columna.'),
p('Si una sección está vacía, no inventes información para completarla. Comprueba permisos, publicación de datos y estudiante seleccionado. Si aparece el aviso de más de 500 registros, esta ficha muestra un resumen limitado, no un historial exhaustivo.')]
build('02 Manual de uso Sprint 5.pdf',manual)

scrum = title('Gestión verificable','Seguimiento y backlog','Sprint 5 - Seguimiento · Jira id 38 · Sin nuevas historias ni sprints duplicados.')
scrum += [p('Objetivo del incremento','SubS'),p('Entregar casos, gestión de apoderados y ficha integral persistentes, con permisos y evidencia técnica. La solicitud del Product Owner define el alcance de esta ejecución; no se atribuye a una reunión de planificación.'),
p('Fechas','SubS'),p('Ventana planificada original: 19–31 de octubre de 2026. Activación real en Jira: 28 de octubre de 2026, 20:37 hora de Santiago. Se conserva el fin planificado del 31 de octubre. El trabajo no se retrofecha al día 19.'),
table([['Historia','Puntos','Estado comprobado'],*[[i['key']+' / '+i['summary'].split(' ')[0],i['points'],i['status']] for i in jira['issues']]],[230,60,221]),
p('Lectura del avance','SubS'),p('21 puntos están implementados para revisión; 5 puntos de notificaciones siguen pendientes. No hay puntos aceptados como Terminada en este sprint. La implementación técnica no equivale a aprobación del Product Owner ni a una entrega realizada en Campus.'),
p('Tablero y burndown','SubS'),p('Se reutilizan las cuatro tarjetas y el sprint 38. No se generan duplicados. Con este único corte verificable no se reconstruye una curva diaria de trabajo: la referencia de pendiente de aceptación sigue siendo 26 puntos. La distribución del corte es 21 en revisión, 5 pendientes y 0 terminados.'),PageBreak()]
scrum += title('Trabajo realizado','Desglose y criterios de revisión')
scrum += [table([['Historia','Trabajo técnico completado','Validar con el PO'],['PB-023','Migración de casos/actividades; API; interfaz; responsable; fechas; cierre/reapertura; duplicados; historial.','Probar una alerta, registrar una acción real y revisar cierre/reapertura. Confirmar proceso del establecimiento.'],['PB-036','Registro; contactos; relación con estudiantes; principal único; desactivación; conflictos y auditoría.','Revisar parentescos y política de contactos. Probar cambio de principal sin duplicar personas.'],['PB-024','Consulta consolidada consistente; interfaz por rol; privacidad y límites de resultados.','Comprobar contenido y permisos con un docente, un estudiante y un integrante de gestión.']],[75,230,206]),
p('Responsabilidades','SubS'),p('Joel López es el Product Owner y decide la aceptación. La Gantt proponía Joel para casos, Matías para apoderados y Agustín para ficha, con revisión cruzada. Ese reparto requiere ratificación: no se cambian asignados de Jira ni se atribuye a los compañeros la ejecución de esta sesión.'),
p('Comprobación antes de aceptar','SubS'),p('Código, API, interfaz, pruebas y manuales: entregados. Revisión del equipo, aceptación del PO, ensayo en Docker/PostgreSQL 16, integración a main y despliegue: pendientes. Las notificaciones requieren otra implementación y prueba; no se presentan como disponibles.'),
p('Release','SubS'),p('Incremento 0.9.0 preparado para revisión en el repositorio nuevo. Se conserva el repositorio anterior y el servicio público. Antes de publicar la versión, seguir la guía de respaldo, migración 009, permisos SQL y comprobación por roles.'),PageBreak()]
scrum += title('Registro honesto','Seguimiento, impedimentos y ceremonias')
scrum += [p('Registro técnico del 28 de octubre','SubS'),p('Se inspeccionaron código y tarjetas existentes; se implementaron los tres módulos; se ejecutaron pruebas aisladas y recorridos en navegador; se prepararon PDF y evidencia; se actualizó el sprint existente. Próxima acción: revisión funcional del Product Owner y decisión de integración/despliegue.'),
p('Daily Meeting','SubS'),p('No hay evidencia de una reunión de equipo celebrada durante esta ejecución. El párrafo anterior es un registro técnico de avance, no una Daily. No se agregan participantes, asistencia, horas de reunión ni acuerdos no confirmados.'),
table([['Impedimento / límite','Tratamiento y estado'],['Docker no disponible en el Mac de trabajo','Se validó con PostgreSQL 14 aislado. Pendiente ejecutar el mismo conjunto en contenedores PostgreSQL 16.'],['Aprobación y servidor','Incremento preparado; revisión del PO y despliegue no realizados.'],['Notificaciones','SCRUM-37 conserva 5 puntos y estado Pendiente. No se habilitó envío de avisos.'],['Sprints históricos activos','No se cierran ni alteran ceremonias anteriores para forzar un tablero verde. Regularizar con evidencia y aceptación.']],[145,366]),
p('Review y retrospectiva','SubS'),p('Review pendiente de demostración y decisión real del PO. Retrospectiva pendiente de reunión o aportes confirmados del equipo. No se completan actas ni se declaran celebradas. Observaciones técnicas para discutir: exigir pruebas de permisos, conservar historial, distinguir implementación de despliegue y registrar fechas reales.'),
p('Trazabilidad','SubS'),p('Historias: SCRUM-35, SCRUM-48 y SCRUM-36. Gestión transversal: SCRUM-77 (planificación), SCRUM-78 (backlog), SCRUM-81 (seguimiento), SCRUM-84 (review) y SCRUM-85 (retrospectiva). Se actualizan las descripciones existentes con enlaces a esta evidencia, manteniendo las ceremonias no realizadas pendientes.'),
p('Evidencia: output/evidence/sprint-5/validation.json, browser-results.json y jira-status.json. Las referencias históricas conservan su fecha. Solo existe una ubicación canónica de estos tres PDF.','SmallS')]
build('03 Seguimiento y backlog Sprint 5.pdf',scrum)

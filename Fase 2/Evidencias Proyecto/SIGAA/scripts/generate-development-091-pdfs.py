"""Render the verified 28 October increment and its implemented UML flows."""
from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, Flowable
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf';E=ROOT/'output/evidence/sprint-5-completion'
assert json.loads((E/'validation.json').read_text())['result']=='passed'
# Platform typography: Georgia headings and Helvetica Neue body on macOS.
fonts=[('Georgia','/System/Library/Fonts/Supplemental/Georgia.ttf',0),('Body','/System/Library/Fonts/HelveticaNeue.ttc',0),('Bold','/System/Library/Fonts/HelveticaNeue.ttc',1)]
for name,path,index in fonts:
 if Path(path).exists():pdfmetrics.registerFont(TTFont(name,path,subfontIndex=index))
 else:raise RuntimeError('Install platform fonts or configure equivalent local font paths')
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
G=colors.HexColor('#174b3b');GOLD=colors.HexColor('#b79851');INK=colors.HexColor('#253f35');LIGHT=colors.HexColor('#edf3ee')
S={
 'title':ParagraphStyle('title',fontName='Georgia',fontSize=25,leading=30,textColor=G,spaceAfter=13),
 'h':ParagraphStyle('h',fontName='Georgia',fontSize=15,leading=19,textColor=G,spaceBefore=12,spaceAfter=8),
 'body':ParagraphStyle('body',fontName='Body',fontSize=10.4,leading=15,textColor=INK,spaceAfter=9),
 'small':ParagraphStyle('small',fontName='Body',fontSize=8.6,leading=12,textColor=INK,spaceAfter=7),
 'white':ParagraphStyle('white',fontName='Bold',fontSize=9,leading=12,textColor=colors.white),
 'code':ParagraphStyle('code',fontName='Courier',fontSize=8.2,leading=12,textColor=INK,spaceAfter=7),
}
def p(t,s='body'):return Paragraph(t,S[s])
def head(k,t):return [p(k.upper(),'small'),p(t,'title')]
def h(t):return p(t,'h')
def table(rows,widths):
 t=Table([[p(escape(str(x)).replace('\n','<br/>'),'white' if i==0 else 'small') for x in r] for i,r in enumerate(rows)],colWidths=widths,repeatRows=1,hAlign='LEFT')
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),G),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,colors.white]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('LINEBELOW',(0,0),(-1,0),1.2,GOLD)]));return t
def shot(n,height=330,width=490):
 i=Image(str(E/n));r=min(height/i.imageHeight,width/i.imageWidth);i.drawWidth=i.imageWidth*r;i.drawHeight=i.imageHeight*r;return i
def footer(c,d):
 c.setFillColor(G);c.rect(0,A4[1]-13,A4[0],13,fill=1,stroke=0);c.setStrokeColor(GOLD);c.line(44,42,A4[0]-44,42)
 c.setFont('Body',8);c.setFillColor(INK);c.drawString(44,28,'SIGAA · Ingeniería en Informática · 28 octubre 2026');c.drawRightString(A4[0]-44,28,str(d.page))
def build(name,pages):
 flow=[]
 for i,page in enumerate(pages):
  if i:flow.append(PageBreak())
  flow+=page
 SimpleDocTemplate(str(OUT/name),pagesize=A4,rightMargin=44,leftMargin=44,topMargin=37,bottomMargin=56,title=name[:-4],author='Equipo SIGAA',subject='Incremento 0.9.1 para revisión').build(flow,onFirstPage=footer,onLaterPages=footer)
class Sequence(Flowable):
 def __init__(self,actors,steps):self.actors=actors;self.steps=steps;self.width=507;self.height=85+len(steps)*42
 def draw(self):
  c=self.canv;xs=[35+i*437/(len(self.actors)-1) for i in range(len(self.actors))];top=self.height-20
  c.setFont('Body',8);c.setStrokeColor(G)
  for x,label in zip(xs,self.actors):
   c.setFillColor(LIGHT);c.roundRect(x-34,top-21,68,29,5,fill=1,stroke=1);c.setFillColor(INK);c.drawCentredString(x,top-9,label);c.setDash(3,3);c.line(x,top-24,x,13);c.setDash()
  for i,(a,b,label) in enumerate(self.steps):
   y=top-55-i*42;x1,x2=xs[a],xs[b];c.setStrokeColor(G);c.setFillColor(INK)
   if a==b:
    c.line(x1,y,x1+24,y);c.line(x1+24,y,x1+24,y-12);c.line(x1+24,y-12,x1,y-12);end=x1;dy=y-12;direction=-1
    c.drawString(x1+5,y+8,label)
   else:
    c.line(x1,y,x2,y);end=x2;dy=y;direction=1 if x2>x1 else -1;c.drawCentredString((x1+x2)/2,y+8,label)
   c.line(end,dy,end-direction*6,dy+3);c.line(end,dy,end-direction*6,dy-3)
class UseCases(Flowable):
 def __init__(self):self.width=507;self.height=330
 def draw(self):
  c=self.canv;c.setStrokeColor(G);c.setFillColor(LIGHT);c.roundRect(132,10,366,310,10,fill=1,stroke=1);c.setFillColor(G);c.setFont('Bold',11);c.drawCentredString(315,299,'SIGAA - alcance implementado')
  rows=[('Todos','Iniciar sesión y cerrar sesiones'),('Administración','Gestionar estructura y matrículas'),('Docente','Registrar y publicar datos académicos'),('Inspectoría','Justificar ausencias y gestionar casos'),('Dirección / UTP','Consultar seguimiento autorizado'),('Estudiante','Consultar datos propios publicados')]
  for i,(actor,case) in enumerate(rows):
   y=264-i*45;c.setFont('Body',9);c.setFillColor(INK);c.drawString(0,y,actor);c.line(107,y+3,151,y+3);c.setFillColor(colors.white);c.ellipse(151,y-14,481,y+20,fill=1,stroke=1);c.setFillColor(INK);c.drawCentredString(316,y,case)

report=[]
report.append(head('Desarrollo / Sprint 5 / incremento 0.9.1','Avance de desarrollo')+[
 p('SIGAA organiza la gestión académica y el seguimiento de estudiantes de colegios y liceos. Reúne datos escolares, asistencia, notas, anotaciones, alertas, casos y apoderados, con acceso según el rol y los cursos autorizados.'),
 h('Dónde estamos'),p('Al 28 de octubre corresponde el Sprint 5, cuya ventana planificada termina el 31 de octubre. Este incremento completa avisos internos y dos faltantes del portal estudiante. Casos, apoderados y ficha integral ya implementados se volvieron a probar con PostgreSQL 16 en Docker.'),
 table([['Tarjeta existente','Resultado técnico','Aceptación'],['SCRUM-35 / 36 / 48','Casos, ficha integral y apoderados: regresión aprobada.','Por revisar'],['SCRUM-37','Avisos persistentes del seguimiento de casos.','Por revisar'],['SCRUM-51','Asignaturas vigentes y calendario propio del estudiante.','Por revisar'],['SCRUM-21','UML actualizado con flujos persistentes y autenticación.','Por revisar'],['SCRUM-52','Instalación Docker y reinicio comprobados; prueba de varios equipos/HTTPS pendiente.','En curso']],[104,280,123]),
 h('Lo que significa este avance'),p('El código está preparado para revisión. No acredita cierre de sprints, aceptación del Product Owner, integración a main ni despliegue de esta versión. El entorno público no fue actualizado en esta verificación. No se crearon reuniones, dailys ni retrospectivas ficticias.'),p('Repositorio: SIGAA-Capstone-2026 · Rama: feature/sprint-5-seguimiento · Solicitud de revisión existente: #1.','small')])
report.append(head('Uso / estudiante y docente','Asignaturas y calendario')+[
 p('<b>Estudiante.</b> En “Mis asignaturas” aparecen las asignaturas de sus matrículas activas, con curso, periodo y docente. En “Mi calendario” selecciona un mes para ver clases publicadas y evaluaciones publicadas o cerradas. No ve borradores ni clases canceladas.'),
 p('<b>Docente.</b> En asistencia, crea una clase futura y selecciona “Publicar en calendario”. Puede retirarla mientras siga programada. Publicar una clase no registra asistencia; las clases realizadas siguen el flujo de asistencia ya existente.'),
 shot('03-calendario.png',335),
 h('Controles de acceso'),p('La API comprueba identidad, matrícula y asignatura vigentes en cada consulta. Un estudiante no puede consultar el calendario de otro. La edición exige permiso docente, token contra solicitudes falsificadas y la revisión actual del registro; una edición simultánea se rechaza para evitar sobrescribir cambios.'),p('Límites: consultas de hasta 92 días y 500 eventos; si hay más, la interfaz lo informa. El calendario no incluye exportación a agendas externas.','small')])
report.append(head('Uso / equipo escolar','Avisos de seguimiento')+[
 p('Una apertura, intervención, cambio, cierre o reapertura de caso puede generar un aviso al responsable actual y al creador, si son usuarios activos y distintos de quien realizó la acción. El aviso se guarda en la misma transacción que el cambio.'),
 table([['Acción','Cómo usarla'],['Consultar','Abrir “Avisos”; filtrar Todos o Sin leer. Cada página muestra hasta 25 registros.'],['Leer','“Marcar como leído” conserva la fecha de lectura, incluso tras recargar.'],['Abrir contexto','“Ver caso” abre el caso asociado dentro del alcance permitido.'],['Actualizar','Usar “Actualizar avisos” o volver a cargar los datos; no hay envío externo ni actualización en tiempo real.']],[100,407]),
 shot('05-avisos-movil.png',280),
 p('Los avisos no copian notas sensibles del caso. La API vuelve a comprobar el destinatario y su acceso actual al curso: perder la asignación oculta los avisos correspondientes. Estudiantes no reciben ni leen avisos internos. No incluye correo, mensajes al apoderado, notificaciones push ni reconstrucción de eventos pasados.','small')])
report.append(head('Verificación / evidencia reproducible','Pruebas y correcciones')+[
 table([['Comprobación','Resultado y alcance'],['6 pruebas unitarias','Aprobadas en Node 22 dentro de Docker.'],['66 pruebas de integración','Aprobadas contra PostgreSQL 16 aislado: permisos, transacciones, concurrencia, migraciones y persistencia.'],['27 recorridos de navegador','8 nuevos de portal/avisos + 8 de casos/apoderados/ficha + 11 de operación escolar. Chromium y datos ficticios; comprobaciones móviles incluidas.'],['Compilación web','Vite produce el paquete de producción correctamente.'],['Docker desde cero','PostgreSQL, API y Nginx saludables; migraciones 001-010; acceso autenticado para administración, docente y estudiante.'],['Reinicio','Cuentas y sesiones continúan funcionando a través de Nginx después de reiniciar base y API. Base sin puerto publicado; web/API solo en loopback.']],[145,362]),
 h('Defectos detectados y corregidos'),p('1. PostgreSQL rechazaba parámetros de tipos ambiguos al generar avisos. Se añadieron conversiones SQL explícitas y pasaron las pruebas de evento y reversión de transacciones.'),p('2. Nginx conservaba la IP anterior de la API y devolvía 502 después del reinicio. Ahora resuelve el servicio mediante el DNS de Docker, con caché de cinco segundos. Se repitió el reinicio y se verificó la sesión a través de la web.'),
 h('Dónde está la evidencia'),p('Directorio: <b>output/evidence/sprint-5-completion/</b>. Incluye resultados de API, tres archivos de recorridos de navegador, capturas y resultado de instalación/reinicio. Las pruebas usaron bases aisladas; no modificaron alumnos ni servicios productivos.'),
 p('La prueba no acredita restauración de un respaldo productivo, validación humana de accesibilidad, ensayo en todos los sistemas operativos ni HTTPS del incremento 0.9.1.','small')])
report.append(head('Operación / preparación del release','Instalar y actualizar')+[
 h('Copia local para el equipo'),p('Requisito: Docker con Compose. Entrar a la carpeta de aplicación, copiar .env.example a .env y definir una contraseña propia. APP_ORIGIN debe coincidir con la dirección usada en el navegador. La instalación nueva no crea cuentas por defecto.'),
 p('docker compose up --build -d','code'),p('La base local es independiente del servidor. El puerto de PostgreSQL no se publica. Para datos ficticios, usar el sembrador documentado en README únicamente en una instalación vacía y guardar sus credenciales fuera de Git.'),
 h('Base escolar existente'),p('Antes de una actualización real: obtener y probar un respaldo, coordinar la interrupción y conservar la imagen anterior. La migración 010 añade notificacion_interna y metadatos; no borra información ni genera avisos históricos. El migrador aplica 007, 008, 009 y 010 de forma repetible.'),
 p('docker compose build api<br/>docker compose stop api<br/>docker compose run --rm --no-deps api npm run migrate<br/>docker compose up -d --build','code'),
 p('Los comandos anteriores corresponden a compose.yaml. Un despliegue con una base externa requiere usar su configuración y un rol migrador con permiso DDL; no se debe copiar el comando sin revisar ese entorno. Nunca repetir la migración 003 ni eliminar volúmenes para actualizar.'),
 h('Rol SQL de ejecución restringido'),p('Después de crear la tabla con el rol migrador, conceder al rol real de la aplicación SELECT, INSERT y UPDATE sobre notificacion_interna. El identificador se genera como UUID, por lo que no necesita una secuencia. Mantener separados el usuario de migraciones y el de ejecución cuando el despliegue los utilice.'),
 h('Volver atrás'),p('Detener la versión nueva y restaurar la imagen anterior si la validación falla. La tabla adicional puede conservarse sin eliminar datos. Un respaldo solo debe restaurarse después de evaluar los cambios posteriores al respaldo y durante una ventana acordada.'),
 p('Esta entrega prepara el procedimiento; no ejecuta una migración ni un rollback productivo.','small')])
report.append(head('Plan / cierre verificable','Qué queda para estar al día')+[
 table([['Orden','Trabajo siguiente','Evidencia de cierre'],['1','Revisión funcional del equipo y Joel sobre 0.9.1.','Recorrer clases/calendario, casos, avisos y permisos; registrar observaciones y aceptación real.'],['2','Revisar e integrar la solicitud #1.','Código aprobado en main; mantener tarjetas existentes.'],['3','Preparar respaldo y desplegar el incremento.','Restauración ensayada, migraciones verificadas, roles y flujos probados en HTTPS.'],['4','Completar SCRUM-52 / OPS-01.','Prueba desde equipos y accesos normales del equipo; registrar dispositivos y resultado.'],['5','Continuar Sprint 6 (2-14 noviembre).','Auditoría y pruebas integrales/seguridad, manuales y preparación de entrega según el backlog acordado.']],[38,232,237]),
 h('Seguimiento de Scrum'),p('SCRUM-37 y SCRUM-51 quedan preparados para “En revisión”; SCRUM-21 se presenta con UML actualizado. SCRUM-35, SCRUM-36 y SCRUM-48 conservan revisión. SCRUM-52 continúa en curso por las verificaciones restantes. No se alteran sprints históricos, puntos ni fechas para aparentar un cierre anterior.'),
 h('Documentos que se mantienen pendientes'),p('La validación personal de reflexiones y autoevaluaciones, las planillas del docente y el informe final no se sustituyen por pruebas de software. Los informes y la presentación anteriores conservan el corte 0.9.0; este informe complementa ese corte con la evidencia 0.9.1.'),
 h('Repetir la verificación'),p('Definir TEST_DB_PASSWORD privado y ejecutar compose.test.yaml para las pruebas de API. Para navegador, usar una base vacía y aislada en TEST_DATABASE_URL y ejecutar verify-portal-notifications-browser.mjs, verify-followup-browser.mjs y verify-operations-browser.mjs. Los scripts crean y eliminan bases de prueba propias.'),
 p('Fuente técnica: apps/api/src, apps/web/src, infra/postgres/init/010_internal_notifications.sql y la evidencia de este incremento. Fuente de planificación: tarjetas existentes de Jira y carta Gantt del repositorio.','small')])
build('Avance de desarrollo Sprint 5 - SIGAA.pdf',report)

uml=[]
uml.append(head('Arquitectura / SCRUM-21 / 0.9.1','UML de flujos persistentes')+[
 p('Modelo de la implementación revisada al 28 de octubre de 2026. Los actores representan permisos de software; no asignaciones personales del equipo.'),UseCases(),
 h('Límites del modelo'),p('Apoderado es una entidad gestionada por el equipo escolar; no tiene inicio de sesión implementado. El motor de alertas se ejecuta dentro de la API, no como servicio externo ni como una reunión del equipo. Las consultas del estudiante excluyen seguimiento interno.'),
 p('Fuentes: school-app.js, teacher-routes.js, academic-routes.js, support-routes.js, risk-engine.js, structure-routes.js, followup-routes.js, student-portal.js y notification-routes.js. El PDF reemplaza las afirmaciones de alcance futuro del diagrama inicial; no acredita aceptación del PO.','small')])
uml.append(head('Secuencia 01 / sesión real','Autenticación y permisos')+[
 Sequence(['Usuario','Web','API','PostgreSQL'],[(0,1,'Introduce correo y clave'),(1,2,'POST /auth/login'),(2,3,'Límites, cuenta y hash scrypt'),(2,2,'Verifica clave y rol vigente'),(2,3,'Guarda hash del token y expiración'),(2,1,'Cookie HttpOnly y token CSRF'),(1,2,'Consulta protegida con cookie'),(2,3,'Sesión activa y alcance actual'),(2,1,'Solo datos autorizados')]),
 p('Alternativas: credenciales inválidas → 401; exceso de intentos → 429; sesión revocada o expirada → 401; rol o alcance insuficiente → 403/404 según el recurso. Las modificaciones exigen origen autorizado y CSRF.'),
 p('Cerrar sesión revoca su token. Cerrar todas las sesiones y cambiar contraseña invalidan sesiones según el flujo de seguridad. El rol se obtiene en el servidor; ocultar un menú no constituye autorización.','small')])
uml.append(head('Secuencia 02 / operación académica','Publicar y consultar')+[
 Sequence(['Docente','Web','API','PostgreSQL'],[(0,1,'Programa clase / registra evaluación'),(1,2,'Envía datos y revisión actual'),(2,3,'Valida asignación y bloquea registro'),(2,3,'Guarda datos y evento de auditoría'),(0,1,'Publica clase programada'),(1,2,'PATCH clase/publication'),(2,3,'Transacción: publicación + revisión'),(2,1,'Registro actualizado')]),
 h('Lectura del estudiante'),p('GET /student/workspace/:id devuelve asignaturas de su matrícula vigente. GET /student/calendar/:id filtra identidad, matrícula, curso y periodo activos; agrega clases no canceladas publicadas y evaluaciones visibles publicadas/cerradas. Las notas, asistencia y anotaciones conservan sus filtros de publicación.'),
 p('La asistencia requiere una clase válida y lista de estudiantes autorizada. Notas y anotaciones se registran y publican por sus rutas específicas. El motor recalcula alertas en los flujos académicos que lo invocan; publicar únicamente una clase futura no crea asistencia ni riesgo académico.','small')])
uml.append(head('Secuencia 03 / alerta, caso y avisos','Seguimiento transaccional')+[
 Sequence(['Equipo','Web','API','PostgreSQL'],[(0,1,'Consulta alerta y abre caso'),(1,2,'POST /followup/cases'),(2,3,'Valida alcance, responsable y alerta'),(2,3,'Inserta caso activo único por alerta'),(2,3,'Actividad + auditoría + avisos'),(2,1,'Confirma solo tras COMMIT'),(0,1,'Interviene, cierra o reabre'),(1,2,'Envía expectedRevision y motivo'),(2,3,'Bloqueo, revisión y cambio atómico'),(2,1,'Resultado / conflicto 409')]),
 p('Estados del caso: abierto, en_curso y cerrado. Cerrar requiere resultado; reabrir conserva historial. Un docente modifica solo los casos que le permite su responsabilidad y curso. Cerrar el caso no resuelve automáticamente la alerta.'),
 p('El aviso se dirige al creador y responsable activos, excluye al actor y se deduplica por destinatario/caso/revisión. Si la transacción falla, tampoco queda el aviso. La lectura vuelve a comprobar acceso; marcar leído es idempotente.','small')])
uml.append(head('Secuencia 04 / apoderados y ficha','Vínculos y privacidad')+[
 Sequence(['Equipo','Web','API','PostgreSQL'],[(0,1,'Registra o edita apoderado'),(1,2,'POST/PUT /guardians'),(2,3,'Valida rol, código y revisión'),(2,3,'Guarda contacto + auditoría'),(0,1,'Vincula estudiante y principal'),(1,2,'POST /guardians/:id/links'),(2,3,'Valida vínculo y principal único'),(2,1,'Vínculo persistente'),(1,2,'GET /students/:id/dossier'),(2,3,'Lectura consistente por alcance'),(2,1,'Secciones autorizadas')]),
 p('Administración e Inspectoría gestionan apoderados; Dirección/UTP consulta. Docente ve nombres y parentesco en la ficha autorizada, sin teléfono ni correo. Estudiante recibe solo información académica propia publicada, sin casos, contactos ni alertas internas.'),
 p('La ficha usa una transacción de lectura REPEATABLE READ. Limita cada sección a 500 registros e informa truncamiento. Anotaciones privadas ajenas se ocultan también al personal. Inactivar un apoderado con vínculos activos exige resolver primero esos vínculos.','small')])
uml.append(head('Secuencia 05 / estructura y justificación','Gestión escolar')+[
 Sequence(['Personal','Web','API','PostgreSQL'],[(0,1,'Administración configura estructura'),(1,2,'POST/PUT /structure/:kind'),(2,3,'Valida ADMIN y dependencias'),(2,3,'Persiste y audita en transacción'),(0,1,'Inspectoría registra justificación'),(1,2,'Envía ausencia, motivo y respaldo'),(2,3,'Comprueba ausencia de clase realizada'),(2,3,'Guarda justificación y auditoría'),(0,1,'Aprueba/rechaza con motivo'),(2,3,'Actualiza estado y recalcula riesgo')]),
 p('La administración mantiene periodos, cursos, asignaturas, asignaciones y matrículas con las reglas de integridad implementadas. La autorización se verifica aunque una llamada se haga fuera de la interfaz.'),
 p('Inspectoría solo justifica una ausencia vigente de una clase realizada y no futura. El estudiante consulta su estado permitido; no accede a documentos internos de otros alumnos. Cambios simultáneos o ausencia modificada se rechazan.','small'),
 h('Reglas de alerta'),p('La API evalúa reglas versionadas sobre datos publicados. Guarda evidencia e historial y evita duplicar alertas activas. El recalculado puede solicitarse explícitamente; los avisos de este incremento corresponden a eventos de casos, no a cada recalculado.')])
uml.append(head('Componentes / despliegue y comprobación','De la interfaz a los datos')+[
 Sequence(['Navegador','Nginx','API Node','PostgreSQL'],[(0,1,'HTTP local / HTTPS en despliegue'),(1,2,'/api/* → ruta de API'),(1,1,'Resuelve api por DNS de Docker'),(2,3,'Pool SQL y transacciones')]),
 h('Persistencia y migraciones'),p('La migración 009 soporta casos y vínculos; 010 añade avisos. Al arrancar, la API exige metadatos de seguridad, operación, seguimiento y notificaciones. La instalación nueva carga 001-010 y no genera cuentas predeterminadas.'),
 h('Configuración verificada'),p('En la copia de pruebas Docker, PostgreSQL no expone puerto al host y API/web se publican solo en loopback. Se usó un proyecto y volumen propios; no se conectaron a la base productiva. Nginx renueva la resolución interna para recuperar conectividad tras cambios de IP.'),
 table([['Flujo','Evidencia automatizada'],['Sesión y permisos','Suite de seguridad e integración; accesos negativos y sesiones persistentes.'],['Académico y calendario','Pruebas API y ocho recorridos nuevos del portal/avisos.'],['Casos, ficha y apoderados','Integración y ocho recorridos de regresión.'],['Estructura y justificaciones','Integración y once recorridos de regresión.']],[155,352]),
 p('El modelo describe el código candidato 0.9.1. No prueba el despliegue HTTPS, aceptación humana, notificación por correo ni cierre administrativo del proyecto.','small')])
build('UML de flujos persistentes - SIGAA.pdf',uml)
print('Generated two PDFs')

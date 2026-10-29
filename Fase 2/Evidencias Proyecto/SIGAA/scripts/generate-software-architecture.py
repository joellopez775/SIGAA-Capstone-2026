"""Render SIGAA's implemented software architecture as a vector PDF."""
from pathlib import Path
import json,hashlib,subprocess,math
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A3,landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/Diagrama de arquitectura de software actualizado - SIGAA.pdf'
SOURCES=['apps/web/src/main.jsx','apps/web/src/SecureApp.jsx','apps/web/src/AcademicPanel.jsx','apps/web/src/OperationsPanel.jsx','apps/web/src/FollowupPanel.jsx','apps/web/src/StudentPortal.jsx','apps/web/src/NotificationsPanel.jsx','apps/web/nginx.conf','apps/web/Dockerfile','apps/web/vite.config.js','apps/web/package.json','apps/api/package.json','apps/api/Dockerfile','apps/api/src/app.js','apps/api/src/server.js','apps/api/src/school-app.js','apps/api/src/security.js','apps/api/src/origins.js','apps/api/src/repository.js','apps/api/src/teacher-routes.js','apps/api/src/academic-routes.js','apps/api/src/structure-routes.js','apps/api/src/support-routes.js','apps/api/src/risk-engine.js','apps/api/src/followup-routes.js','apps/api/src/student-portal.js','apps/api/src/notification-routes.js','apps/api/src/migrate.js','compose.yaml','compose.server.yaml','compose.hosted.yaml','compose.test.yaml','infra/postgres/init/010_internal_notifications.sql','output/evidence/sprint-5-completion/validation.json','output/evidence/database-schema-0.9.1.json']
assert all((ROOT/p).is_file() for p in SOURCES)
validation=json.loads((ROOT/'output/evidence/sprint-5-completion/validation.json').read_text())
assert validation['version']=='0.9.1' and validation['result']=='passed'
manifest={'version':'0.9.1','cutoff':'2026-10-28 America/Santiago','sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'scope':'Code architecture, validated local Docker and configured server profiles; not a live production audit','sources':[{'path':p,'sha256':hashlib.sha256((ROOT/p).read_bytes()).hexdigest()} for p in SOURCES]}
for name,path,index in [('Georgia','/System/Library/Fonts/Supplemental/Georgia.ttf',0),('Body','/System/Library/Fonts/HelveticaNeue.ttc',0),('Bold','/System/Library/Fonts/HelveticaNeue.ttc',1)]:pdfmetrics.registerFont(TTFont(name,path,subfontIndex=index))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
G=colors.HexColor('#174b3b');GOLD=colors.HexColor('#b79851');INK=colors.HexColor('#253f35');LIGHT=colors.HexColor('#edf3ee');GRAY=colors.HexColor('#f1f3f3');BORDER=colors.HexColor('#b8c9be')
W,H=landscape(A3);C=canvas.Canvas(str(OUT),pagesize=(W,H));C.setTitle('Diagrama de arquitectura de software actualizado - SIGAA');C.setAuthor('Equipo SIGAA');page=0
styles={k:ParagraphStyle(k,fontName=f,fontSize=s,leading=l,textColor=col) for k,f,s,l,col in [('body','Body',12,17,INK),('small','Body',10,14,INK),('tiny','Body',9,12,INK),('heading','Georgia',16,20,G),('box','Body',11,15,INK),('white','Bold',11,15,colors.white)]}
def txt(t,x,y,w,style='body'):
 p=Paragraph(t,styles[style]);pw,ph=p.wrap(w,1000);assert y+ph<H-38,(page,t[:60],y,ph);p.drawOn(C,x,H-y-ph);return ph

def start(title,sub,source):
 global page
 page+=1;C.bookmarkPage('p'+str(page));C.addOutlineEntry(title,'p'+str(page),0,False)
 C.setFillColor(G);C.rect(0,H-12,W,12,fill=1,stroke=0);C.setFont('Georgia',28);C.drawString(38,H-54,title);txt(sub,38,72,W-76,'body')
 C.setStrokeColor(GOLD);C.line(38,45,W-38,45);C.setFillColor(INK);C.setFont('Body',9);C.drawString(38,29,'SIGAA · Arquitectura 0.9.1 · 28 octubre 2026');C.drawRightString(W-38,29,str(page)+' / 7');txt('Fuentes: '+source,38,H-70,W-76,'tiny')

def zone(x,y,w,h,label,fill=LIGHT):
 C.setFillColor(fill);C.setStrokeColor(BORDER);C.roundRect(x,H-y-h,w,h,14,fill=1,stroke=1);txt(label,x+15,y+12,w-30,'small')

def box(x,y,w,h,title,body='',fill=colors.white):
 C.setFillColor(fill);C.setStrokeColor(BORDER);C.roundRect(x,H-y-h,w,h,10,fill=1,stroke=1)
 ph=txt(title,x+14,y+12,w-28,'heading')
 if body:
  bh=txt(body,x+14,y+20+ph,w-28,'box');assert 20+ph+bh<=h-7,(page,title,h,ph,bh)

def arrow(points,label=None,lx=0,ly=0,lw=140,dashed=False):
 C.saveState();C.setStrokeColor(G);C.setFillColor(G);C.setLineWidth(1.5)
 if dashed:C.setDash(4,3)
 p=C.beginPath();p.moveTo(points[0][0],H-points[0][1])
 for x,y in points[1:]:p.lineTo(x,H-y)
 C.drawPath(p);C.setDash();(x0,y0),(x,y)=points[-2:];a=math.atan2(y-y0,x-x0)
 p=C.beginPath();p.moveTo(x,H-y)
 for sign in [-1,1]:p.lineTo(x-8*math.cos(a)+sign*3.5*math.sin(a),H-(y-8*math.sin(a)-sign*3.5*math.cos(a)))
 p.close();C.drawPath(p,fill=1,stroke=0);C.restoreState()
 if label:txt(label,lx,ly,lw,'small')

def table(rows,widths,x,y):
 cells=[[Paragraph(escape(str(t)).replace('\n','<br/>'),styles['white' if i==0 else 'small']) for t in row] for i,row in enumerate(rows)]
 t=Table(cells,colWidths=widths,repeatRows=1);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),G),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,colors.white]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),11),('RIGHTPADDING',(0,0),(-1,-1),11),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]));tw,th=t.wrap(W,H);assert y+th<H-78,(page,th);t.drawOn(C,x,H-y-th);return th

def end():C.showPage()

start('01 / Vista general del sistema','Aplicación web para la gestión académica y el seguimiento de estudiantes de colegios y liceos.','main.jsx, SecureApp.jsx, school-app.js, server.js, nginx.conf y compose.yaml.')
roles=['Administración','Docente','Estudiante','Inspectoría','Dirección / UTP']
for i,r in enumerate(roles):box(38+i*225,124,210,58,r)
zone(38,213,270,277,'En el equipo del usuario')
zone(337,213,815,277,'Servicios de la aplicación · Ruta local validada con Docker')
box(54,270,238,160,'Interfaz React','Se ejecuta en el navegador.<br/>Vistas por rol, formularios y navegación.<br/>Envía solicitudes JSON a /api.')
box(355,270,195,160,'Nginx','Sirve HTML, CSS y JavaScript.<br/>Reenvía /api a la API y añade cabeceras de seguridad.')
box(612,270,230,160,'API Express','Node.js en un único proceso.<br/>Identidad, permisos, reglas escolares, validación y operaciones persistentes.')
box(904,270,230,160,'PostgreSQL 16','33 tablas y 70 claves foráneas.<br/>Datos escolares, sesiones, auditoría, casos y avisos.')
arrow([(292,350),(355,350)],'/api',304,325,50);arrow([(550,350),(612,350)],'HTTP',563,325,50);arrow([(842,350),(904,350)],'SQL',858,325,45)
txt('Las respuestas regresan por la misma ruta. En servidor, Cloudflare y su conector se sitúan antes de Nginx; ese perfil se detalla en la página 4.',54,451,1070,'small')
txt('Decisión arquitectónica',38,524,1070,'heading')
txt('Monolito modular con separación entre presentación, API y persistencia. Los módulos funcionales comparten proceso, conexión PostgreSQL y controles de acceso. Esta organización permite transacciones coherentes y un despliegue Docker manejable por el equipo.',38,554,1080)
zone(38,635,1114,107,'Herramientas de trabajo del proyecto, fuera de las solicitudes de los usuarios',GRAY)
txt('<b>GitHub</b> · Código, documentos y revisión',60,680,340);txt('<b>Jira</b> · Historias, tareas y sprints',430,680,330);txt('<b>Docker Compose</b> · Ejecución y pruebas',795,680,330)
end()

start('02 / Componentes y módulos','La interfaz consume la API; la autorización y las reglas se resuelven en el servidor.','SecureApp.jsx, paneles React, school-app.js, *-routes.js, risk-engine.js y repository.js.')
zone(38,145,290,549,'Presentación · React')
box(54,193,258,474,'SecureApp.jsx','Entrada desde main.jsx.<br/><br/><b>AcademicPanel</b>: clases, asistencia, notas y anotaciones.<br/><br/><b>OperationsPanel</b>: estructura, reglas, alertas y justificaciones.<br/><br/><b>FollowupPanel</b>: casos, apoderados y ficha.<br/><br/><b>StudentPortal</b>: asignaturas y calendario.<br/><br/><b>NotificationsPanel</b>: avisos internos.<br/><br/><b>GlassNavigation</b>: navegación por rol.')
zone(382,145,455,549,'Negocio y acceso · Un proceso Express')
box(398,190,423,83,'school-app.js','Sesión, origen, CSRF, roles y rutas comunes.')
mods=[('teacher + academic','Clases, asistencia, notas y anotaciones.'),('structure-routes','Estructura escolar y asignaciones.'),('support + risk-engine','Reglas, alertas y justificaciones.'),('followup-routes','Apoderados, casos y ficha integral.'),('student-portal','Asignaturas y calendario propio.'),('notification-routes','Avisos y lectura persistente.')]
for i,(a,b) in enumerate(mods):box(398+(i%2)*218,300+(i//2)*119,205,105,a,b)
box(892,245,260,166,'Acceso a datos','pg: SQL parametrizado y pool de hasta 10 conexiones.<br/>repository.js: transacciones, auditoría y controles compartidos.')
box(892,493,260,151,'PostgreSQL','Restricciones, índices y relaciones.<br/>Las rutas ejecutan SQL y utilizan helpers compartidos.')
arrow([(328,231),(382,231)],'JSON',334,207,50);arrow([(837,352),(892,352)],'SQL',845,326,45);arrow([(1022,411),(1022,493)],'Pool pg',1037,445,100)
txt('Los módulos anteriores son archivos del mismo servicio. Las validaciones de rol y curso se ejecutan aunque la petición no provenga de la interfaz. Los avisos se insertan dentro de la transacción del caso; su consistencia no depende de una cola externa.',38,718,1114,'body')
end()

start('03 / Seguridad de una solicitud','Sesiones persistentes y comprobación de permisos en cada operación protegida.','school-app.js, security.js, origins.js, repository.js y migración 007.')
txt('A. Inicio de sesión',38,135,1080,'heading')
login=[('Credenciales','Correo y contraseña en el navegador.'),('Validación','Origen exacto, límite de intentos y scrypt.'),('Persistencia','Hash del token, usuario y expiración en PostgreSQL.'),('Sesión del navegador','Cookie HttpOnly y token CSRF devueltos al cliente.')]
for i,(t,b) in enumerate(login):
 x=38+i*284;box(x,177,260,126,t,b)
 if i<3:arrow([(x+260,240),(x+284,240)])
txt('B. Operación protegida: por ejemplo, modificar un caso',38,344,1080,'heading')
steps=[('Origen y formato','Origen permitido, JSON y cuerpo de hasta 32 kB.'),('Identidad vigente','Cookie → hash → sesión no expirada ni revocada.'),('Autorización','Rol actual, curso o matrícula y token CSRF al escribir.'),('Operación SQL','Validar datos y revisión; confirmar la transacción.')]
for i,(t,b) in enumerate(steps):
 x=38+i*284;box(x,386,260,145,t,b)
 if i<3:arrow([(x+260,458),(x+284,458)])
zone(38,575,540,154,'Sesión y contraseña')
txt('Cookie Secure en producción, SameSite=Strict y ruta /. Duración configurada: 8 horas, con inactividad máxima de 30 minutos. Cambiar contraseña revoca sesiones. La base conserva hashes del token y de la contraseña.',56,619,502,'small')
zone(602,575,550,154,'Respuesta ante una condición inválida')
txt('La petición se rechaza antes de modificar el recurso: 401 por sesión inválida; 403/404 según el recurso fuera del alcance; 409 ante una revisión desactualizada; 429 al superar límites. El menú visible no determina el permiso efectivo.',620,619,514,'small')
end()

start('04 / Despliegue de servidor configurado','Perfil compose.server.yaml · Arquitectura preparada para HTTPS, no auditoría del servidor público actual.','compose.server.yaml, nginx.conf, Dockerfile de API/web y origins.js.')
box(38,236,215,92,'Navegador','https://sigaa.ignisert.com')
box(38,408,215,105,'Cloudflare','Entrada HTTPS y ruta hacia el túnel configurado.')
arrow([(145,328),(145,408)],'HTTPS',159,357,85)
zone(300,165,852,532,'Mac servidor / Docker Engine')
zone(323,218,505,397,'Red frontend',colors.HexColor('#edf3ee'))
zone(851,218,279,465,'Red backend · internal: true',colors.HexColor('#f2efe7'))
box(345,282,207,109,'cloudflared','Conector del túnel.<br/>Token en secreto de Docker.')
box(594,282,207,109,'Nginx :8080','Archivos React y proxy hacia API :3000.')
box(735,444,220,113,'API :3000','Conectada a frontend y backend.<br/>Proceso Node.js / Express.')
box(892,592,220,71,'PostgreSQL :5432','Volumen persistente propio.')
arrow([(253,460),(275,460),(275,337),(345,337)],'Túnel cifrado',263,404,85)
arrow([(552,337),(594,337)],'HTTP',553,308,45)
arrow([(698,391),(698,500),(735,500)],'HTTP interno',610,443,112)
arrow([(955,500),(1002,500),(1002,592)],'SQL privado',1016,541,100)
txt('Exposición y cifrado',38,581,238,'heading')
txt('Este perfil no publica puertos del host. El usuario entra por Cloudflare; no recibe acceso directo a PostgreSQL ni al sistema operativo.',38,614,238,'small')
txt('HTTPS termina en Cloudflare y el enlace al conector va cifrado. Los tramos entre contenedores usan HTTP y SQL privados sin TLS explícito en esta configuración. El aislamiento de red y el cifrado son controles distintos. Las flechas representan solicitudes; el conector establece el túnel saliente.',38,720,1114,'small')
end()

start('05 / Construcción y configuraciones Docker','Separación entre compilación, ejecución local y perfiles de servidor disponibles en el repositorio.','Dockerfile de web/API, compose.yaml, compose.hosted.yaml, compose.server.yaml y vite.config.js.')
box(38,142,244,118,'Código fuente','React, API, SQL, configuración y documentación en GitHub.')
box(328,142,244,118,'Construcción','Web: Node 22 + Vite.<br/>API: npm ci, dependencias de ejecución y código.')
box(618,142,244,118,'Imágenes','Web: Nginx + dist.<br/>API: Node 22, usuario node.<br/>Base: PostgreSQL 16.')
box(908,142,244,118,'Servicios','Compose crea redes y volúmenes. Healthchecks ordenan el arranque.')
for x in [282,572,862]:arrow([(x,201),(x+46,201)])
txt('Perfiles existentes',38,301,1000,'heading')
table([['Perfil','Conexión y aislamiento','Alcance del documento'],['compose.yaml','Base propia sin puerto al host. Web 127.0.0.1:8088 y API 127.0.0.1:3000 por defecto; red bridge compartida.','Instalación y reinicio de 0.9.1 verificados en un proyecto Docker aislado.'],['compose.server.yaml','Web/conector en frontend; API en ambas redes; base en backend interno. Túnel mediante token secreto, sin ports del host.','Configuración preparada; esta entrega no la aplica ni acredita despliegue 0.9.1.'],['compose.hosted.yaml','API y web del despliegue separado. Base externa en sigaa_database_private; conector de URL temporal hacia web.','La base y la configuración del túnel permanente se administran aparte. Revisar antes de actualizar producción.']],[205,505,404],38,342)
txt('Desarrollo y actualización',38,610,1100,'heading')
txt('Vite se usa para desarrollo y compilación; en la imagen web los archivos se sirven con Nginx. Nginx resuelve el servicio api por DNS de Docker con caché de cinco segundos para recuperarse de cambios de IP.',38,643,1114)
txt('Una instalación vacía aplica 001-010. Una base escolar existente usa el migrador aditivo 007-010, tras respaldo y ensayo de restauración. server.js comprueba las versiones de esquema antes de escuchar. La configuración hosted exige preparar la migración con su entorno y permisos.',38,704,1114,'small')
end()

start('06 / Flujo persistente de casos y avisos','El cambio del caso, su historial, la auditoría y sus avisos se confirman como una sola operación.','followup-routes.js, notification-routes.js, repository.js y migraciones 009-010.')
box(38,145,244,113,'Personal autorizado','Abre o modifica un caso desde la interfaz escolar.')
box(340,145,284,113,'API de seguimiento','Comprueba rol, curso, responsable y expectedRevision.')
box(682,145,260,113,'Bloqueo y transacción','Bloquea el registro y rechaza ediciones desactualizadas.')
arrow([(282,201),(340,201)]);arrow([(624,201),(682,201)])
zone(340,318,812,232,'Misma transacción PostgreSQL')
for x,t,b in [(360,'caso_seguimiento','Estado, responsable, plan y revisión.'),(559,'caso_actividad','Historial de cambios e intervenciones.'),(758,'evento_auditoria','Actor y cambios registrados.'),(957,'notificacion_interna','Referencia al evento y sus destinatarios.')]:box(x,369,177,139,t,b)
arrow([(812,258),(812,294),(745,294),(745,318)],'Escrituras atómicas',830,276,170)
box(38,363,244,145,'Resultado','COMMIT confirma el conjunto.<br/>ROLLBACK revierte también el aviso.<br/>Una clave única evita duplicados.')
arrow([(340,434),(282,434)])
box(38,606,310,109,'Bandeja de avisos','Consulta manual, filtros y paginación; lectura persistente.')
box(417,606,340,109,'Permiso comprobado de nuevo','Destinatario, rol y acceso actual al curso. “Ver caso” abre el recurso autorizado.')
box(825,606,327,109,'Datos del aviso','Creador/responsable activos, excluyendo al actor. Se guarda la referencia, no una copia de las notas del caso.')
arrow([(348,660),(417,660)]);arrow([(757,660),(825,660)])
txt('Alcance implementado: avisos internos de casos. Correo, push, mensajería externa y cuentas de apoderados no forman parte de este flujo.',38,740,1114,'small')
end()

start('07 / Trazabilidad y estado de verificación','Arquitectura del candidato 0.9.1; fuentes versionadas y límites de la evidencia disponible.','package.json, Dockerfiles, validation.json y database-schema-0.9.1.json.')
table([['Componente','Tecnología declarada','Responsabilidad'],['Interfaz','React 19.2.8 + Vite 8.2.4','Presentación, estado de interfaz y formularios por rol.'],['Entrada web','Nginx 1.27-alpine','Contenido estático, proxy /api y cabeceras de seguridad.'],['Servidor de aplicación','Node 22-alpine + Express 5.2.1','Sesiones, permisos, validación, reglas escolares y rutas de negocio.'],['Acceso SQL / datos','pg 8.23.0 + PostgreSQL 16-alpine','SQL parametrizado, transacciones, índices, restricciones y persistencia.'],['Infraestructura','Docker Compose + cloudflared','Contenedores, redes, volúmenes y túnel según el perfil elegido.']],[205,360,549],38,130)
txt('Evidencia ya registrada',38,461,535,'heading')
txt('6 pruebas unitarias y 66 de integración aprobadas con Docker/PostgreSQL 16; 27 recorridos Chromium; build web; instalación nueva y conservación de cuentas/sesiones tras reiniciar base y API. La evidencia está en output/evidence/sprint-5-completion/. No se repitieron esas pruebas para dibujar este PDF.',38,495,535)
txt('Alcance pendiente',618,461,534,'heading')
txt('Aceptación del Product Owner, integración a main y despliegue del incremento. Sigue pendiente el ensayo de HTTPS desde los equipos del grupo y la restauración de respaldo. Los diagramas no certifican una auditoría en vivo del servidor ni el cierre administrativo de los sprints.',618,495,534)
zone(38,636,1114,111,'Fuentes para reproducir y revisar',GRAY)
txt('Código base: '+manifest['sourceCommit'][:7]+'. El manifiesto architecture-software-0.9.1.json registra '+str(len(SOURCES))+' archivos y sus huellas SHA-256. Incluye rutas, paneles, configuración de red, migraciones y evidencia previa. El esquema de datos completo se consulta en el PDF de base de datos del mismo directorio.',56,678,1078,'small')
end();C.save()
r=PdfReader(OUT);assert len(r.pages)==7
for i,p in enumerate(r.pages):assert len(p.extract_text())>300,(i,'missing text')
manifest['pdfPages']=7;manifest['diagramViews']=['context and containers','components','security flow','configured server deployment','build and Docker profiles','case transaction and notifications','verification and sources'];manifest['productionDeploymentVerified']=False
(ROOT/'output/evidence/architecture-software-0.9.1.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Generated architecture PDF: 7 vector pages')

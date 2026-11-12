"""Build the deployment report exclusively from recorded verification evidence."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph,Table,TableStyle
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[1];E=ROOT/'output/evidence/deployment-0.9.1'
d=json.loads((E/'deployment.json').read_text());h=json.loads((E/'https-verification.json').read_text());p=json.loads((E/'https-policy.json').read_text());s=json.loads((E/'restored-workflows.json').read_text());j=json.loads((E/'jira-sync.json').read_text())
assert all(x['result']=='passed' for x in [d,h,p,s,j]);assert len(h['checks'])==8
out=ROOT/'output/pdf/Despliegue 0.9.1 y verificación HTTPS - SIGAA.pdf'
for n,path,index in [('Georgia','/System/Library/Fonts/Supplemental/Georgia.ttf',0),('Body','/System/Library/Fonts/HelveticaNeue.ttc',0),('Bold','/System/Library/Fonts/HelveticaNeue.ttc',1)]:pdfmetrics.registerFont(TTFont(n,path,subfontIndex=index))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
G=colors.HexColor('#174b3b');GOLD=colors.HexColor('#b79851');INK=colors.HexColor('#253f35');LIGHT=colors.HexColor('#edf3ee')
W,H=A4;C=canvas.Canvas(str(out),pagesize=A4);C.setTitle('Despliegue 0.9.1 y verificación HTTPS - SIGAA');C.setAuthor('Equipo SIGAA');page=0
styles={n:ParagraphStyle(n,fontName=f,fontSize=z,leading=l,textColor=co)for n,f,z,l,co in [('body','Body',10.5,15,INK),('small','Body',9,12,INK),('title','Georgia',24,28,G),('head','Georgia',15,20,G),('white','Bold',9,12,colors.white),('code','Courier',8,11,INK)]}
def text(t,y,style='body',x=42,w=W-84):
 a=Paragraph(t,styles[style]);_,hh=a.wrap(w,1000);assert y+hh<H-63,(page,y,hh,t[:50]);a.drawOn(C,x,H-y-hh);return y+hh

def start(title,sub):
 global page
 page+=1;C.setFillColor(G);C.rect(0,H-10,W,10,stroke=0,fill=1);text('SIGAA / ENTREGA OPERATIVA',28,'small');y=text(title,54,'title');text(sub,y+12,'body');C.setStrokeColor(GOLD);C.line(42,48,W-42,48);C.setFillColor(INK);C.setFont('Body',8);C.drawString(42,31,'28 octubre 2026 · America/Santiago · Versión 0.9.1');C.drawRightString(W-42,31,f'{page} / 5')
def section(title,body,y):y=text(title,y,'head');return text(body,y+8)+20
def table(rows,widths,y):
 cells=[[Paragraph(escape(str(x)),styles['white' if i==0 else 'small'])for x in row]for i,row in enumerate(rows)]
 t=Table(cells,colWidths=widths);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),G),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,colors.white]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]));_,hh=t.wrap(W,H);assert y+hh<H-63;(t.drawOn(C,42,H-y-hh));return y+hh+18

def end():C.showPage()
when=datetime.fromisoformat(d['verifiedAt']).astimezone(ZoneInfo('America/Santiago')).strftime('%d-%m-%Y, %H:%M:%S')
start('Despliegue y verificación HTTPS','Estado de la plataforma publicada y evidencia de la actualización de 0.8.0 a 0.9.1.')
y=section('Plataforma disponible','<b>https://sigaa.ignisert.com</b><br/>API y esquema 0.9.1 verificados el '+when+' (Chile). El servicio público ejecuta la nueva versión sobre la base existente.',153)
y=section('Qué se entrega','SIGAA apoya a colegios y liceos en la gestión académica y el seguimiento de sus estudiantes. Este incremento publica casos de seguimiento, apoderados, ficha integral, avisos internos y asignaturas/calendario estudiantil; conserva asistencia, notas, anotaciones y administración escolar.',y)
y=table([['Componente','Resultado'],['API','0.9.1; imagen construida desde '+d['codeCommit'][:7]],['Web','0.9.1; ajuste HTTPS '+p['webCommit'][:7]],['Datos','PostgreSQL 16; migraciones 009 y 010'],['Acceso','HTTPS válido, redirección HTTP 308 y HSTS solo en SIGAA'],['Infraestructura','Mismo servidor, volumen y túnel. Sin cambios de DNS ni correo.']],[115,W-199],y)
section('Alcance de esta entrega','La validación técnica del despliegue está completada. La aprobación funcional del Product Owner, la integración a main y las pruebas del equipo en varios dispositivos físicos siguen pendientes. No se registra cierre de sprint ni reuniones.',y)
end()
start('Respaldo y conservación de datos','Se verificó la restauración antes de sustituir los servicios de la aplicación.')
y=section('Dos copias, con funciones distintas','Primero se obtuvo una copia consistente en línea para ensayar la migración y las escrituras. Después se detuvo la API y se generó el respaldo definitivo <b>before-0.9.1.dump</b>, antes de aplicar cambios productivos. Ambos quedaron en una carpeta privada del servidor, con acceso restringido; no se publicaron en Git.',143)
y=table([['Control del respaldo definitivo','Evidencia'],['Tamaño',str(d['backup']['bytes'])+' bytes'],['Formato','pg_dump personalizado; inventario pg_restore válido'],['Restauración','Completa, en PostgreSQL 16 aislado y sin puertos públicos'],['Comparación','30 tablas + 1 vista: conteos y huellas de filas coinciden'],['Conservación tras migrar','29 tablas + 1 vista sin cambios en columnas originales; app_metadata cambia versión']],[210,W-294],y)
y=text('SHA-256 del respaldo definitivo',y,'head');sha=d['backup']['sha256'];y=text(sha[:32]+'<br/>'+sha[32:],y+8,'code')+24
y=section('Migración controlada','009_followup.sql y 010_internal_notifications.sql se aplicaron en una transacción. No había apoderados principales duplicados. Se verificaron los permisos del rol de ejecución para casos, historial y avisos. No se borraron volúmenes ni se recreó PostgreSQL.',y)
section('Datos comprobados en el ensayo','La copia restaurada conservó 80 estudiantes, 640 notas y 1.280 registros de asistencia. El esquema final tiene 33 tablas y una vista. Las pruebas de escritura se realizaron en la copia aislada, no sobre los registros académicos públicos.',y)
end()
start('Pruebas y límites de la verificación','Se separan los flujos que escriben en la copia restaurada de las consultas sobre el dominio público.')
y=table([['Ensayo sobre respaldo restaurado','Resultado'],['Acceso con las cuatro cuentas existentes','Aprobado'],['Publicar/retirar clase y comprobar calendario del estudiante','Aprobado'],['Crear/vincular apoderado y comprobar privacidad de la ficha','Aprobado'],['Caso, intervención, cierre, reapertura y aviso persistente','Aprobado'],['Restricciones de estudiante e Inspectoría','Aprobado']],[393,118],142)
y=text('Verificación pública por HTTPS',y,'head')+28
y=table([['Rol','Escritorio 1440 px','Móvil 390 px']]+[[label,'Aprobado','Aprobado']for label in ['Administración','Inspectoría','Docente','Estudiante']],[191,160,160],y)
y=section('Controles en los ocho recorridos','Inicio y cierre de sesión, persistencia al recargar, cookie Secure/HttpOnly/SameSite=Strict, rechazo CSRF, permisos de API y pantallas sin errores ni desbordamiento horizontal. Estudiantes ven sus datos y no reciben avisos de casos internos. Certificado validado normalmente, sin ignorar errores TLS.',y)
section('Límite de la evidencia','Son ocho sesiones Chromium en un mismo Mac, con dos tamaños de pantalla emulados. No equivalen a pruebas en ocho dispositivos. En producción solo se consultaron datos académicos; login/logout sí generan sesiones y auditoría.',y)
end()
start('Operación y recuperación','Procedimiento para el administrador autorizado del servidor.')
y=section('Ubicación y control','La entrega está en <b>~/Services/sigaa-releases/0.9.1-20261028-8058dd</b>. El respaldo y las imágenes anteriores se conservan bajo <b>~/Services/sigaa-backups/release-0.9.1-20261028-8058dd</b>. El manifiesto privado contiene el contexto y las huellas de filas. No copiar archivos .env, cuentas, tokens ni dumps al repositorio.',142)
y=section('Verificación cotidiana','Consultar /api/health por HTTPS: debe responder status ok y version 0.9.1. Comprobar la salud de sigaa-current-api-1, sigaa-current-web-1 y sigaa-db-1. El túnel permanente continúa separado. Ninguno de estos servicios publica puertos al host; la base sigue en su red privada.',y)
y=text('Si la aplicación presenta una regresión',y,'head')+28
steps=[('1. Registrar y proteger','Guardar el error y un nuevo respaldo consistente antes de una recuperación que afecte datos. No ejecutar down -v ni la migración 003.'),('2. Volver a las imágenes anteriores','Crear un override con sigaa-api:rollback-20261028-8058dd y sigaa-web:rollback-20261028-8058dd. Usar el proyecto sigaa-current, compose.hosted.yaml y hosted.env preservados en el respaldo; ejecutar up -d --no-deps api web. No publicar el archivo de entorno.'),('3. Comprobar el retorno','Confirmar contenedores sanos, HTTPS y login. Las migraciones son aditivas; volver a 0.8.0 no elimina las tablas nuevas. Este retorno está preparado, pero no se ejecutó sobre producción.'),('4. Recuperación de base, solo si corresponde','Restaurar el dump primero en una base aislada y validar conteos. Sustituir la base productiva requiere decidir qué hacer con las escrituras posteriores. Nunca restaurar ciegamente sobre el volumen activo.')]
for title,body in steps:y=section(title,body,y)
end()
start('Trazabilidad y pasos siguientes','Repositorio nuevo y tarjetas existentes: sin duplicados ni aceptación atribuida al equipo.')
y=table([['Registro Jira','Situación después del despliegue'],['SCRUM-35 / 36 / 48','Casos, ficha y apoderados: En revisión'],['SCRUM-37 / 51','Avisos y modelo estudiante: En revisión'],['SCRUM-42','Manual técnico y despliegue: En revisión'],['SCRUM-52','En curso: falta ensayo del equipo y varios dispositivos físicos']],[183,328],142)
y=section('Evidencia entregada','Repositorio <b>joellopez775/SIGAA-Capstone-2026</b>, rama <b>feature/sprint-5-seguimiento</b> y solicitud existente <b>#1</b>. No se modificó el repositorio anterior ni se creó otra solicitud, tarjeta o sprint. Los informes anteriores conservan su fecha de corte; este PDF registra el despliegue posterior.',y)
y=section('Archivos de respaldo documental','En SIGAA/output/evidence/deployment-0.9.1/: deployment.json, restored-workflows.json, https-policy.json, https-verification.json y jira-sync.json. El verificador público está en scripts/verify-release-https.mjs; requiere un archivo privado de cuentas proporcionado por el administrador.',y)
y=section('Próximos pasos','<b>Joel:</b> revisar la versión publicada y registrar aceptación o correcciones.<br/><b>Equipo:</b> probar desde otros equipos y redes; adjuntar evidencia real en SCRUM-52.<br/><b>Integración:</b> revisar y fusionar la solicitud #1 cuando corresponda; mantener el respaldo hasta decidir su retención.<br/><b>Cierre:</b> actualizar entregables finales y registrar solo las reuniones y acuerdos que efectivamente ocurran.',y)
section('Resultado','El dominio ya sirve 0.9.1 con HTTPS. Respaldo, restauración, migración y pruebas descritas están documentados. Las cuentas existentes se conservaron; no se publican contraseñas ni datos de estudiantes en este informe.',y)
end();C.save();assert len(PdfReader(out).pages)==5;print(out)

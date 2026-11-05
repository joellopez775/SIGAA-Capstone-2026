from pathlib import Path
import json,csv,datetime
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4,A3,landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph,Table,TableStyle
from reportlab.lib.styles import ParagraphStyle
R=Path(__file__).resolve().parents[1];D=json.loads((R/'output/evidence/nov5/content.json').read_text());O=R/'output/pdf';G=colors.HexColor('#174b3b');K=colors.HexColor('#253f35');A=colors.HexColor('#b79851');L=colors.HexColor('#edf3ee')
for n,p,i in [('Georgia','/System/Library/Fonts/Supplemental/Georgia.ttf',0),('Body','/System/Library/Fonts/HelveticaNeue.ttc',0)]:pdfmetrics.registerFont(TTFont(n,p,subfontIndex=i))
style=ParagraphStyle('body',fontName='Body',fontSize=11,leading=16,textColor=K)
def txt(c,t,x,y,w,size=11,font='Body',col=K):
 p=Paragraph(t,ParagraphStyle('p',parent=style,fontName=font,fontSize=size,leading=size*1.45,textColor=col));_,h=p.wrap(w,2000);assert y-h>48,(t,y,h);p.drawOn(c,x,y-h);return y-h

def begin(c,title,n,size=A4):
 w,h=size;c.setFillColor(G);c.rect(0,h-12,w,12,fill=1,stroke=0);txt(c,title,42,h-49,w-84,23,'Georgia',G);c.setStrokeColor(A);c.line(42,45,w-42,45);c.setFont('Body',8);c.setFillColor(K);c.drawString(42,28,'SIGAA · 5 noviembre 2026 · Sprint 6');c.drawRightString(w-42,28,str(n));return h-108

def section(c,title,body,y,w=511):
 y=txt(c,title,42,y,w,15,'Georgia',G)-8;return txt(c,body,42,y,w)-23

def report(name,pages):
 c=canvas.Canvas(str(O/name),pagesize=A4);c.setTitle(name[:-4]);c.setAuthor('Equipo SIGAA')
 for i,(title,sections) in enumerate(pages,1):
  y=begin(c,title,i)
  for a,b in sections:y=section(c,a,b,y)
  c.showPage()
 c.save()
report('Informe general de avance - 5 noviembre 2026.pdf',[
 ('Avance general del proyecto',[
 ('Contexto','SIGAA es una plataforma para colegios y liceos. Centraliza gestión académica y seguimiento: asistencia, notas, anotaciones, alertas y casos. Participan estudiantes, docentes, inspectoría y administración; el portal de apoderados no está implementado.'),
 ('Situación al 5 de noviembre','Semana 13 del cronograma docente, Fase 2. Sprint 6 planificado del 2 al 14 de noviembre, activado en Jira el día 5. Los sprints históricos mantienen sus registros; su cierre requiere revisar aceptación y pendientes.'),
 ('Base entregada previamente','Acceso con sesiones y permisos; estudiantes, matrículas y estructura escolar; asistencia, calificaciones y anotaciones; clases publicadas; casos, apoderados, ficha integral, avisos y calendario. Se cargaron datos ficticios: 80 estudiantes y doce docentes con nombres completos.'),
 ('Incremento de hoy: 0.10.0','Se agregan Indicadores y Auditoría en el menú. La nueva API no requiere migrar el esquema 0.9.1. El código conserva React, Node.js/Express y PostgreSQL; el despliegue utiliza Docker, Nginx y Cloudflare.')]),
 ('Desarrollo y evidencia verificable',[
 ('Indicadores institucionales · SCRUM-38','Seis conteos del estado actual: estudiantes regulares, cursos activos, matrículas activas, casos no cerrados, justificaciones pendientes y evaluaciones publicadas. Acceso de administración, inspectoría y dirección/UTP. No son tasas, promedios oficiales ni predicciones.'),
 ('Consulta de auditoría · SCRUM-40','Acceso exclusivo de administración. Eventos ordenados por fecha e identificador, páginas de 25 y filtro de acción exacta. Devuelve autor, fecha, operación y entidad; excluye los valores anteriores/nuevos del evento. No ofrece edición o eliminación de eventos.'),
 ('Pruebas ejecutadas','6 unitarias y 69 de integración aprobadas en Docker con PostgreSQL 16 aislado. Tres pruebas nuevas cubren denegación por rol, conteos consultados y paginación/filtro/privacidad. Compilación web aprobada. La evidencia HTTPS del corte queda en output/evidence/nov5/https.json.'),
 ('Operación','Se tomó respaldo privado antes de actualizar. El primer intento se revirtió por permisos de lectura de archivos dentro de la imagen; COPY con propietario node corrigió el empaquetado. El servidor de base y su volumen no se reemplazaron. La copia del respaldo de este corte se verificó por inventario; la restauración completa documentada corresponde al corte 0.9.1.')]),
 ('Pendientes para finalizar',[
 ('Aceptación y pruebas humanas','Joel debe aprobar o devolver las historias revisadas. El equipo debe probar Docker y HTTPS desde otros equipos/redes. Faltan carga con un objetivo acordado, accesibilidad integral y contraste con usuarios escolares. Las pruebas automatizadas en un Mac no equivalen a validar varios dispositivos físicos.'),
 ('Documentación y entrega','Consolidar los manuales de todos los módulos, confirmar la pertinencia de evidencias individuales, completar plantillas oficiales y registrar sus revisiones. Revisar la solicitud #1 e integrar el código cuando corresponda. Confirmar fecha y hora de entrega en Campus.'),
 ('Prioridad de cierre','5–7 noviembre: revisar indicadores/auditoría. 9–14: pruebas, manuales y propuesta de valor. 16–21: consolidación y entrega de Fase 2. 23–28: correcciones por retroalimentación. 30 noviembre–12 diciembre: presentación final de Fase 3. Exportaciones y portal de apoderados quedan fuera del compromiso actual.'),
 ('Responsabilidades','Los tres desarrollan, prueban y documentan. Joel es Product Owner confirmado. Agustín como Scrum Master y los focos técnicos siguen propuestos. La Gantt propone una distribución equilibrada y revisión cruzada; no demuestra ejecución individual. Las dos ceremonias ilustrativas están rotuladas como simuladas.')])])
report('Sprint 6 - Backlog y seguimiento - 5 noviembre 2026.pdf',[
 ('Sprint 6: planificación y backlog',[
 ('Objetivo y fechas','Preparar una versión revisable con indicadores, consulta de auditoría y evidencia de calidad. Ventana: 2–14 noviembre; activación real de Jira: 5 noviembre. Se utiliza el Sprint 6 - Calidad existente, ID 40; no se crea otro sprint.'),
 ('Historias seleccionadas','SCRUM-38: seis conteos con permisos y definición visible. SCRUM-40: consulta de auditoría administrativa paginada sin payload privado. SCRUM-41: pruebas funcionales y de cierre. SCRUM-42: operación y despliegue. SCRUM-43: manual de usuario. SCRUM-44: propuesta de valor y validación escolar.'),
 ('Criterios y tareas','SCRUM-38: comprobar conteos contra SQL, denegar acceso a docente/estudiante y revisar nomenclatura con el PO. SCRUM-40: paginar, filtrar y comprobar ausencia de secretos. SCRUM-41: regresión aprobada; carga, accesibilidad y dispositivos pendientes. Manuales y aceptación deben revisarse antes del cierre.'),
 ('Tablero y seguimiento','Implementado para revisión: indicadores y consulta de auditoría. En curso: pruebas integrales. Pendiente: revisión de manuales, validación escolar y aceptación del PO. No se marcan historias Terminadas por tener código. No se calcula un burndown histórico: faltan mediciones diarias de esfuerzo restante; no se inventa velocidad.')]),
 ('Dos ejemplos de ceremonias simuladas',[
 ('Daily: guion simulado, no reunión realizada','Escenario de práctica para 5 noviembre. Joel: revisar el incremento y anotar criterios pendientes. Agustín: recorrer Indicadores y preparar correcciones de lenguaje/accesibilidad. Matías: contrastar conteos y probar páginas/filtros de Auditoría. Bloqueos a revisar: disponibilidad del equipo y validación escolar. Estas intervenciones son ficticias y no acreditan asistencia ni trabajo personal realizado.'),
 ('Review/retrospectiva: ejemplo simulado','Escenario de ensayo al término del sprint. Demostración propuesta: abrir Indicadores y filtrar Auditoría con administración; comprobar denegación con estudiante. Mejora propuesta: adjuntar evidencias al mismo tiempo que el cambio. Decisiones pendientes: aceptación del PO, responsables ratificados y fecha de pruebas humanas. No se atribuye aprobación ni acuerdos reales.'),
 ('Impedimentos y release','Faltan prueba humana multidispositivo y contraparte escolar. El empaquetado detectado durante el despliegue se corrigió; conservar su evidencia técnica. Release 0.10.0 presentada para revisión. Las capturas y resultados reales se almacenan separados de estos ejemplos.'),
 ('Próxima reunión real','El equipo debe registrar fecha, asistentes, observaciones y decisiones cuando efectivamente ocurran. Sustituir los guiones simulados por el acta o registro real si se utilizan como actividad de práctica.')])])
report('Guía de usuario del incremento 0.10.0 - SIGAA.pdf',[
 ('Indicadores y auditoría: guía de uso',[
 ('1. Ingresar y elegir el módulo','Usar las credenciales existentes de SIGAA. Administración e inspectoría ven Indicadores. Solo administración ve Auditoría. El nombre de usuario cambia según la cuenta; los docentes nuevos del catálogo todavía no tienen contraseña.'),
 ('2. Consultar Indicadores','Abrir Indicadores y leer los seis conteos. Revisar el alcance y hora de consulta. Pulsar Actualizar datos para renovar la consulta. Un caso abierto es un caso cuyo estado no es cerrado; una evaluación publicada tiene estado publicada.'),
 ('3. Consultar Auditoría','Ingresar como administración, abrir Auditoría. Leer autor, fecha, operación y entidad. El campo Acción exacta busca el nombre literal de la operación, por ejemplo update; vacío muestra todas. Anterior/Siguiente cambia la página, con hasta 25 eventos.'),
 ('4. Interpretar límites','Una cifra agregada describe registros actuales y no reemplaza una decisión pedagógica. La bitácora no muestra el contenido privado de los cambios. Los permisos se comprueban también en la API: ocultar el menú no es la única protección.'),
 ('5. Comunicar una incidencia','Registrar rol, pantalla, acción, resultado esperado y observado; evitar incluir contraseñas. Adjuntar evidencia a la tarjeta existente SCRUM-38 o SCRUM-40. Este anexo cubre el incremento y debe consolidarse con los manuales anteriores para cerrar SCRUM-43.')])])
# Gantt vectorial con fechas reales del calendario y tareas propuestas.
w,h=landscape(A3);c=canvas.Canvas(str(O/'Carta Gantt actualizada por sprints - 5 noviembre 2026.pdf'),pagesize=(w,h));c.setAuthor('Equipo SIGAA');c.setTitle('Carta Gantt actualizada por sprints - 5 noviembre 2026');y=begin(c,'Plan de cierre por sprints',1,(w,h))
text='Hoy: 5 noviembre. Sprint 6: 2–14 noviembre. Sprint 7: 16–28 noviembre. Entrega Fase 2: 16–21 noviembre; Fase 3: 23 noviembre–12 diciembre. Día y hora: confirmar en Campus.';txt(c,text,42,y,w-84,12);y-=65
start=datetime.date(2026,11,5);end=datetime.date(2026,12,12);days=(end-start).days+1;left=460;cw=(w-left-40)/days
for i in range(days):
 day=start+datetime.timedelta(days=i);x=left+i*cw;c.setFillColor(L if day.weekday()<5 else colors.HexColor('#e3e7e6'));c.rect(x,170,cw,440,fill=1,stroke=0);c.setFillColor(K);c.setFont('Body',7);c.drawCentredString(x+cw/2,622,day.strftime('%d')); 
 if day.day in [5,9,16,23,30,1,7]:c.drawString(x,638,day.strftime('%d/%m'))
for i,t in enumerate(D['tasks']):
 yy=590-i*40;txt(c,t[0]+' · '+t[2],42,yy+8,400,10);txt(c,t[3],42,yy-8,400,8)
 a=datetime.date.fromisoformat(t[4]);b=datetime.date.fromisoformat(t[5]);x=left+(a-start).days*cw;c.setFillColor(G if t[1]=='Sprint 6' else A);c.roundRect(x,yy-12,((b-a).days+1)*cw,18,3,stroke=0,fill=1)
txt(c,'Las barras son ventanas de trabajo propuestas, no ejecución acreditada. No representan porcentaje completado ni aprobación. Verde: Sprint 6. Dorado: Sprint 7 / presentación final.',42,130,w-84,11);c.showPage();y=begin(c,'Qué debe hacer cada responsable',2,(w,h))
for t in D['tasks']:
 y=txt(c,f'{t[0]} / {t[1]} / {t[3]}: {t[2]}. Ventana {t[4]} a {t[5]}. Estado: {t[6]}.',42,y,w-84,11)-17
txt(c,'Antecedentes: Sprints 0–2, definición y base técnica; Sprint 3, autenticación y persistencia; Sprint 4, operación escolar y alertas; Sprint 5, casos, apoderados y ficha. Su aceptación y cierre administrativo deben revisarse en Jira; no se reescribe su historia.',42,y-10,w-84,11);c.showPage();c.save()
with (R/'output/evidence/nov5/plan.csv').open('w') as f:
 writer=csv.writer(f);writer.writerow(['ID','Sprint','Instrucción','Responsable y revisión propuestos','Inicio','Fin','Estado']);writer.writerows(D['tasks'])
# Presentación PDF con la misma narrativa del archivo editable.
c=canvas.Canvas(str(O/'Presentación de avance - 5 noviembre 2026.pdf'),pagesize=(960,540));c.setTitle('SIGAA - Avance 5 noviembre 2026');c.setAuthor('Equipo SIGAA')
for i,(title,body,note) in enumerate(D['slides'],1):
 c.setFillColor(G if i in [1,12] else colors.white);c.rect(0,0,960,540,fill=1,stroke=0);col=colors.white if i in [1,12] else G;txt(c,title,55,470,850,32,'Georgia',col);c.setFillColor(A);c.rect(55,375,95,4,fill=1,stroke=0);txt(c,body,55,340,850,23,col=colors.white if i in [1,12] else K);txt(c,note,55,135,850,13,col=colors.white if i in [1,12] else K);c.setFont('Body',10);c.drawRightString(910,30,str(i)+' / 12');c.showPage()
c.save();print('5 PDF generados')

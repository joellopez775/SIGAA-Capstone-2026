"""Editorial redesign of the November delivery; factual cutoff is preserved."""
from pathlib import Path
import json,datetime
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4,landscape
from reportlab.platypus import Paragraph,Table,TableStyle
from reportlab.lib.styles import ParagraphStyle
R=Path(__file__).resolve().parents[1];O=R/'output/pdf';D=json.loads((R/'output/evidence/nov5/content.json').read_text());V=R/'output/evidence/nov5/visuals'
for name,p,i in [('Serif','/System/Library/Fonts/Supplemental/Georgia.ttf',0),('Sans','/System/Library/Fonts/HelveticaNeue.ttc',0),('Bold','/System/Library/Fonts/HelveticaNeue.ttc',1)]:pdfmetrics.registerFont(TTFont(name,p,subfontIndex=i))
pdfmetrics.registerFontFamily('Sans',normal='Sans',bold='Bold',italic='Sans',boldItalic='Bold')
G='#153f35';G2='#2e6653';A='#b49755';INK='#203b32';M='#65756c';PAPER='#f7f6f1';LINE='#dce4db';PALE='#eaf0e8';WHITE='#ffffff'
def col(x):return colors.HexColor(x)
class Doc:
 def __init__(self,name,size=A4):
  self.w,self.h=size;self.c=canvas.Canvas(str(O/name),pagesize=size);self.c.setTitle(name[:-4]);self.c.setAuthor('Equipo SIGAA');self.n=0
 def rect(self,x,y,w,h,fill,rad=0,stroke=None):
  c=self.c;c.setFillColor(col(fill));c.setStrokeColor(col(stroke or fill));c.roundRect(x,self.h-y-h,w,h,rad,fill=1,stroke=bool(stroke))
 def text(self,t,x,y,w,size=10.5,font='Sans',color=INK):
  p=Paragraph(t,ParagraphStyle('t',fontName=font,fontSize=size,leading=size*1.4,textColor=col(color)));_,h=p.wrap(w,2000);assert y+h<(self.h-12 if y>=self.h-40 else self.h-48),(self.n,t[:45],y,h);p.drawOn(self.c,x,self.h-y-h);return y+h
 def line(self,x,y,x2,y2,color=LINE):self.c.setStrokeColor(col(color));self.c.setLineWidth(.7);self.c.line(x,self.h-y,x2,self.h-y2)
 def page(self,section,title,sub='',dark=False):
  self.n+=1;self.rect(0,0,self.w,self.h,PAPER);self.rect(0,0,9,self.h,G);self.text('SIGAA  /  '+section.upper(),36,25,self.w-72,9,'Bold',G2);self.text(title,36,57,self.w-72,27,'Serif',G)
  if sub:self.text(sub,36,103,self.w-72,10.5,'Sans',M)
  self.line(36,self.h-43,self.w-36,self.h-43,A);self.text('5 NOV 2026   ·   FASE 2   ·   SPRINT 6',36,self.h-32,self.w-110,7.5,'Bold',M);self.text(f'{self.n:02}',self.w-58,self.h-32,25,8,'Bold',G)
 def end(self):self.c.showPage()
 def save(self):self.c.save()
 def label(self,t,x,y,w=500):return self.text(t.upper(),x,y,w,8,'Bold',G2)
 def heading(self,t,x,y,w=500):return self.text(t,x,y,w,17,'Serif',G)
 def note(self,t,y,color=PALE,x=36,w=None):
  w=w or self.w-72;self.rect(x,y,w,55,color,8);return self.text(t,x+13,y+11,w-26,10)
 def card(self,x,y,w,h,label,value,detail=''):
  self.rect(x,y,w,h,WHITE,8,LINE);self.text(label.upper(),x+13,y+12,w-26,8,'Bold',M);self.text(value,x+13,y+32,w-26,26,'Serif',G)
  if detail:self.text(detail,x+13,y+75,w-26,8.5,color=M)
 def table(self,rows,widths,y,font=9):
  cells=[[Paragraph(escape(str(t)).replace('\n','<br/>'),ParagraphStyle('cell',fontName='Bold' if i==0 else 'Sans',fontSize=font,leading=font*1.4,textColor=col(WHITE if i==0 else INK)))for t in row]for i,row in enumerate(rows)]
  tab=Table(cells,colWidths=widths,repeatRows=1);tab.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),col(G)),('ROWBACKGROUNDS',(0,1),(-1,-1),[col(WHITE),col(PALE)]),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10)]));_,h=tab.wrap(self.w,2000);assert y+h<self.h-55,(self.n,y,h);tab.drawOn(self.c,36,self.h-y-h);return y+h
 def image(self,name,x,y,w,h):
  p=V/(name+'.png');assert p.exists();self.rect(x-1,y-1,w+2,h+2,WHITE,7,LINE);self.c.drawImage(str(p),x,self.h-y-h,w,h,preserveAspectRatio=True,anchor='c',mask='auto')
# Report: an executive overview, product evidence and a concrete closeout plan.
d=Doc('Informe general de avance - 5 noviembre 2026.pdf');W=d.w-72

d.page('Informe general','Avance del proyecto','De la gestión académica al seguimiento escolar. Corte: 5 de noviembre de 2026.')
d.rect(36,151,W,154,G,12);d.text('INCREMENTO PUBLICADO',53,168,W-34,8,'Bold',A);d.text('Más visibilidad para<br/>tomar decisiones.',53,191,W-34,27,'Serif',WHITE);d.text('Versión 0.10.0 · sigaa.ignisert.com · HTTPS verificado',53,267,W-34,10,'Sans','#dce9df')
for i,(l,v,t) in enumerate([('Unitarias','6','Aprobadas'),('Integración','69','PostgreSQL 16'),('Recorridos HTTPS','8','Cuatro roles'),('Semana actual','13','Sprint 6 / Fase 2')]):d.card(36+i*(W+12)/4,323,(W-36)/4,110,l,v,t)
d.heading('Qué resuelve SIGAA',36,457);d.text('Una plataforma para colegios y liceos que reúne asistencia, notas, anotaciones y alertas, y permite reconstruir el acompañamiento de cada estudiante.',36,486,W,12)
d.table([['Base ya disponible','Novedades del corte'],['Usuarios, roles y matrículas\nClases, asistencia y calificaciones\nAnotaciones y alertas','Seis indicadores institucionales\nConsulta administrativa de auditoría\nFiltro por acción y páginas de 25'],['Casos y apoderados\nFicha integral y avisos\nAsignaturas y calendario estudiantil','Sin migrar la base\nAPI 0.10.0 / esquema 0.9.1\nNuevas pruebas de permisos y privacidad']],[W/2,W/2],551,10)
d.text('Datos de ejemplo: 80 estudiantes y 12 docentes ficticios. Los apoderados tienen registro y vínculos; su portal de acceso sigue fuera del alcance.',36,745,W,9,color=M);d.end()
d.page('Producto y verificación','Dos nuevas vistas, un mismo sistema','La API comprueba permisos; la interfaz muestra solo los módulos autorizados.')
d.image('indicadores',36,150,W,230);d.label('01 / Indicadores',36,397);d.text('Administración, inspectoría y dirección/UTP consultan estudiantes regulares, cursos activos, matrículas, casos no cerrados, justificaciones pendientes y evaluaciones publicadas.',36,418,W,11)
d.line(36,489,d.w-36,489);d.heading('02 / Auditoría administrativa',36,506);d.text('Autor, fecha, operación y entidad. Filtro de acción exacta, páginas de 25 y acceso exclusivo de administración. La respuesta excluye los valores privados anteriores y nuevos del evento.',36,536,W,11)
d.table([['Control ejecutado','Evidencia'],['Permisos y alcance','Se rechazan solicitudes de docentes y estudiantes a los nuevos módulos.'],['Cálculos y privacidad','Conteos contrastados con SQL; prueba de ausencia de payload privado.'],['Operación segura','Respaldo previo y despliegue verificado. Se corrigió la propiedad de archivos de la imagen tras revertir el primer intento.']],[155,W-155],611,9)
d.end()
d.page('Cierre del proyecto','Lo que falta y cómo terminarlo','Las fechas son ventanas de planificación; confirmar el día y la hora de entrega en Campus.')
d.table([['Ventana','Resultado esperado','Trabajo principal'],['5–7 nov','Incremento revisado','Revisar indicadores y auditoría con el PO.'],['9–14 nov','Calidad y documentación','Carga, accesibilidad, otros equipos, manuales y valor escolar.'],['16–21 nov','Entrega de Fase 2','Consolidar producto, informe, anexos y evidencias oficiales.'],['23–28 nov','Correcciones','Responder retroalimentación y ensayar defensa.'],['30 nov–12 dic','Presentación final','Exponer y registrar el cierre real de Fase 3.']],[87,150,W-237],153,10)
d.heading('Responsabilidad compartida',36,491);d.text('Los tres desarrollan, prueban y documentan. Joel es Product Owner confirmado. Los focos técnicos y el rol de Scrum Master propuesto para Agustín deben ratificarse.',36,523,W,11)
d.table([['Joel / revisión de Agustín','Agustín / revisión de Matías','Matías / revisión de Joel'],['Integración, operación y revisión del incremento.','Manual por roles, recorrido de interfaz y accesibilidad.','Pruebas de cierre y contraste de valor escolar.']],[W/3]*3,591,9)
d.note('Pendientes de aceptación: PO, revisión/fusión del PR #1 y validación escolar. Las pruebas emuladas en un Mac no sustituyen ensayos físicos del equipo.',707)
d.end();d.save()
# Sprint record: board + backlog and two clearly labelled simulated scripts.
d=Doc('Sprint 6 - Backlog y seguimiento - 5 noviembre 2026.pdf');W=d.w-72
d.page('Gestión del sprint','Sprint 6 / Calidad','Ventana planificada: 2–14 noviembre · Activación en Jira: 5 noviembre · Sprint existente ID 40')
d.note('Objetivo: entregar un incremento revisable con indicadores, consulta de auditoría y evidencia de calidad.',150)
for i,(name,items,tint) in enumerate([('Por completar','Manual consolidado<br/>Validación escolar<br/>Pruebas humanas',WHITE),('En curso','Pruebas integrales<br/>Carga y accesibilidad<br/>Revisión de operación',PALE),('En revisión','Indicadores<br/>Consulta de auditoría<br/>Aceptación del PO pendiente',WHITE)]):
 x=36+i*(W+12)/3;cw=(W-24)/3;d.rect(x,223,cw,140,tint,8,LINE);d.text(name,x+12,237,cw-24,14,'Serif',G);d.text(items,x+12,273,cw-24,10)
d.label('Backlog seleccionado / tarjetas existentes',36,389)
d.table([['Historia','Entrega / criterio principal','Pts.'],['38 · Indicadores','Seis conteos, definiciones y permisos.','8'],['40 · Auditoría','Consulta privada, filtro y paginación.','8'],['41 · Pruebas','Regresión aprobada; completar carga y accesibilidad.','8'],['42 · Operación','Guía técnica, respaldo y recuperación revisados.','5'],['43 · Manual','Consolidar instrucciones por rol.','5'],['44 · Valor','Contrastar la solución con una necesidad escolar.','3']],[110,W-160,50],414,9)
d.text('37 puntos planificados. No representan trabajo terminado ni velocidad. No hay mediciones diarias de esfuerzo restante suficientes para un burndown histórico fiable.',36,737,W,9,color=M);d.end()
d.page('Seguimiento y aprendizaje','Dos guiones de práctica','SIMULACIONES · No acreditan reuniones, asistencia, acuerdos ni aprobaciones reales.')
for y,num,title,body in [(155,'01','Daily de práctica','Joel: revisar el incremento y registrar criterios pendientes.<br/><br/>Agustín: recorrer Indicadores y anotar ajustes de lenguaje y accesibilidad.<br/><br/>Matías: contrastar conteos y probar filtros y páginas de Auditoría.'),(421,'02','Review + retrospectiva de ensayo','Demostrar Indicadores y Auditoría con administración, y comprobar la denegación con estudiante.<br/><br/>Mejora propuesta: adjuntar la evidencia con cada cambio.<br/><br/>Decisiones por tomar: aceptación del PO, reparto ratificado y fecha de pruebas humanas.')]:
 d.rect(36,y,W,238,WHITE,10,LINE);d.text(num,52,y+15,55,31,'Serif',A);d.heading(title,112,y+22,W-95);d.text(body,54,y+75,W-36,11)
d.note('Impedimentos reales: disponibilidad para ensayos físicos y falta de validación escolar. El problema de empaquetado se corrigió. Registrar las decisiones reales cuando ocurran.',691);d.end();d.save()
# Gantt in a readable weekly grid: dates remain exact in the adjacent columns.
d=Doc('Carta Gantt actualizada por sprints - 5 noviembre 2026.pdf',landscape(A4));W=d.w-72
d.page('Plan de cierre','Carta Gantt por sprints','Corte al 5 de noviembre · Fechas propuestas de trabajo, no ejecución acreditada.')
left=389;right=d.w-36;cw=(right-left)/6;weeks=['5–7 nov','9–14 nov','16–21 nov','23–28 nov','30 nov–5 dic','7–12 dic'];
for j,w in enumerate(weeks):d.rect(left+j*cw,155,cw,37,G);d.text(w,left+j*cw+3,166,cw-6,8,'Bold',WHITE)
d.label('Historia / responsable y revisión',36,167,270);d.label('Inicio · fin',292,167,90)
spans=[(0,0),(0,0),(0,1),(1,1),(1,1),(1,1),(1,1),(2,2),(3,3),(4,5)]
for i,(t,(a,b)) in enumerate(zip(D['tasks'],spans)):
 y=192+i*29;d.rect(36,y,W,29,WHITE if i%2==0 else PALE);d.text(t[0]+'  '+t[2],42,y+3,243,8);d.text(t[3],42,y+16,243,6.5,color=M);d.text(t[4][8:]+'/'+t[4][5:7]+' · '+t[5][8:]+'/'+t[5][5:7],292,y+8,91,8)
 for j in range(6):d.line(left+j*cw,y,left+j*cw,y+29,LINE)
 d.rect(left+a*cw+4,y+8,(b-a+1)*cw-8,13,G2 if i<7 else A,3)
d.text('VERDE  Sprint 6: 2–14 noviembre     DORADO  Sprint 7 y Fase 3',36,504,W,9,'Bold',G2)
d.text('Hitos oficiales: entrega Fase 2 del 16 al 21 de noviembre; retroalimentación del 23 al 28; presentación final del 30 de noviembre al 12 de diciembre. Confirmar horario en Campus.',36,526,W,9,color=M);d.end()
d.page('Responsabilidades','Qué hace cada integrante','Distribución propuesta con revisión cruzada. Los trabajos de equipo siguen compartidos.')
rows=[['ID','Instrucción concreta','Responsable / revisión','Ventana']]
for t in D['tasks']:rows.append([t[0],t[2]+'. '+t[6]+'.',t[3],t[4][8:]+'/'+t[4][5:7]+' a '+t[5][8:]+'/'+t[5][5:7]])
d.table(rows,[75,350,177,W-602],151,8.5)
d.text('Antecedentes: Sprints 0–2, definición/base técnica; 3, autenticación y persistencia; 4, operación escolar y alertas; 5, seguimiento. Revisar su aceptación y cierre administrativo en Jira sin reescribir la historia.',36,514,W,8.5,color=M);d.end();d.save()
# User guide with real UI captures and step-by-step operations.
d=Doc('Guía de usuario del incremento 0.10.0 - SIGAA.pdf');W=d.w-72
for num,name,title,role,steps,limit in [
 (1,'indicadores','Consultar Indicadores','Administración · Inspectoría · Dirección / UTP',[('Ingresar','Usa tu cuenta habitual y abre Indicadores en el menú.'),('Leer el panorama','Consulta los seis conteos y la hora de actualización.'),('Renovar la consulta','Pulsa Actualizar datos para consultar otra vez la base.')],'Un conteo describe registros actuales. No representa una tasa de riesgo, una predicción ni un promedio oficial.'),
 (2,'auditoria','Consultar Auditoría','Solo administración',[('Abrir la bitácora','Ingresa como administración y selecciona Auditoría.'),('Filtrar una operación','En Acción exacta escribe el nombre literal, por ejemplo update. Vacío muestra todas.'),('Recorrer eventos','Usa Anterior / Siguiente. Cada página muestra hasta 25 eventos, con autor y fecha.')],'La consulta no muestra los valores privados del cambio. Los permisos se verifican en la API y la vista no permite editar o eliminar eventos.')]:
 d.page('Guía de uso / '+str(num).zfill(2),title,role);d.image(name,36,153,W,250);y=425
 for k,(a,b) in enumerate(steps,1):d.rect(36,y,27,27,G,7);d.text(str(k),45,y+5,15,11,'Bold',WHITE);d.text(a,76,y, W-40,12,'Bold',G);d.text(b,76,y+22,W-40,10.5);y+=77
 d.note(limit,678);d.text('Si ocurre un error: registra rol, pantalla, acción esperada y observada; evita incluir contraseñas. Usa la tarjeta existente SCRUM-38 o SCRUM-40. Anexo por consolidar con los manuales anteriores.',36,751,W,8.5,color=M);d.end()
d.save()
# Presentation: editorial cover, timeline, real UI, architecture and visual evidence.
d=Doc('Presentación de avance - 5 noviembre 2026.pdf',(960,540));W=d.w-72
for i,(title,body,note) in enumerate(D['slides'],1):
 d.page('Presentación / '+('Joel' if i<=4 else 'Agustín' if i<=8 else 'Matías'),title)
 if i==1:
  d.rect(0,0,960,540,G);d.rect(44,43,8,345,A);d.text('SIGAA',76,42,800,17,'Bold','#bfa563');d.text('Una visión completa<br/>del avance escolar.',76,104,800,49,'Serif',WHITE);d.text('Avance del proyecto · 5 noviembre 2026',76,281,800,19,'Sans','#dce9df');
  for x,value,label in [(76,'0.10.0','Versión publicada'),(365,'06','Sprint en curso'),(654,'13','Semana académica')]:d.text(value,x,355,220,38,'Serif',WHITE);d.text(label,x,412,220,12,'Sans','#dce9df')
 elif i==2:
  d.text('Una comunidad escolar,<br/>información conectada.',36,144,430,29,'Serif',G);d.text('Asistencia, notas y anotaciones en un mismo lugar. El seguimiento permite reconstruir las acciones sobre alertas y casos.',36,262,400,17)
  for j,(a,b) in enumerate([('Estudiantes','Su información y calendario'),('Docentes','Clases y registros académicos'),('Inspectoría','Justificaciones y seguimiento'),('Administración','Estructura, indicadores y auditoría')]):
   y=144+j*72;d.rect(500,y,424,60,WHITE,8,LINE);d.text(a,516,y+8,385,15,'Bold',G);d.text(b,516,y+32,385,11,color=M)
 elif i==3:
  for j,(a,b) in enumerate([('Gestión académica','Matrículas, cursos, clases, notas, asistencia y anotaciones.'),('Acompañamiento','Alertas, casos, apoderados, ficha integral y avisos.'),('Portal estudiante','Asignaturas y calendario propio; registros publicados.')]):
   x=36+j*300;d.rect(x,151,280,236,WHITE,9,LINE);d.text('0'+str(j+1),x+17,169,245,30,'Serif',A);d.text(a,x+17,222,245,19,'Serif',G);d.text(b,x+17,267,245,16)
  d.text('80 estudiantes + 12 docentes ficticios para recorrer el sistema.',36,421,W,17,'Bold',G)
 elif i==4:
  for j,(a,b,c) in enumerate([('AHORA','2–14 NOV','Sprint 6 / Calidad'),('ENTREGA','16–21 NOV','Fase 2'),('CIERRE','30 NOV–12 DIC','Presentación final')]):
   x=36+j*300;d.rect(x,171,280,195,G if j==0 else WHITE,9,LINE);d.text(a,x+18,193,244,10,'Bold',A);d.text(b,x+18,229,244,23,'Serif',WHITE if j==0 else G);d.text(c,x+18,300,244,16,'Sans',WHITE if j==0 else INK)
  d.text('Hoy: semana 13. Confirmar día y hora en Campus.',36,407,W,18,color=M)
 elif i in [5,6]:
  img='indicadores' if i==5 else 'auditoria';d.image(img,355,138,569,316);d.text('06 conteos' if i==5 else '25 eventos por página',36,166,290,29,'Serif',G);d.text('Datos del estado actual, con alcance y hora de consulta.' if i==5 else 'Autor, fecha, operación y entidad; filtro de acción exacta.',36,259,288,18);d.text('Administración, inspectoría y dirección/UTP.' if i==5 else 'Solo administración. Sin payload privado.',36,382,288,12,'Bold',G2)
 elif i==7:
  for j,(a,b) in enumerate([('Interfaz','React + Vite'),('Servidor','Node.js + Express'),('Datos','PostgreSQL')]):
   x=36+j*300;d.rect(x,180,270,132,G if j==1 else WHITE,10,LINE);d.text(a,x+18,199,234,12,'Bold',A);d.text(b,x+18,239,234,23,'Serif',WHITE if j==1 else G)
   if j<2:d.text('→',x+276,223,30,24,'Sans',G)
  d.text('Docker organiza los servicios. Nginx + Cloudflare permiten el acceso por HTTPS.',36,360,W,18);d.text('API 0.10.0 · Esquema 0.9.1 conservado',36,414,W,13,'Bold',G2)
 elif i==8:
  for j,(a,b,c) in enumerate([('6','Unitarias','Reglas y seguridad'),('69','Integración','PostgreSQL 16 aislado'),('8','Recorridos HTTPS','Cuatro roles / dos tamaños')]):d.card(36+j*300,153,280,173,b,a,c)
  d.text('Nuevas pruebas: permisos, conteos, filtro, paginación y privacidad de auditoría.',36,357,W,18);d.text('La revisión técnica está aprobada; la aceptación funcional corresponde al PO.',36,421,W,13,color=M)
 elif i==9:
  for j,(a,b) in enumerate([('01 / Aceptación','PO, contraparte escolar y revisión del código.'),('02 / Calidad','Carga, accesibilidad y otros dispositivos físicos.'),('03 / Entrega','Manuales consolidados y evidencias oficiales.')]):
   y=145+j*92;d.label(a,36,y);d.text(b,36,y+25,W,21);d.line(36,y+76,924,y+76)
 elif i==10:
  for j,(a,b) in enumerate([('5–7 NOV','Revisar indicadores y auditoría'),('9–14 NOV','Pruebas y manuales'),('16–21 NOV','Consolidar y entregar Fase 2'),('23–28 NOV','Responder observaciones')]):
   y=145+j*73;d.text(a,36,y,195,22,'Serif',G);d.text(b,259,y+4,665,20);d.line(36,y+56,924,y+56)
 elif i==11:
  for j,(a,b) in enumerate([('Joel','Integración y aprobación'),('Agustín','Manual y accesibilidad'),('Matías','Pruebas y evidencia')]):
   x=36+j*300;d.rect(x,160,280,185,WHITE,9,LINE);d.text(a,x+18,184,244,28,'Serif',G);d.text(b,x+18,244,244,19)
  d.text('Todos desarrollan, prueban y documentan. Reparto técnico propuesto; revisión cruzada.',36,388,W,17)
 else:
  d.rect(0,0,960,540,G);d.text('El siguiente paso<br/>es revisar juntos.',56,77,848,45,'Serif',WHITE);d.text('Aprobar o registrar correcciones. Acordar responsables.<br/>Probar desde otros equipos y confirmar la entrega.',56,253,848,23,'Sans','#dce9df');d.rect(56,383,848,2,A);d.text('Se incluyen dos guiones simulados; no acreditan reuniones realizadas.',56,414,848,13,'Sans','#dce9df')
 if i not in [1,12]:d.text(note,36,469,W,9,color=M)
 d.end()
d.save();print('Cinco PDF rediseñados')

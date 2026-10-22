"""Regenerate the PDF from checked-in nonsecret load/test evidence."""
import json
from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4

root=Path(__file__).resolve().parents[1]
load=json.loads((root/'output/evidence/synthetic-demo-load.json').read_text())
tests=json.loads((root/'output/evidence/synthetic-demo-api-tests.json').read_text())
assert tests['result']=='passed'
out=root/'output/pdf/Carga de datos de demostración SIGAA.pdf'
styles=getSampleStyleSheet()
styles['Title'].textColor=colors.HexColor('#075447')
styles['BodyText'].fontSize=10
styles['BodyText'].leading=14
story=[]
def p(text,style='BodyText'):
    story.append(Paragraph(text,styles[style]));story.append(Spacer(1,7))
p('SIGAA | Datos de demostración','Title')
p('Registro técnico de carga - 15 de octubre de 2026','Heading2')
p('Se incorporaron datos escolares ficticios al servidor de demostración. No representan alumnos reales, reuniones, entrevistas ni gestiones efectivamente realizadas. Se mantuvieron los registros anteriores y las contraseñas existentes.')
rows=[['Contenido','Cantidad total']]
for label,key in [('Alumnos / matrículas activas','estudiante'),('Cursos (20 alumnos por curso)','curso'),('Docentes registrados','funcionario'),('Asignaturas','asignatura'),('Asignaciones de curso y asignatura','curso_asignatura'),('Clases (incluye la clase anterior)','sesion_clase'),('Registros de asistencia','asistencia'),('Evaluaciones (32 publicadas, 16 borradores)','evaluacion'),('Calificaciones publicadas','calificacion'),('Anotaciones (80 positivas, 80 negativas)','anotacion_estudiante'),('Apoderados / vínculos familiares','apoderado'),('Comunicaciones ficticias','comunicacion_estudiante'),('Justificaciones de ausencia','justificacion_ausencia'),('Alertas preventivas / seguimientos ficticios','alerta')]:
    rows.append([label,str(load['live']['after'][key])])
table=Table(rows,colWidths=[365,130],hAlign='LEFT')
table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#075447')),('TEXTCOLOR',(0,0),(-1,0),colors.white),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#eff6f3'),colors.white]),('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
story.append(table);story.append(Spacer(1,12))
p('Escenarios y accesos','Heading2')
p('Hay 64 clases pasadas añadidas y 32 futuras; las futuras están entre el 19 y el 29 de octubre. Las notas suman ponderaciones de 100% por asignatura contando su evaluación futura. Se agregaron 48 seguimientos ficticios, sin contactos ni notificaciones a personas.')
p('Las cuatro cuentas habituales siguen funcionando. El docente dispone de Matemática en cuatro cursos. El alumno de prueba tiene 8 notas, 16 asistencias y 2 anotaciones visibles. Los otros alumnos y apoderados no tienen cuentas; los tres docentes adicionales no tienen contraseña habilitada. Cargar registros no implica desarrollar pantallas nuevas para todos ellos.')
story.append(PageBreak())
p('Validación y protección de datos','Heading2')
p('Antes de cargar se generó un respaldo PostgreSQL de '+str(load['backupBytes'])+' bytes. La carga se probó sobre una copia restaurada: simulación con reversión, aplicación y repetición sin duplicados. Después se eliminó solamente esa copia temporal. El respaldo del servidor se conservó con permisos privados.')
p('La operación real fue una transacción completa. Se compararon las huellas de todas las filas anteriores en 26 tablas y se verificó que no cambiaron. El lote SIGAA-DEMO-2026-10 tiene identificadores deterministas y un registro de auditoría: repetirlo no vuelve a insertar datos.')
p('Pruebas funcionales por HTTPS','Heading2')
p('Administrador: 4 cursos, 4 docentes y 16 asignaciones. Inspectoría: 80 alertas y 12 justificaciones, sin acceso a administración. Docente: 20 alumnos, 40 notas y 80 asistencias por asignatura. Estudiante: datos propios disponibles y acceso a otro alumno denegado. Las pruebas no modificaron datos académicos; solo iniciaron y cerraron sesiones.')
p('Reproducción y evidencias','Heading2')
p('Código: apps/api/src/populate-demo.js. Ejecutor con respaldo y copia aislada: scripts/populate-hosted-demo.py --apply (restringido al despliegue conocido). Comprobaciones: node scripts/verify-populated-demo.mjs. No ejecutar los sembradores de reinicio ni restaurar el respaldo sobre la base activa como una tarea rutinaria.')
p('Evidencias: output/evidence/synthetic-demo-load.json y synthetic-demo-api-tests.json. Respaldo privado en el servidor: sigaa-backups/demo-20261015214244/before-demo.dump. No se incluyen respaldos, contraseñas ni sesiones en Git.')
def footer(canvas,doc):
    canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#58706b'))
    canvas.drawString(50,30,'SIGAA | Datos ficticios para demostración')
    canvas.drawRightString(A4[0]-50,30,str(doc.page))
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=50,leftMargin=50,topMargin=40,bottomMargin=50).build(story,onFirstPage=footer,onLaterPages=footer)
print(out)

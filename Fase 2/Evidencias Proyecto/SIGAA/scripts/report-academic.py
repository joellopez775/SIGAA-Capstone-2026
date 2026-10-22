"""Evidence-backed user guide for the PostgreSQL academic workflows."""
from pathlib import Path
import json
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Image,Table,TableStyle

root=Path(__file__).resolve().parents[2]
evidence=root/'SIGAA/output/evidence'
qa=json.loads((evidence/'academic-docker-tests.json').read_text())
browser=json.loads((evidence/'academic-browser-tests.json').read_text())
assert qa['failures']==0 and browser['result']=='pass'
out=root/'Gestión Scrum SIGAA/PDF/03 Implementación/Asistencia notas y anotaciones persistentes.pdf'
out.parent.mkdir(parents=True,exist_ok=True)
styles=getSampleStyleSheet()
styles['Title'].textColor=colors.HexColor('#173f31')
styles['BodyText'].fontSize=10
styles['BodyText'].leading=15
story=[]
def p(text): story.append(Paragraph(text,styles['BodyText']))
def h(title,body): story.append(Paragraph(title,styles['Heading2']));p(body)
def title(text): story.append(Paragraph(text,styles['Title']))
title('SIGAA | Registro académico real')
p('Entrega técnica · 15 de octubre de 2026 · Docente y estudiante')
h('Resultado','Las pantallas de asistencia, notas y anotaciones ya utilizan PostgreSQL. El docente trabaja con sus asignaturas vigentes y sus estudiantes matriculados. El estudiante solo consulta sus propios registros publicados. No se usa almacenamiento en memoria ni información del prototipo para simular estos módulos.')
h('Acceso','Se conserva el enlace HTTPS de la demo: https://winter-mount-aluminum-removable.trycloudflare.com. Se conservan las cuentas docente@sigaa.demo y estudiante@sigaa.demo y sus contraseñas actuales; no se duplicaron ni se restablecieron. El enlace es temporal y depende del Mac, Docker y Cloudflare. Recargar la página para obtener la versión nueva.')
h('1. Registrar asistencia como docente','Abre Asistencia y selecciona Curso y asignatura. En Programar una clase completa fecha, bloque, título y objetivo; pulsa Crear clase. Puedes programar clases futuras dentro del periodo escolar. Selecciona la clase y marca explícitamente Presente, Ausente, Atraso o Justificada para cada estudiante. Pulsa Guardar asistencia. La clase queda realizada y visible para cada estudiante. No se permite registrar asistencia futura ni de clases canceladas. Puedes corregir estados, conservando la auditoría.')
h('2. Registrar y publicar notas','Abre Notas. Crea una evaluación con nombre, fecha y ponderación. La suma de ponderaciones de la asignatura no puede superar 100%. Selecciona la evaluación e ingresa notas entre 1,0 y 7,0, con un decimal. Guardar notas mantiene el borrador privado. Pulsa Publicar notas al estudiante cuando corresponda; solo se publican notas guardadas. Para corregir una nota existente escribe un motivo de al menos ocho caracteres. Una corrección publicada se refleja al actualizar la vista del estudiante. No dejar un campo vacío para borrar: no elimina notas.')
h('3. Registrar anotaciones','Abre Anotaciones, selecciona estudiante y tipo Positiva o Negativa. Escribe categoría, detalle de al menos ocho caracteres y visibilidad: Solo yo, Equipo docente de esta asignatura o Visible al estudiante. La opción inicial es privada. Las anotaciones publicadas aparecen en Mis anotaciones. Solo su autor puede anularlas, explicando el motivo; no se borran del historial. Para corregir un texto, anula y registra una nueva anotación.')
h('4. Consultar como estudiante','Usa Mi asistencia, Mis notas y Mis anotaciones. No hay botones para modificar estos registros. Pulsa Actualizar datos o vuelve a iniciar sesión después de un cambio del docente. No hay actualización en tiempo real. Una pantalla vacía significa que todavía no se han registrado o publicado datos: no se fabricaron notas ni asistencia en la demo pública.')
story.append(PageBreak())
title('Permisos, persistencia y pruebas')
h('Reglas aplicadas en el servidor','La identidad y los roles proceden de la sesión y de PostgreSQL, no de campos enviados por el navegador. Cada escritura comprueba asignatura vigente y matrícula activa. Los permisos de planificación, asistencia y calificación de docentes de apoyo se respetan. Las anotaciones privadas no son visibles para otros docentes; las anuladas no aparecen al estudiante. Los lotes se guardan en transacciones: un registro no autorizado impide guardar todo el lote.')
h('Trazabilidad y cambios simultáneos','Asistencia, notas, publicación y anotaciones generan eventos con autor, fecha y valores. La corrección de una nota aumenta su versión y conserva el motivo. Las revisiones de clase, evaluación y anotación detectan formularios desactualizados y devuelven un conflicto. Si ocurre, usa Actualizar registros y revisa los datos antes de volver a guardar. La publicación de una evaluación sin notas se rechaza.')
h('Arquitectura utilizada','React envía solicitudes autenticadas a Express; Express valida permisos, ejecuta transacciones con pg y persiste en PostgreSQL 16. Se reutilizan curso_asignatura, matricula, sesion_clase, asistencia, evaluacion, calificacion, anotacion_estudiante y evento_auditoria. No fue necesaria una migración ni se reinicializó la base. La API mantiene su usuario de base limitado, cookies seguras, protección CSRF y la red privada ya desplegada.')
table=Table([[Paragraph(v,styles['BodyText']) for v in row] for row in [
['Prueba','Resultado y alcance'],
['API en Docker / PostgreSQL 16',f"{qa['unitPassed']} unitarias y {qa['integrationPassed']} de integración aprobadas; cero fallos. Base temporal aislada del servidor de la demo."],
['Navegador local / PostgreSQL 14',f"{len(browser['checks'])} recorridos aprobados en Chrome; escritorio 1440 px y estudiante móvil 390 px. Formularios reales, publicación, corrección, privacidad y recarga."],
['Casos negativos','Otros cursos/estudiantes, roles sin permiso, notas fuera de rango, ponderaciones concurrentes, escritura obsoleta, publicación vacía, anotaciones privadas y asistencia futura.'],
['Persistencia','Reinicio real de API: asistencia, notas corregidas, anotaciones y visibilidad se conservan en PostgreSQL.'],
['Demo HTTPS desplegada','4 recorridos adicionales aprobados: ambos roles en 1440 y 390 px; login, permisos, pantallas académicas y cierre. Sin insertar registros académicos ficticios en la base pública.'],
]],colWidths=[145,365]);table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e4ece4')),('VALIGN',(0,0),(-1,-1),'TOP'),('BOX',(0,0),(-1,-1),0.4,colors.HexColor('#c5d0c5')),('INNERGRID',(0,0),(-1,-1),0.3,colors.HexColor('#c5d0c5')),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]));story.extend([Spacer(1,10),table])
h('Conclusión QA Sentinel','Flujos académicos probados y aptos para demostración con observaciones. Para producción escolar: requiere correcciones antes de producción por el alojamiento temporal, respaldos periódicos pendientes y cobertura no realizada de Safari/Firefox, carga y accesibilidad integral. Esta entrega no implementa alertas automáticas, cálculo oficial de promedios, justificativos por estudiante ni cambios de ponderación posteriores. No se cerró el sprint ni se simuló aceptación del Product Owner.')
story.append(PageBreak())
title('Evidencia y operación')
p('Capturas de pruebas aisladas con datos sintéticos. No corresponden a calificaciones reales ni se cargaron en la base pública.')
shots=root/'SIGAA/tmp/sprint3-evidence'
story.extend([Spacer(1,14),Table([[Image(str(shots/'06-notas-reales.png'),width=345,height=302.3),Image(str(shots/'07-anotaciones-estudiante.png'),width=155,height=335.4)]],colWidths=[350,160]),Spacer(1,12)])
h('Respaldo y reversión','Antes de desplegar se guardó /srv/sigaa-deployment-20261015/pre-academic.dump (privado). Se conservaron las imágenes sigaa-current-api:pre-academic-20261015 y sigaa-current-web:pre-academic-20261015. Para revertir la interfaz/API: volver a etiquetar esas dos imágenes como latest y recrear únicamente api y web con --no-build. No restaurar automáticamente la base ni borrar su volumen: la actualización no cambia el esquema y puede haber datos nuevos.')
h('Reproducir pruebas','API: TEST_DATABASE_URL de una instancia aislada y npm run test:integration en apps/api. Docker: docker compose -p sigaa-academic-qa-20261015 -f compose.test.yaml up --build --abort-on-container-exit --exit-code-from api-tests. Navegador: scripts/verify-sprint3-browser.mjs con TEST_DATABASE_URL y CHROME_PATH. Nunca ejecutar los datos de prueba contra la base pública.')
h('Trazabilidad de la entrega','Código: academic-routes.js, teacher-routes.js, school-app.js, AcademicPanel.jsx y SecureApp.jsx. Evidencia sin secretos: output/evidence/academic-docker-tests.json, academic-browser-tests.json y academic-hosted-tests.json. Jira: actualizar las incidencias existentes SCRUM-29 (evaluaciones y calificaciones), SCRUM-31 (asistencia) y SCRUM-50 (modelo docente), sin crear historias, tareas o sprints adicionales. Permanecen sujetas a revisión del Product Owner.')
def footer(canvas,doc):
    canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#63756a'));canvas.drawString(45,24,'SIGAA · Implementación y verificación · 15/10/2026');canvas.drawRightString(550,24,str(doc.page))
SimpleDocTemplate(str(out),leftMargin=43,rightMargin=43,topMargin=35,bottomMargin=42).build(story,onFirstPage=footer,onLaterPages=footer)
print(out)

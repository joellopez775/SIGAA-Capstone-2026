"""Generate the SIGAA delivery for 12 November from recorded results."""
from pathlib import Path
import json
style_source = Path(__file__).with_name('redesign-november-pdfs.py').read_text().split('# Report:')[0]
exec(style_source.replace("5 NOV 2026", "12 NOV 2026").replace("nov5/visuals", "nov12/visuals"))
E = R/'output/evidence/nov12'
D = json.loads((E/'presentation-content.json').read_text())
T = json.loads((E/'validation.json').read_text())
B = json.loads((E/'deployment.json').read_text())
browser = json.loads((E/'https.json').read_text())
visits=len(browser['checks'])
assert visits == 8 and B['backup']['restore'] == 'passed'
load = T['load']
evidence=f"{T['unit']} unitarias · {T['integration']} integración · {visits} recorridos HTTPS"
load_text=f"{load['requests']} lecturas, {load['concurrency']} concurrentes, 0 fallos y p95 de {load['p95Ms']} ms en entorno aislado."
def body(d,title,text,y):
    y=d.heading(title,36,y)+8
    return d.text(text,36,y,d.w-72,11)+22
def card_row(d,items,y,h=112):
    width=(d.w-72-12*(len(items)-1))/len(items)
    for i,(label,value,detail) in enumerate(items):
        d.card(36+i*(width+12),y,width,h,label,value,detail)
def audit_image(d,y,height):
    d.image('auditoria',36,y,d.w-72,height)
def stage(d,label,title,subtitle):
    d.page(label,title,subtitle)
def result_note(d,y):
    d.note('Pendientes de validación: revisión del PO, pruebas humanas en otros equipos, accesibilidad integral y contraste con una contraparte escolar.',y)

d=Doc('Informe general de avance - 12 noviembre 2026.pdf')
W=d.w-72
stage(d,'Informe de avance','Calidad antes de la entrega','Fase 2 · Semana 14 · Sprint 6 activo · Corte al 12 de noviembre')
d.rect(36,150,W,137,G,10)
d.text('SIGAA 0.10.1 PUBLICADO',53,166,W-34,10,'Bold',A)
d.text('Auditoría por entidad y fechas',53,198,W-34,23,'Serif',WHITE)
d.text('sigaa.ignisert.com · API verificada por HTTPS',53,247,W-34,11,'Sans','#e4ece4')
card_row(d,[('Unitarias',str(T['unit']),'Aprobadas'),('Integración',str(T['integration']),'PostgreSQL 16'),('Recorridos',str(visits),'4 roles / 2 tamaños')],309)
y=body(d,'Qué cambió en el portal','Administración puede combinar acción y entidad exactas con un rango de fechas. Aplicar o limpiar reinicia la paginación. El intervalo incluye ambos días según America/Santiago.',452)
y=body(d,'Qué se conserva en la entrega','SIGAA reúne clases, asistencia, notas, anotaciones, alertas, casos y ficha integral en un portal para colegios y liceos. La API 0.10.1 conserva el esquema 0.9.1.',y)
d.note('Entrega de Fase 2 entre el 16 y el 21 de noviembre. Confirmar el día y la hora en Campus.',725)
d.end()
stage(d,'Evidencia','Pruebas y recuperación','Resultados del corte, con alcance explícito de cada comprobación')
audit_image(d,149,232)
d.label('Auditoría con filtros · captura del portal publicado',36,390)
d.table([['Verificación','Resultado'],['Regresión y privacidad',evidence+'. Se comprobaron permisos, filtro, paginación y límites de medianoche.'],['Carga breve',load_text],['Restauración','Respaldo previo restaurado en un contenedor aislado. Se recuperaron 33 tablas, 80 estudiantes, 640 notas y 1.280 asistencias.'],['Despliegue','API y web actualizadas con respaldo e imágenes anteriores disponibles para reversión. La base conserva su volumen y esquema.']],[145,W-145],418,10)
d.note('La carga usa datos ficticios. Los recorridos de escritorio y móvil se ejecutaron en un Mac. Quedan por acordar un objetivo de carga y ensayos en dispositivos físicos.',725)
d.end()
stage(d,'Cierre','Qué falta antes de entregar','Ventanas del cronograma docente y responsables propuestos')
table_end=d.table([['Ventana','Trabajo y criterio de cierre'],['12–14 nov','Revisión del PO, ensayo en otros equipos y preparación de manuales y evidencias.'],['16–21 nov','Consolidar y entregar Fase 2. Revisar plantilla, anexos y solicitud de integración.'],['23–28 nov','Responder observaciones y ensayar la presentación.'],['30 nov–12 dic','Presentación final de Fase 3. Confirmar horario en Campus.']],[112,W-112],151,10)
y=body(d,'Trabajo pendiente','Completar accesibilidad integral y validación escolar. Revisar el PR #1 antes de integrar. Registrar las pruebas humanas y las decisiones del equipo cuando ocurran.',table_end+22)
y=body(d,'Reparto para el cierre','Joel coordina prioridades, revisión e integración. Agustín se enfoca en manual e interfaz. Matías se enfoca en pruebas y evidencias. Los tres desarrollan, prueban y documentan. El reparto técnico está propuesto.',y)
y=body(d,'Valor para un colegio o liceo','Probar con una contraparte un recorrido de asistencia, alerta, caso e intervención. Registrar tiempo, pasos difíciles y utilidad percibida. Acordar criterios con la contraparte antes de presentar resultados.',y)
d.note('Historias de auditoría y manual disponibles para revisión. Aceptación del PO y cierre administrativo del sprint pendientes.',725)
d.end();d.save()

d=Doc('Carta Gantt de cierre - 12 noviembre 2026.pdf',landscape(A4))
W=d.w-72
stage(d,'Plan de cierre','Carta Gantt de entrega y defensa','Fechas propuestas de trabajo. Las ventanas académicas se confirman en Campus.')
left=415;cw=(d.w-36-left)/5
for i,week in enumerate(['12–14 nov','16–21 nov','23–28 nov','30 nov–5 dic','7–12 dic']):
    d.rect(left+i*cw,148,cw,32,G);d.text(week,left+i*cw+5,158,cw-10,8,'Bold',WHITE)
d.label('Trabajo / responsable y revisión',36,158,370)
for i,(task,span) in enumerate(zip(D['tasks'],[(0,0),(0,0),(0,0),(0,0),(0,1),(0,1),(1,1),(2,2),(3,4)])):
    y=180+i*34
    d.rect(36,y,W,34,WHITE if i%2==0 else PALE)
    d.text(task[0]+' · '+task[1],45,y+5,362,9,'Bold',INK)
    d.text(task[2]+' · '+task[3],45,y+20,362,8,color=M)
    for j in range(5):d.line(left+j*cw,y,left+j*cw,y+34)
    a,b=span;d.rect(left+a*cw+4,y+10,(b-a+1)*cw-8,14,G2 if i<6 else A,4)
d.text('Verde / trabajo técnico y validación     Dorado / entrega y defensa',36,506,W,9,'Bold',G)
d.text('Sprint 6 hasta 14 nov · Sprint 7 planificado 16–28 nov · Fase 3 con presentación final 30 nov–12 dic.',36,527,W,9,color=M)
d.end()
stage(d,'Plan de cierre','Responsables y estados','Los focos técnicos son propuestas con revisión cruzada.')
d.table([['Tarjeta','Trabajo','Responsable / revisión','Ventana','Estado']]+D['tasks'],[95,275,131,102,W-603],144,8.5)
d.text('Ruta de cierre: revisión del incremento, consolidación de evidencia, entrega de Fase 2 y defensa.',36,526,W,9,color=M)
d.end();d.save()

d=Doc('Sprint 6 - Backlog y seguimiento - 12 noviembre 2026.pdf');W=d.w-72
stage(d,'Sprint 6','Calidad y revisión','Sprint 6 - Calidad · Jira ID 40 · Ventana 2–14 noviembre')
d.note('Objetivo: entregar consultas trazables y evidencia de calidad para revisar antes de Fase 2.',150)
d.table([['Historia','Avance al 12 de noviembre','Estado'],['SCRUM-38','Seis conteos institucionales publicados.','En revisión'],['SCRUM-40','Filtros por acción, entidad y fechas disponibles.','En revisión'],['SCRUM-41','Regresión, carga breve y recorridos documentados. Faltan ensayos humanos.','En curso'],['SCRUM-42','Despliegue y restauración aislada registrados.','En revisión'],['SCRUM-43','Manual por roles preparado para revisión.','En revisión'],['SCRUM-44','Guion de validación escolar propuesto.','Pendiente']],[96,W-194,98],224,10)
y=body(d,'Criterios para la revisión','Auditoría debe aplicar y limpiar filtros, volver a página 1, incluir ambos días de Santiago y devolver solo los campos permitidos. Confirmar los flujos por rol del manual.',563)
d.note('Se mantiene la estimación previa de 37 puntos planificados para seis historias. La serie diaria de esfuerzo restante sigue pendiente para calcular burndown.',724)
d.end()
stage(d,'Seguimiento','Dos guiones de práctica','Simulaciones para ensayar la conversación del equipo')
for y,title,copy in [(154,'Daily simulada','Joel revisa alcance y preparación de entrega.<br/><br/>Agustín recorre Auditoría con teclado y móvil.<br/><br/>Matías revisa resultados de restauración y carga. Bloqueo a conversar: disponibilidad de dispositivos físicos.'),(415,'Review y retrospectiva simuladas','Mostrar el filtro por entidad y periodo. Revisar respuesta vacía y limpieza. Contrastar las pruebas con el criterio del PO.<br/><br/>Mejora propuesta: adjuntar el recorrido al cambio. Registrar acuerdos, asistentes y aceptación durante la reunión real.')]:
    d.rect(36,y,W,222,WHITE,9,LINE)
    d.text(title,53,y+18,W-34,18,'Serif',G)
    d.text(copy,53,y+60,W-34,11)
d.note('Impedimentos: ensayo humano y contraparte escolar. El Sprint 7 queda planificado. Registrar la aceptación del PO y el cierre administrativo después de la revisión.',688)
d.end();d.save()

d=Doc('Manual de usuario por roles - 12 noviembre 2026.pdf');W=d.w-72
manual=[
('Administración','Estructura, matrículas y auditoría',[
('Entrar al portal','Abre sigaa.ignisert.com e ingresa con tu cuenta. El menú se adapta al rol de la sesión.'),
('Configurar la estructura','Abre Estructura escolar. Revisa establecimiento, periodo, niveles, cursos y asignaturas. Vincula al docente en la asignación correspondiente.'),
('Gestionar matrículas','Abre Matrículas. Selecciona el estudiante y el curso vigente. Revisa su estado antes de guardar.'),
('Revisar trazabilidad','En Auditoría escribe una acción o entidad exacta, por ejemplo alerta. Completa Desde y Hasta. Aplica con el botón o Enter. Limpiar restablece los campos.'),
('Consultar indicadores','Abre Indicadores y comprueba alcance y hora. Dirección/UTP e inspectoría también consultan esta vista.')]),
('Inspectoría','Justificaciones y seguimiento',[
('Revisar antecedentes','Abre Estudiantes o Ficha integral. Elige el registro permitido y consulta asistencia y antecedentes publicados.'),
('Procesar una justificación','Abre Justificaciones. Revisa el periodo, el motivo y el estado. Registra la decisión según el flujo autorizado.'),
('Revisar alertas','Abre Alertas y seguimiento. Revisa el indicador de origen y el contexto del estudiante.'),
('Gestionar un caso','En Casos de seguimiento revisa responsable, prioridad, próxima acción y estado. Registra las intervenciones en el caso correspondiente.'),
('Consultar pendientes','Abre Indicadores para ver conteos actuales. Actualizar datos renueva la consulta.')]),
('Docente','Clases y registros académicos',[
('Ubicar el curso','En Cursos revisa los cursos autorizados. Selecciona la asignación correcta antes de escribir registros.'),
('Registrar asistencia','Abre Asistencia, elige curso, asignatura y clase. Registra el estado y guarda. Revisa fecha y estudiante.'),
('Registrar notas','Abre Notas. Selecciona la evaluación y registra la calificación. Usa la publicación cuando el registro esté listo para el estudiante.'),
('Registrar anotaciones','Abre Anotaciones. Elige estudiante y tipo, escribe un motivo pertinente y revisa la visibilidad.'),
('Consultar seguimiento','Abre Alertas y seguimiento o Casos de seguimiento. Revisa los casos autorizados y sus acciones.')]),
('Estudiante','Tus datos y registros publicados',[
('Ingresar','Abre el portal y usa tus credenciales. Si estás en teléfono, abre el menú para elegir una vista.'),
('Consultar asignaturas','En Mis asignaturas revisa el curso y la asignación vigente.'),
('Revisar agenda','En Mi calendario consulta clases y evaluaciones publicadas.'),
('Consultar registros','En Mi asistencia, Mis notas y Mis anotaciones revisa el estado publicado de tus datos.'),
('Revisar justificaciones','En Mis justificaciones consulta los registros que se muestran para tu cuenta. Usa Seguridad para gestionar la sesión.')])]
for role,title,steps in manual:
    stage(d,'Manual / '+role,title,role+' · SIGAA 0.10.1')
    y=147
    for n,(heading,copy) in enumerate(steps,1):
        d.rect(36,y,29,29,G,6)
        d.text(str(n),46,y+5,19,12,'Bold',WHITE)
        d.text(heading,80,y,W-44,13,'Bold',G)
        d.text(copy,80,y+27,W-44,10.5)
        y+=106
    d.note('Si una operación falla, registra la pantalla, el rol, los pasos y el resultado observado. Comparte el reporte sin contraseñas ni datos sensibles.',715)
    d.end()
d.save()

d=Doc('Presentación de avance - 12 noviembre 2026.pdf',(960,540));W=d.w-72
for i,s in enumerate(D['slides'],1):
    d.page('Exposición / '+s['speaker'],s['title'],s['subtitle'])
    if i==1:
        d.rect(0,0,960,540,G)
        d.rect(48,65,8,367,A)
        d.text('SIGAA',82,68,800,18,'Bold',A)
        d.text('Avance de calidad<br/>antes de la entrega',82,126,815,47,'Serif',WHITE)
        d.text('12 noviembre 2026 · Semana 14 · Sprint 6',82,305,815,19,'Sans','#dce9df')
        d.text('0.10.1 / Auditoría, pruebas y recuperación',82,401,815,17,'Sans',WHITE)
    elif i==5:
        d.image('auditoria',382,149,542,306)
        for j,point in enumerate(s['points']):
            d.text(point,36,163+j*87,310,19,'Serif',G)
    elif i==8:
        card_row(d,[('Unitarias',str(T['unit']),'Aprobadas'),('Integración',str(T['integration']),'PostgreSQL 16'),('HTTPS',str(visits),'4 roles / 2 tamaños')],157,128)
        d.text(load_text,36,322,W,20,'Serif',G)
        d.text('Respaldo restaurado. Esquema 0.9.1 conservado.',36,416,W,16)
    else:
        for j,point in enumerate(s['points']):
            y=147+j*74
            d.rect(36,y+4,6,38,A,2)
            d.text(point,62,y,W-28,23,'Serif',G)
            d.line(62,y+58,924,y+58)
    d.end()
d.save()

d=Doc('Guion y material de estudio del equipo SIGAA - 12 noviembre 2026.pdf')
W=d.w-72
stage(d,'Preparación del equipo','Guion y material de estudio','Exposición del 12 de noviembre · 4–5 minutos sugeridos por integrante')
d.c.bookmarkPage('cover');d.c.addOutlineEntry('Índice', 'cover')
d.rect(36,150,W,144,G,9)
d.text('Avance de calidad',54,174,W-36,30,'Serif',WHITE)
d.text('Qué decir, qué señalar y cómo responder preguntas',54,235,W-36,13,'Sans','#e1ebe3')
d.table([['Integrante','Diapositivas','Páginas','Enfoque'],['Joel','1–4','2–5','Contexto, alcance y estado'],['Agustín','5–8','6–9','Auditoría, arquitectura y pruebas'],['Matías','9–12','10–13','Pendientes, Gantt y cierre']],[87,92,71,W-250],341,10)
d.note('Practiquen con la presentación abierta. En cada bloque hay un discurso sugerido, indicaciones para explicar las láminas y preguntas para ensayar.',624)
d.end()
study={
'Joel':[
 ('Versión, sprint y fase','0.10.1 identifica el incremento. Sprint 6 es la ventana de trabajo. Semana 14 y Fase 2 vienen del cronograma académico.'),
 ('Persistencia','Los registros se guardan en PostgreSQL. Un dato publicado se puede volver a consultar al recargar.'),
 ('Roles','La API verifica permisos. Docencia registra sus cursos; el estudiante consulta sus propios datos.'),
 ('Ejemplo','Una inasistencia puede generar una alerta. El personal autorizado revisa antecedentes y registra un caso o intervención.')],
'Agustín':[
 ('Límites de fechas','Desde incluye el inicio del día. Hasta incluye el día completo de Santiago. La API consulta hasta antes de la medianoche siguiente.'),
 ('Carga breve',load_text+' p95 es el tiempo dentro del cual respondió el 95 % de las solicitudes medidas.'),
 ('Recuperación','El respaldo se restauró en un contenedor aislado. Los conteos recuperados verifican presencia de datos y tablas.'),
 ('Arquitectura','Navegador solicita a la API. La API verifica permisos, consulta PostgreSQL y devuelve resultados a React.')],
'Matías':[
 ('Revisión y aceptación','Una historia en revisión está lista para evaluar. El PO registra su aceptación o las observaciones.'),
 ('Gantt','Las barras ubican el trabajo en el tiempo. Los estados y evidencias se consultan en Jira.'),
 ('Calidad pendiente','La carga breve, los recorridos emulados y la restauración tienen alcances concretos. Aún falta validar dispositivos físicos y accesibilidad integral.'),
 ('Entrega académica','Confirmar documentos oficiales, horario y plataforma de entrega. Registrar las decisiones reales del equipo.')]}
faq={
'Joel':[('¿Para quién es SIGAA?','Para colegios y liceos. Reúne registros académicos y seguimiento.'),('¿Son estudiantes reales?','Los 80 registros de la demostración son ficticios.'),('¿Qué cambió hoy?','Los filtros de auditoría y su verificación en la versión 0.10.1.'),('¿Está aprobado?','La revisión técnica tiene evidencia. El PO aún debe registrar su aceptación.'),('¿Cuándo se entrega?','Ventana de Fase 2 entre 16 y 21 de noviembre. Confirmar el horario en Campus.')],
'Agustín':[('¿Quién consulta Auditoría?','Administración. La API comprueba el rol.'),('¿Qué cambia al limpiar?','Vuelven los campos vacíos y la primera página del listado.'),('¿Qué significa p95?','Es el percentil 95 de tiempo de respuesta en la prueba aislada.'),('¿Ocho recorridos equivalen a ocho equipos?','Son cuatro roles y dos tamaños de pantalla emulados en un Mac.'),('¿Hubo una migración?','La API 0.10.1 conserva el esquema 0.9.1.')],
'Matías':[('¿Qué queda para cerrar?','Aceptación, ensayos humanos, validación escolar y consolidación de entrega.'),('¿Cuál es la prioridad?','Revisar el incremento, corregir observaciones y preparar evidencias.'),('¿Las ceremonias se hicieron?','Los dos guiones son ejercicios simulados. El equipo registrará las reuniones reales.'),('¿Quién responde por cada parte?','Los tres trabajan juntos. Los focos técnicos son propuestos y hay revisión cruzada.'),('¿Cuándo es la defensa?','La ventana va del 30 de noviembre al 12 de diciembre. Consultar el horario oficial.')]}
cues=['Señala versión, semana y sprint.','Usa el ejemplo de asistencia y caso.','Ubica el salto de 0.10.0 a 0.10.1.','Pasa la palabra a Agustín.','Muestra entidad, fechas, aplicar y limpiar.','Explica qué campos se muestran.','Sigue la solicitud del navegador a la base.','Di los resultados y entrega a Matías.','Distingue revisión, calidad y entrega.','Señala las ventanas en orden.','Presenta el reparto como propuesta.','Cierra y abre espacio a preguntas.']
for start,name in [(0,'Joel'),(4,'Agustín'),(8,'Matías')]:
    for offset in [0,2]:
        stage(d,'Guion / '+name,'Qué puedes decir','Texto para ensayar y adaptar · 45–65 segundos por diapositiva')
        if offset==0:
            key='person'+str(start);d.c.bookmarkPage(key);d.c.addOutlineEntry(name,key)
        y=153
        for idx in range(start+offset,start+offset+2):
            s=D['slides'][idx]
            d.rect(36,y,36,34,G,6);d.text(str(idx+1),46,y+5,23,15,'Serif',WHITE)
            d.text(s['title'],86,y,W-50,16,'Serif',G)
            y=d.text(s['script'],36,y+54,W,11)+14
            y=d.text(cues[idx],36,y,W,10,'Bold',G2)+27
            d.line(36,y-13,d.w-36,y-13)
        d.end()
    stage(d,'Estudio / '+name,'Conceptos y ejemplos','Explica las ideas con tus propias palabras.')
    y=149
    for title,copy in study[name]:y=body(d,title,copy,y)
    d.note(evidence+'. '+load_text,717)
    d.end()
    stage(d,'Preguntas / '+name,'Preguntas de ensayo','Practica una respuesta breve y apóyala con un dato comprobado.')
    y=147
    for question,answer in faq[name]:
        y=d.text(question,36,y,W,11,'Bold',G)+6
        y=d.text(answer,36,y,W,11)+25
    d.note('React: ri-áct · Vite: viit · Node.js: nóud yéi es · Nginx: én-yin éks · Docker: dó-ker · Jira: yí-ra.',716)
    d.end()
d.save()
print('Seis PDF generados')

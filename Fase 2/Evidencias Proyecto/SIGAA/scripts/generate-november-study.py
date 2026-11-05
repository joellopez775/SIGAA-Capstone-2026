"""Personal speaking scripts and study guides aligned to the redesigned deck."""
from pathlib import Path
import json,hashlib
# Reuse the visual vocabulary without running the delivery generator.
source=Path(__file__).with_name('redesign-november-pdfs.py').read_text()
exec(source.split('# Report:')[0])
FOLDER='Preparación de presentación/5 noviembre 2026/'
PEOPLE=[
{'name':'Joel','slides':'1-4','focus':'Presentar el problema, la solución y el punto de avance.','handoff':'Con este contexto, Agustín explicará las funciones que incorporamos y cómo comprobamos su funcionamiento.',
'script':[
('1','Una visión completa del avance escolar','Abrir con seguridad y ubicar el proyecto.',
'Buenos días. Somos el equipo de SIGAA, una plataforma de gestión y seguimiento académico para colegios y liceos. Hoy presentamos el avance del 5 de noviembre. Estamos trabajando en el Sprint 6 y la versión publicada es la 0.10.0. En esta exposición primero explicaré qué problema abordamos y qué está disponible. Después, Agustín mostrará los indicadores, la auditoría y las pruebas. Finalmente, Matías explicará qué falta y cómo organizamos el cierre. La idea es distinguir lo implementado de lo que todavía necesita revisión.',
'Señala versión, sprint y semana. No leas los tres números sin explicar qué significan.'),
('2','Gestión escolar y acompañamiento','Explicar para quién sirve y qué problema resuelve.',
'SIGAA está orientado a colegios y liceos. Su propósito es reunir información que suele estar repartida: asistencia, notas, anotaciones y acciones de seguimiento. Cada usuario accede a lo que corresponde a su rol. El estudiante consulta sus registros publicados; el docente trabaja con sus cursos; inspectoría gestiona justificaciones y seguimiento; administración configura la estructura y consulta información institucional. Por ejemplo, si un estudiante presenta dificultades, el equipo puede revisar sus antecedentes y registrar un caso, en vez de reconstruir todo desde archivos separados. Esa es la necesidad que buscamos atender.',
'Señala los cuatro actores. Presenta el caso como ejemplo de uso, no como validación de un colegio real.'),
('3','Base que ya funciona','Mostrar el recorrido acumulado sin exagerarlo.',
'Ya contamos con acceso por roles y datos guardados en PostgreSQL. La parte académica incluye matrículas, cursos, clases, asistencia, notas y anotaciones. El seguimiento incorpora alertas, casos, apoderados, ficha integral y avisos. El estudiante también dispone de asignaturas y calendario. Para recorrer el sistema cargamos datos ficticios de ochenta estudiantes y doce docentes. Esto permite mostrar distintos escenarios, pero no equivale a una implementación validada con personas de un establecimiento real. El portal de acceso para apoderados todavía no está implementado; sí existen sus registros y vínculos.',
'Agrupa en tres bloques. Evita enumerar todos los módulos con la misma velocidad.'),
('4','En qué punto estamos','Conectar el avance con las fechas oficiales.',
'Según el cronograma docente, estamos en la semana trece de la Fase 2. La ventana del Sprint 6 va del 2 al 14 de noviembre; su activación en Jira se registró el día 5. El siguiente hito es la entrega de Fase 2, dentro de la semana del 16 al 21 de noviembre. Después vienen la retroalimentación y la preparación de la presentación final, cuya ventana va del 30 de noviembre al 12 de diciembre. Estas son ventanas de planificación; el día y la hora deben confirmarse en Campus. Con este contexto, Agustín continuará con el incremento técnico.',
'Señala ahora, entrega y cierre; realiza la transición mirando a Agustín.')],
'concepts':[
('Versión, sprint y fase','La versión identifica una entrega del software: 0.10.0. El sprint es una ventana de trabajo: Sprint 6. La fase y la semana pertenecen al calendario académico. Son referencias distintas y no se sustituyen entre sí.'),
('Dato persistente','Es información guardada en la base que se vuelve a consultar al entrar o recargar. Ejemplo: una nota publicada no depende de una lista fija dibujada en la pantalla.'),
('Roles y permisos','Un rol agrupa responsabilidades; un permiso determina qué operaciones están permitidas. El menú ayuda a navegar, pero la API vuelve a comprobar el acceso aunque alguien escriba la dirección de una solicitud.'),
('Product Owner','Joel prioriza y acepta o devuelve el trabajo. La aceptación debe registrarse; que una prueba pase no significa que el PO ya haya aprobado. Los tres integrantes también desarrollan, prueban y documentan.')],
'flow':[
('Situación','Un estudiante tiene inasistencias reiteradas. Es un ejemplo ilustrativo, no un caso real.'),('Consulta','El personal autorizado revisa sus registros y la alerta correspondiente.'),('Seguimiento','Puede abrir un caso y registrar una intervención con responsable y próxima acción.'),('Trazabilidad','La ficha permite relacionar antecedentes y acciones. La auditoría registra operaciones del sistema.')],
'faq':[
('¿SIGAA es para universidades?','No. El dominio confirmado es colegios y liceos; los cursos, roles y flujos responden a ese contexto.'),('¿Qué hay realmente implementado?','Los módulos expuestos en la diapositiva 3 y las nuevas vistas del incremento. Explica su alcance; no incluyas portal de apoderados ni envío externo de mensajes.'),('¿Ochenta estudiantes son usuarios reales?','No. Son datos ficticios para demostración y pruebas. Aún falta validación con una contraparte escolar.'),('¿Todo está terminado?','No. Hay software funcionando y evidencias técnicas; quedan aceptación, pruebas humanas, calidad y consolidación documental.'),('¿Quién es Scrum Master?','Agustín figura como propuesto; su ratificación y los focos técnicos siguen pendientes. Joel sí está confirmado como PO.'),('¿Cuál es la fecha exacta de entrega?','La ventana oficial de Fase 2 es 16-21 noviembre. Confirmar día y hora en Campus; no convertir la ventana en un plazo exacto inventado.')],
'pronounce':'SIGAA: si-gá · Product Owner: pró-dakt óu-ner · Sprint: esprint · PostgreSQL: puedes decir Postgres.'},
{'name':'Agustín','slides':'5-8','focus':'Explicar el incremento técnico y las pruebas con palabras simples.','handoff':'Con las funciones y pruebas explicadas, Matías presentará los pendientes y el plan para finalizar.',
'script':[
('5','Nuevo: indicadores del establecimiento','Explicar el significado de los seis conteos.',
'En este incremento agregamos una vista de indicadores. Administración, inspectoría y dirección o UTP pueden consultar seis conteos del estado actual: estudiantes regulares, cursos activos, matrículas activas, casos no cerrados, justificaciones pendientes y evaluaciones publicadas. La pantalla también informa el alcance y la hora de consulta. Estos datos provienen de PostgreSQL y se renuevan al actualizar. Es importante interpretar bien la cifra: cuatro justificaciones pendientes significa cuatro registros por revisar, no una tasa de ausentismo ni una predicción. El objetivo de esta vista es ofrecer un panorama operativo claro.',
'Señala la captura y el alcance. No memorices cifras de pantalla: pueden cambiar.'),
('6','Nuevo: consulta de auditoría','Explicar qué se registra, quién accede y qué se protege.',
'También incorporamos una consulta de auditoría exclusiva de administración. Permite revisar el autor, la fecha, la operación y la entidad afectada por un evento registrado. Se puede filtrar por el nombre exacto de una acción y recorrer páginas de hasta veinticinco eventos. Por ejemplo, una modificación puede quedar identificada como una operación sobre un registro del sistema. La respuesta de esta consulta no entrega los valores privados anteriores o nuevos del evento. Esta vista sirve para revisar trazabilidad; no permite editar o eliminar eventos ni equivale a una auditoría externa de seguridad.',
'Explica entidad como el tipo de registro, por ejemplo estudiante o alerta.'),
('7','Cómo se sostiene el sistema','Contar el viaje de una solicitud.',
'La aplicación tiene una interfaz, un servidor y una base de datos. React construye las pantallas y Vite prepara la interfaz. Cuando el usuario solicita información, la API desarrollada con Node.js y Express recibe la petición, comprueba los permisos y consulta PostgreSQL. Después devuelve los datos para mostrarlos. Docker organiza los servicios y sus dependencias. Nginx entrega la web y dirige las solicitudes; Cloudflare permite acceder al dominio por HTTPS mediante el túnel hacia el servidor. La nueva versión de la API es la 0.10.0 y conserva el esquema de base de datos 0.9.1, sin una migración nueva.',
'Sigue el diagrama de izquierda a derecha. API y esquema pueden tener versiones diferentes.'),
('8','Qué comprobamos','Explicar la evidencia y sus límites.',
'En esta entrega pasaron seis pruebas unitarias y sesenta y nueve de integración. Las de integración se ejecutaron con PostgreSQL 16 dentro de un entorno Docker aislado. Las pruebas nuevas comprueban permisos, exactitud de los conteos y el filtro, la paginación y la privacidad de la auditoría. Además, se aprobaron ocho recorridos por HTTPS: cuatro roles con dos tamaños de pantalla en un mismo Mac. Esto comprueba funcionamiento y presentación en esos recorridos, pero no sustituye una prueba con varios dispositivos físicos. La aceptación funcional todavía corresponde al Product Owner. Matías explicará ahora cómo cerraremos esos pendientes.',
'No sumes pruebas distintas como si midieran lo mismo. Ocho recorridos no son ocho dispositivos.')],
'concepts':[
('Conteo frente a indicador predictivo','Un conteo responde cuántos registros cumplen una condición. No demuestra causalidad ni anticipa abandono. Casos abiertos significa estado distinto de cerrado; evaluaciones publicadas significa estado publicada.'),
('API y consulta SQL','La API recibe la solicitud y aplica permisos. SQL consulta la base. En este incremento las cifras se calculan sobre registros actuales; la interfaz no inventa los totales.'),
('Auditoría y privacidad','Un evento identifica una operación. La vista nueva muestra metadatos de esa operación, sin incluir el payload privado del cambio. Solo administración accede; no debe confundirse con la ficha académica del estudiante.'),
('Pruebas por capas','Una prueba unitaria revisa una regla aislada; una de integración comprueba varias partes trabajando con la base; un recorrido de navegador comprueba el flujo visible. Ninguna capa garantiza por sí sola que no existan fallas.')],
'flow':[
('Navegador','Administración abre Indicadores y solicita los datos.'),('API','El servidor comprueba la sesión y el rol. Una petición de docente o estudiante a este módulo se rechaza.'),('PostgreSQL','Una consulta cuenta los registros según seis definiciones. No modifica notas ni asistencias.'),('Respuesta','La interfaz muestra los conteos, el alcance y la hora de consulta; Actualizar datos repite la lectura.')],
'faq':[
('¿Por qué no basta con ocultar el menú?','Porque una persona podría enviar solicitudes directamente. La API también debe comprobar identidad y permisos.'),('¿Qué protege HTTPS?','Cifra la comunicación entre navegador y el extremo HTTPS y verifica el certificado. No reemplaza el control de permisos ni asegura por sí solo todo el sistema.'),('¿Se pueden ver contraseñas en auditoría?','La respuesta del nuevo endpoint excluye los valores privados anteriores y nuevos. Las contraseñas de acceso se almacenan mediante hash, no como texto recuperable.'),('¿Los indicadores muestran promedios?','No. En este incremento son seis conteos del estado actual; no son promedios oficiales ni predicciones.'),('¿Cómo saben que los conteos son correctos?','Las pruebas comparan consultas con la base y comprueban el formato y alcance de la respuesta. Aún se requiere revisión funcional de las definiciones.'),('¿Ya pasó todas las pruebas posibles?','No. Falta carga con objetivo acordado, accesibilidad integral, otros dispositivos físicos y validación escolar. Lo ejecutado está delimitado en la evidencia.')],
'pronounce':'React: ri-áct · Vite: viit · Node.js: nóud yéi es · Express: ik-sprés · Docker: dó-ker · Nginx: én-yin éks · Cloudflare: cláud-fler.'},
{'name':'Matías','slides':'9-12','focus':'Explicar los pendientes, el calendario y las decisiones de cierre.','handoff':'Con esto finalizamos el avance. Quedamos atentos a sus preguntas y observaciones.',
'script':[
('9','Qué falta para cerrar','Distinguir tener código de cerrar el proyecto.',
'Aunque el incremento está funcionando, todavía hay trabajo de cierre. Primero, el Product Owner debe revisar y aceptar las historias o registrar las correcciones. También falta probar desde otros equipos y redes, ejecutar pruebas de carga con un objetivo definido y completar la revisión de accesibilidad. En documentación debemos consolidar manuales y evidencias oficiales. Además, necesitamos contrastar la propuesta con una contraparte escolar. Estas tareas importan porque una demostración con datos ficticios y pruebas automatizadas no demuestra por sí sola que la solución ya esté validada para operar en un colegio real.',
'Sigue las tres categorías de la diapositiva: aceptación, calidad y entrega.'),
('10','Plan hasta la entrega','Convertir los pendientes en ventanas de trabajo.',
'Organizamos el cierre en ventanas. Entre el 5 y el 7 de noviembre proponemos revisar indicadores y auditoría. Del 9 al 14, completar pruebas, manuales y correcciones. Del 16 al 21, consolidar y entregar Fase 2. La semana del 23 al 28 se reserva para responder observaciones y ensayar la defensa. La presentación final de Fase 3 se ubica entre el 30 de noviembre y el 12 de diciembre. La Gantt detalla las actividades, los responsables propuestos y la revisión. Estas fechas describen planificación; no significan que el trabajo ya se realizó ni reemplazan el horario de Campus.',
'Señala la secuencia. No prometas que una ventana ya es una fecha confirmada.'),
('11','Responsabilidades compartidas','Mostrar equilibrio y colaboración.',
'Los tres integrantes podemos desarrollar, probar y documentar. Para ordenar el cierre, proponemos que Joel se concentre en integración y revisión del incremento; Agustín en manual y accesibilidad; y yo en pruebas y evidencia. Esto define un foco, no una separación rígida. Cada trabajo debe tener una revisión de otro integrante y las actividades de entrega siguen siendo de equipo. Joel tiene confirmado el rol de Product Owner. El rol de Scrum Master propuesto para Agustín y el reparto técnico deben ratificarse. Tampoco atribuimos automáticamente un desarrollo a alguien por aparecer como responsable propuesto.',
'Usa proponemos, no acordamos, mientras el equipo no ratifique el reparto.'),
('12','El siguiente paso es revisar juntos','Cerrar con decisiones concretas.',
'El siguiente paso es revisar el incremento, registrar observaciones y acordar responsables. Después debemos ejecutar las pruebas humanas pendientes y confirmar la entrega en Campus. Los documentos incluyen dos guiones simulados de seguimiento como apoyo de práctica; no son evidencia de reuniones realizadas ni de aprobaciones. Para el cierre guardaremos las decisiones reales con fecha, participantes y observaciones cuando ocurran. Con esto mostramos lo que ya está disponible y una ruta concreta para terminar lo restante. Muchas gracias. Quedamos atentos a sus preguntas y a la retroalimentación sobre la solución.',
'Pausa al terminar; no abras un módulo nuevo ni anuncies la aprobación como hecha.')],
'concepts':[
('Revisión frente a aceptación','En revisión significa que el incremento se presenta para evaluar. Terminada requiere cumplir los criterios acordados y registrar aceptación. Un resultado de prueba no reemplaza la decisión del PO.'),
('Prueba de carga y accesibilidad','Carga comprueba comportamiento bajo un volumen definido de uso. Accesibilidad revisa, entre otros aspectos, teclado, foco, etiquetas y contraste. No deben declararse completadas sin evidencia específica.'),
('Gantt y dependencias','La Gantt ubica actividades en el tiempo. Una dependencia indica qué debe estar disponible antes: para entregar conviene tener correcciones revisadas, manuales consolidados y evidencia preparada. Una barra no equivale a porcentaje terminado.'),
('Entrega académica y cierre','Publicar la web, fusionar código y entregar evidencias en Campus son acciones distintas. La presentación final corresponde a Fase 3. Confirmar plantillas y horarios antes de declarar una entrega realizada.')],
'flow':[
('Revisar','Mostrar el incremento y registrar observaciones del PO.'),('Corregir y comprobar','Resolver lo observado y adjuntar pruebas pertinentes.'),('Consolidar','Reunir manuales, evidencias, documentos oficiales y revisar el código pendiente de integración.'),('Entregar y aprender','Realizar la entrega académica, responder feedback y registrar la retrospectiva real del equipo.')],
'faq':[
('¿Cuánto falta en porcentaje?','No hay una medición fiable para dar un porcentaje global. Enumera pendientes verificables y fechas propuestas; no inventes un 90 % de avance.'),('¿Todos los sprints anteriores están cerrados?','No se presume su cierre. Hay registros históricos cuya aceptación y cierre administrativo deben revisarse en Jira.'),('¿Por qué quedan pruebas si ya hay 69 de integración?','Porque esas pruebas cubren escenarios programados. Carga, accesibilidad y ensayos humanos desde otros equipos evalúan aspectos adicionales.'),('¿Las reuniones del PDF ocurrieron?','Son dos guiones identificados como simulaciones. No acreditan asistencia, acuerdos ni trabajo individual realizado.'),('¿Qué pasa si falta capacidad del equipo?','Priorizar aceptación, correcciones, pruebas y entrega. Exportaciones y portal de apoderados están fuera del compromiso actual; no agregar alcance sin revisar capacidad.'),('¿Qué debemos confirmar antes de entregar?','La versión revisada, la evidencia de pruebas, los manuales, las plantillas oficiales, la revisión de la solicitud #1 y el día/hora en Campus.')],
'pronounce':'Scrum: skram · Review: ri-viú · Backlog: bák-log · Jira: yí-ra · GitHub: guit-jab. Puedes decir revisión, lista priorizada y retrospectiva en español.'}
]
def block(d,label,body,y):
 y=d.heading(label,36,y)+10;return d.text(body,36,y,d.w-72,11)+23
manifest=[]
for person in PEOPLE:
 name=person['name'];filename=FOLDER+name+' - Guion y material de estudio - 5 noviembre 2026.pdf';d=Doc(filename);W=d.w-72
 d.page('Preparación individual / '+name,'Guion + material de estudio','Presentación de avance de SIGAA · Versión 0.10.0 · Corte 5 noviembre 2026')
 d.rect(36,153,W,144,G,10);d.text(name,55,170,W-38,34,'Serif',WHITE);d.text('Diapositivas '+person['slides']+'  /  4-5 minutos sugeridos',55,229,W-38,16,'Sans','#e1ebe3');d.text(person['focus'],36,323,W,14,'Serif',G)
 d.table([['Páginas','Cómo utilizarlas'],['2-3 / Guion','Texto propuesto para hablar; ensayar y adaptarlo a tu forma de expresarte.'],['4-5 y 7 / Estudio','Conceptos y ejemplo explicado para comprender el contenido.'],['6 / Preguntas','Respuestas breves para practicar sin inventar avances.']],[120,W-120],390,10)
 d.heading('Antes de exponer',36,627);d.text('Lee el material de estudio primero. Después practica el guion mirando las diapositivas, no el PDF. Usa las frases como apoyo y señala el dato o diagrama que estás explicando.',36,658,W,11)
 d.note('Reparto del equipo: Joel 1-4 · Agustín 5-8 · Matías 9-12. Cada integrante presenta cuatro diapositivas; esto no atribuye autoría individual del desarrollo.',741);d.end()
 for group in [person['script'][:2],person['script'][2:]]:
  d.page('Guion / '+name,'Qué puedes decir','Propuesta de discurso · Aproximadamente 45-65 segundos por diapositiva')
  y=153
  for num,title,goal,spoken,cue in group:
   d.rect(36,y,39,37,G,7);d.text(num,47,y+6,25,17,'Serif',WHITE);d.text(title,89,y+1,W-55,17,'Serif',G);d.text(goal,89,y+31,W-55,9,color=M)
   y=d.text(spoken,36,y+64,W,11)+12
   y=d.text('APOYO AL EXPONER  /  '+cue,36,y,W,9,'Bold',G2)+28
   d.line(36,y-13,d.w-36,y-13)
  d.end()
 d.page('Estudio / '+name,'Entender antes de memorizar','Conceptos de tu bloque, con ejemplos y límites concretos.')
 y=154
 for i,(title,body) in enumerate(person['concepts'],1):
  d.label('0'+str(i)+' / CONCEPTO',36,y);y=d.heading(title,36,y+21)+10;y=d.text(body,36,y,W,11)+30
 d.text('Si una palabra técnica te cuesta, explícala en lenguaje cotidiano. Lo importante es comprender qué hace y qué no demuestra.',36,748,W,9,color=M);d.end()
 d.page('Estudio aplicado / '+name,'Un ejemplo paso a paso','Puedes usar este recorrido si te piden aclarar cómo funciona el sistema.')
 y=153
 for i,(title,body) in enumerate(person['flow'],1):
  d.rect(36,y,31,31,G,7);d.text(str(i),46,y+5,20,14,'Serif',WHITE);d.text(title,82,y,W-46,15,'Serif',G);d.text(body,82,y+29,W-46,11);y+=112
 d.heading('Pronunciación de apoyo',36,626);d.text(person['pronounce'],36,658,W,11)
 d.note('Transición o cierre sugerido: '+person['handoff'],729);d.end()
 d.page('Preguntas / '+name,'Practica las respuestas','Lee la pregunta, responde sin mirar y comprueba después la idea esencial.')
 y=149
 for question,answer in person['faq']:
  y=d.text(question,36,y,W,11,'Bold',G)+6;y=d.text(answer,36,y,W,10.5)+20
 d.text('Lista final: versión 0.10.0 · Sprint 6 · 6 unitarias / 69 integración / 8 recorridos HTTPS. Datos ficticios. Aceptación del PO y validación escolar pendientes.',36,744,W,9,'Bold',G2);d.end()
 d.page('Referencia común / '+name,'El sistema completo en una página','Apoyo para los tres integrantes, independiente del bloque asignado.')
 d.table([['Tecnología','Qué hace en SIGAA'],['React + Vite','Construyen y preparan las pantallas de la plataforma.'],['Node.js + Express','Ejecutan la API, reciben solicitudes y aplican reglas y permisos.'],['PostgreSQL / SQL','Guardan los registros relacionados y permiten consultarlos.'],['Docker / Compose','Organizan los servicios y sus dependencias para ejecutarlos.'],['Nginx','Entrega la web y dirige solicitudes hacia la API.'],['Cloudflare / HTTPS','Permiten el acceso público cifrado mediante el dominio y túnel.'],['Playwright','Automatiza recorridos de navegador para comprobar flujos.'],['Git / GitHub / Jira','Registran cambios, alojan código y organizan historias y sprints.']],[150,W-150],152,10)
 d.heading('Recorrido que los tres deben poder explicar',36,598);d.text('Usuario / interfaz / API con permisos / consulta de base / respuesta visible. El estudiante consulta sus datos; administración gestiona estructura y consulta auditoría. Los conteos institucionales no son predicciones.',36,631,W,11)
 d.note('Fuentes: presentación PDF del 5/11, informe de avance y evidencia en output/evidence/nov5/. Son guiones de exposición, no actas ni atribuciones de autoría individual.',729);d.end();d.save()
 manifest.append({'member':name,'slides':person['slides'],'file':filename,'pages':7})
(R/'output/evidence/nov5/study-guides.json').write_text(json.dumps({'cutoff':'2026-11-05','presentation':'Presentación de avance - 5 noviembre 2026.pdf','timing':'4-5 minutes per presenter, 12-15 minutes total (suggested)','guides':manifest},ensure_ascii=False,indent=2))
print('Tres guías individuales generadas')

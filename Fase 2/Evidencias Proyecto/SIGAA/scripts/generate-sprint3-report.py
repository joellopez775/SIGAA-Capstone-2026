"""Regenerate the Sprint 3 PDF from verified evidence; requires reportlab."""
from pathlib import Path
from xml.sax.saxutils import escape
import json
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, Preformatted
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4

root = Path(__file__).resolve().parents[1]
out = root / "output/pdf/Sprint 3 - Implementación real y verificación.pdf"
out.parent.mkdir(parents=True, exist_ok=True)
evidence = json.loads((root / "output/evidence/sprint-3/test-results.json").read_text())
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="BodySIGAA", fontName="Helvetica", fontSize=10, leading=15, spaceAfter=9, textColor=colors.HexColor("#273d32")))
styles.add(ParagraphStyle(name="TitleSIGAA", fontName="Helvetica-Bold", fontSize=28, leading=33, spaceAfter=22, textColor=colors.HexColor("#173f31")))
styles.add(ParagraphStyle(name="SmallSIGAA", fontName="Helvetica", fontSize=8, leading=11, spaceAfter=6))
styles.add(ParagraphStyle(name="CodeSIGAA", fontName="Courier", fontSize=7.5, leading=11, spaceAfter=12, backColor=colors.HexColor("#edf1eb"), borderPadding=8))
story=[]
def p(text): story.append(Paragraph(text, styles["BodySIGAA"]))
def h(text): story.append(Paragraph(text, styles["TitleSIGAA"]))
def small(text): story.append(Paragraph(text, styles["SmallSIGAA"]))
def code(text): story.append(Preformatted(text, styles["CodeSIGAA"]))
def page(title): story.append(PageBreak());h(title)
def table(rows,widths):
    cells=[[Paragraph(escape(str(c)),styles["SmallSIGAA"]) for c in row] for row in rows]
    t=Table(cells,colWidths=widths,repeatRows=1,hAlign="LEFT")
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#e1e8db")),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),9),("RIGHTPADDING",(0,0),(-1,-1),9),("TOPPADDING",(0,0),(-1,-1),9),("BOTTOMPADDING",(0,0),(-1,-1),8),("LINEBELOW",(0,0),(-1,-1),.4,colors.HexColor("#d5ddd3"))]))
    story.append(t);story.append(Spacer(1,14))
def shot(name,width):
    im=Image(str(root/"tmp/sprint3-evidence"/name))
    im.drawHeight*=width/im.drawWidth;im.drawWidth=width;return im

small("SIGAA · CAPSTONE 2026 · REGULARIZACIÓN TÉCNICA · 15 OCTUBRE 2026")
h("Sprint 3<br/>Implementación real")
p("Autenticación, permisos, estudiantes y matrículas conectados a PostgreSQL. Informe de implementación, pruebas y operación para Joel López, Product Owner.")
table([["Historia existente","Resultado técnico"],["SCRUM-23 / PB-011","Contraseñas con hash, sesión persistente, expiración, cierre y revocación."],["SCRUM-24 / PB-012","Permisos de administración, docente y estudiante verificados en servidor."],["SCRUM-27 / PB-015","Alta, consulta y edición persistentes; validaciones y auditoría."],["SCRUM-28 / PB-016","Matrícula por curso/periodo, duplicidad, cupos y conservación de historial."]],[150,350])
p("<b>Tratamiento de Jira:</b> 12 subtareas técnicas terminadas; 4 historias listas para revisión del PO. No se inventa una aceptación ni se cierra el sprint automáticamente. Se reutilizan sus incidencias e identificadores.")
p("<b>Alcance verificado:</b> desarrollo local aislado con Node.js 22, PostgreSQL 14.22 y Chromium. La configuración Docker utiliza PostgreSQL 16, pero no se pudo ejecutar su motor en este Mac. El servidor remoto no fue modificado.")
for result in evidence["checks"]:
    p(f"<b>{escape(result['label'])}:</b> {escape(result['result'])}.")
small("Fuentes de evidencia: código del repositorio; test-results.json; pruebas unitarias, integración y navegador incluidas en scripts y apps/*/test. Datos de pruebas totalmente sintéticos.")

page("Arquitectura y permisos")
p("Navegador - mismo origen web/Nginx - API Express - PostgreSQL. La API obtiene identidad y rol desde una sesión persistente; no acepta x-demo-role ni x-demo-student-id como autorización.")
table([["Operación","Administración","Docente","Estudiante"],["Estudiantes","Crear, editar y consultar","Consultar matriculados en cursos asignados","Consultar solo su registro"],["Matrículas","Crear, cerrar y consultar historial","Consultar cursos asignados","Consultar su historial"],["Cursos","Consultar estructura existente","Consultar asignaciones","Consultar su matrícula activa"],["Clases/asistencia (API)","No reemplaza al profesor","Crear/registrar solo con asignación vigente","Sin escritura"],["Notas publicadas","Fuera del gestor Sprint 3","Edición pendiente de integración","Solo notas propias publicadas"],["Auditoría","Consultar eventos","Sin acceso al registro general","Sin acceso al registro general"]],[145,118,118,119])
p("Las contraseñas <b>no se cifran de forma reversible</b>: se guardan con scrypt (N=131072, r=8, p=1), sal aleatoria y comparación de tiempo constante. No hay contraseñas comunes ni cuentas automáticas por defecto.")
p("Sesiones opacas de 256 bits: solo su hash queda en la BD. Cookie HttpOnly y SameSite=Strict; en producción también Secure y prefijo __Host-. Duración máxima 8 horas e inactividad máxima 30 minutos. Cierre individual/global y cambio de contraseña revocan sesiones.")
p("Protección de escrituras: origen explícito, JSON y token CSRF de sesión. Límite persistente de intentos de acceso y de concurrencia del hash. Errores de credenciales genéricos. Las respuestas sensibles no se almacenan en caché.")
small('Referencias técnicas: <link href="https://nodejs.org/docs/latest-v22.x/api/crypto.html">Node.js 22 Crypto</link>; <link href="https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html">OWASP Password Storage</link>; <link href="https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html">OWASP Session Management</link>.')

page("Datos e historial")
p("La migración 007 es aditiva: agrega sesiones, límites de intentos y referencias al usuario que crea/modifica estudiantes y matrículas. Conserva el esquema escolar existente; no vuelve a ejecutar la conversión antigua 003.")
table([["Recurso","Reglas aplicadas"],["Estudiante","Identificador normalizado, nombres/apellidos obligatorios, correo válido y único; estados controlados. Edición rechazada si la versión consultada ya cambió."],["Matrícula","Estudiante regular, curso activo y periodo correcto/activo. Una matrícula activa por estudiante y periodo. Bloqueos transaccionales para evitar carreras y superar cupos."],["Cierre","Retirada, finalizada o anulada; exige motivo. No se elimina el registro ni se reactiva un histórico: una nueva matrícula crea otro registro."],["Auditoría","Usuario, acción, fecha, valores anteriores/nuevos. Se escribe en la misma transacción del cambio. La tabla existente impide modificar o eliminar sus eventos."],["Persistencia","Prueba con procesos de API distintos: crear/editar, cerrar API, abrir nueva API y conexión, consultar mismos datos e historial."]],[115,385])
p("<b>Archivos principales:</b> apps/api/src/security.js; school-app.js; repository.js; teacher-routes.js; manage-user.js; infra/postgres/init/007_sprint3_security.sql; apps/web/src/SecureApp.jsx.")
p("<b>Interfaz real:</b> acceso común, panel por rol, estudiantes, cursos, matrículas, notas publicadas y seguridad de la cuenta. La edición de notas, alertas y justificaciones del prototipo no se mezcla con registros reales. App.jsx y prototype-data.js quedan como referencia histórica, no como entrada operativa.")
p("La escritura docente de clases y asistencia tiene pruebas de autorización y persistencia en la API. Su interfaz completa, el motor configurable de alertas y el resto del Sprint 4 requieren su propia integración/revisión; este informe no los declara terminados.")

page("Instalación local y cuentas")
p("Requisitos: Git, Docker Desktop/Engine y Compose. Para desarrollo sin contenedores: Node.js 22.12 o superior y PostgreSQL. Trabajar desde la rama publicada del proyecto; no copiar claves del servidor a equipos de compañeros.")
code("git clone https://github.com/joellopez775/SIGAA-Capstone-2026\ncd Captsone\ngit switch main\ncd SIGAA\ncp .env.example .env\ndocker compose up --build -d")
p("En Windows copia .env.example como .env desde el explorador o con Copy-Item. Abre http://localhost:8088. Si cambias el puerto web, cambia también APP_ORIGIN: debe ser el origen exacto que usa el navegador.")
p("<b>Opción A: cuenta administrativa real.</b> Guarda un JSON privado fuera de Git (.secrets/admin.json), con email, name, password y role=ADMINISTRADOR. Usa contraseña individual de al menos 12 caracteres. No incluyas ese archivo en commits.")
code('docker compose exec -T api npm run user:create < .secrets/admin.json')
p("El comando lee el secreto por entrada estándar y solo devuelve identificador y correo. Desde el portal la administración crea estudiantes y matrículas. Para crear una cuenta docente usa PROFESOR_ASIGNATURA; para ESTUDIANTE agrega studentId del estudiante existente. El vínculo es único. Las asignaciones de docentes y la estructura escolar deben estar previamente configuradas en la BD; su gestor general corresponde a otra historia.")
p("<b>Opción B: pruebas sintéticas, solo BD local vacía.</b> No ejecutar después de la opción A. Genera cuentas y claves aleatorias nuevas; no existe una contraseña demo universal.")
code("docker compose exec -e ALLOW_SAMPLE_DATA=yes \\\n  -e CREDENTIALS_FILE=/tmp/sigaa-accounts.json api npm run seed:local\ndocker compose cp api:/tmp/sigaa-accounts.json .secrets/credentials.json")
small("Crea .secrets primero y limita el acceso a tu cuenta del sistema. Correos de prueba: admin@sigaa.local, docente@sigaa.local, estudiante@sigaa.local; sus contraseñas corresponden a admin, teacher y student en el archivo privado. El generador rechaza producción y bases con usuarios/estudiantes. En PowerShell utiliza Get-Content -Raw para pasar el JSON a user:create.")

page("Migración del servidor")
p("<b>No ejecutada en el Mac servidor.</b> Requiere revisión del responsable, respaldo recuperable, origen HTTPS y ventana de cambio. Este procedimiento no expone PostgreSQL ni concede SSH a compañeros.")
p("1. Confirma el esquema escolar instalado y aplica las migraciones pendientes 004-006 si corresponde. No vuelvas a ejecutar 003 ni elimines volúmenes para actualizar. Respalda la base antes de continuar.")
code("""docker compose --env-file .env.server -f compose.server.yaml \\
  exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \\
  > respaldo-sigaa-antes-sprint3.sql""")
p("2. Mantén .env.server y secretos fuera de Git. Define APP_ORIGIN=https://tu-dominio-exacto. La API de producción rechaza un origen sin HTTPS y no permite usar cookies inseguras.")
code("docker compose --env-file .env.server -f compose.server.yaml build api web\ndocker compose --env-file .env.server -f compose.server.yaml \\\n  run --rm --no-deps api npm run migrate\ndocker compose --env-file .env.server -f compose.server.yaml \\\n  up -d api web")
p("3. Crea o vincula cuentas personales con user:create; verifica login, cierre de sesión, acceso entre dos usuarios, alta y matrícula, y consulta tras reiniciar la API. Conserva el respaldo cifrado fuera de Git. No publiques 5432 ni entregues DATABASE_URL a compañeros.")
p("4. Si falla la verificación, no habilites usuarios reales. Conserva el respaldo y diagnostica. No vuelvas a publicar el login demo como solución. La migración es aditiva; una restauración debe hacerse en una base nueva y verificarse antes de sustituir la activa.")
p("<b>Límites de esta entrega:</b> HTTPS entre navegador y servicio depende del túnel configurado. La red interna de Docker aísla la BD, pero no equivale a TLS entre API y PostgreSQL. No se declara ese cifrado interno implementado. El motor Docker no estuvo disponible para confirmar arranque de esta versión en contenedores.")

page("Verificación y trazabilidad")
table([["Jira","Evidencia técnica"],["SCRUM-53 / 54 / 55","Hash con sal, error genérico, rotación, expiración, logout global y cambio de contraseña."],["SCRUM-56 / 57 / 58","Matriz anterior; roles del servidor; pruebas 200/401/403, otro profesor/estudiante, cabeceras falsas y CSRF."],["SCRUM-59 / 60 / 61","Lectura/escritura PostgreSQL, duplicidad y validaciones; reinicio real del proceso API y reconexión."],["SCRUM-62 / 63 / 64","Reglas transaccionales, formulario conectado, cupos, duplicidad concurrente, cierre e historial."]],[155,345])
code("cd SIGAA/apps/api\nnpm ci\nnpm test\nTEST_DATABASE_URL=postgresql://usuario@127.0.0.1:5432/postgres \\\n  npm run test:integration")
p("Usa un clúster de pruebas aislado: el ejecutor crea una base temporal única y la elimina al terminar. Nunca apuntes la prueba a la cuenta o instancia productiva. El usuario de prueba necesita CREATE DATABASE.")
code("cd SIGAA\ndocker compose -f compose.test.yaml up --build \\\n  --abort-on-container-exit --exit-code-from api-tests\ndocker compose -f compose.test.yaml down")
p("La alternativa Docker define un entorno efímero PostgreSQL 16 independiente y sin puertos publicados. Está preparada pero no ejecutada aquí. Para navegador, instala dependencias web y Chromium (npx playwright install chromium), y ejecuta scripts/verify-sprint3-browser.mjs con TEST_DATABASE_URL. CHROME_PATH permite elegir un Chrome instalado.")
p(f"<b>Cobertura observada:</b> formularios, errores, permisos, recarga, logout, vista 1440×1000 y móvil 390×844. {len(evidence['browser']['checks'])} recorridos de navegador y cero errores JavaScript. No se afirma compatibilidad con Safari/Firefox ni conformidad WCAG completa.")
p("<b>Recomendación QA:</b> requiere verificaciones antes de producción. El incremento local pasó su cobertura funcional; faltan validar contenedores PostgreSQL 16, respaldo/restauración y despliegue HTTPS del servidor. Listados limitados a 500 registros: añadir paginación antes de exceder ese volumen. No se efectuaron pruebas de carga ni un pentest integral.")

page("Evidencia visual")
p("Formulario de matrícula real: el cierre conserva el registro y su estado. Datos sintéticos de la ejecución automatizada.")
story.append(shot("02-matricula-historial.png",500));story.append(Spacer(1,14))
page("Vista móvil")
p("Vista de estudiante y navegación desplegable a 390 px. Identidad y alcance vienen de la sesión del servidor.")
story.append(Table([[shot("03-estudiante-movil.png",134),shot("04-menu-movil.png",134)]],colWidths=[250,250],style=[("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"TOP")]))
def footer(canvas,doc):
    canvas.setStrokeColor(colors.HexColor("#d3dcd1"));canvas.line(46,40,549,40)
    canvas.setFont("Helvetica",8);canvas.setFillColor(colors.HexColor("#56675b"))
    canvas.drawString(46,26,"SIGAA | Sprint 3 | Evidencia técnica, no acta de aceptación")
    canvas.drawRightString(549,26,str(doc.page))
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=47,leftMargin=47,topMargin=45,bottomMargin=55,title="SIGAA - Sprint 3: implementación real",author="Equipo SIGAA").build(story,onFirstPage=footer,onLaterPages=footer)
print(out)

"""PDF deployment record. Never reads or embeds passwords."""
from pathlib import Path
import json
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image
from reportlab.lib import colors
root=Path(__file__).resolve().parents[2]
evidence=root/'SIGAA/tmp/hosted-evidence'
results=json.loads((evidence/'results.json').read_text())
assert len(results['checks'])==4
out=root/'Gestión Scrum SIGAA/PDF/02 Sprints/Sprint 3/12 Despliegue HTTPS y cuentas de demostración.pdf'
styles=getSampleStyleSheet()
styles['Title'].textColor=colors.HexColor('#153e35')
styles['BodyText'].fontSize=10
styles['BodyText'].leading=14
story=[]
def para(title,body):
    story.extend([Paragraph(title,styles['Heading2']),Paragraph(body,styles['BodyText'])])
story.append(Paragraph('SIGAA | Despliegue HTTPS',styles['Title']))
story.append(Paragraph('15 de octubre de 2026 · Demo alojada en el Mac servidor',styles['BodyText']))
para('Acceso',results['origin']+'<br/>Cuenta docente: docente@sigaa.demo. Cuenta estudiante: estudiante@sigaa.demo. Las contraseñas aleatorias se entregan al propietario por separado y no están en este documento, Git ni Jira. Cambiarlas desde Seguridad al comenzar a usar las cuentas.')
para('Qué se desplegó','API Node.js en modo producción y web React compilada, sobre la versión funcional 62fbcba más configuración de alojamiento y alta de cuentas. Docker ejecuta sigaa-current-api-1, sigaa-current-web-1 y sigaa-current-tunnel-1. Se reutiliza sigaa-db-1 y su volumen existente. No se duplicó la base ni se reemplazó la instalación anterior.')
para('Datos y permisos','Dos usuarios de demostración, un establecimiento de demostración, un periodo escolar 2026, un curso 2° Medio A, una matrícula y una asignatura de Matemática vinculada al docente. El estudiante está vinculado a su ficha. No se cargaron notas ni asistencias ficticias. El alta es transaccional y se niega a repetir correos existentes: no cambia contraseñas ni crea duplicados al repetirse.')
para('Protecciones verificadas','HTTPS entre navegador y Cloudflare, túnel cifrado hasta el conector. API, web y PostgreSQL sin puertos publicados en el Mac. Solo la API comparte la red privada de la base; web y túnel no acceden a esa red. PostgreSQL interno no utiliza TLS. La API usa sigaa_runtime, sin superusuario, creación de bases ni creación de roles. Cookies Secure, HttpOnly y SameSite=Strict; protección CSRF; permisos resueltos desde PostgreSQL. El administrador del Mac conserva acceso: los contenedores no lo impiden.')
para('Ubicación y operación','Directorio del servidor: /srv/sigaa-current-20261015/SIGAA. Configuración: compose.hosted.yaml. Secretos: .secrets/hosted.env y .secrets/accounts.json, permisos 600. No imprimir docker compose config ni inspecciones completas del entorno al compartir evidencia. El Mac debe estar encendido, conectado y con Docker Desktop iniciado.')
para('Reinicio del acceso temporal','Desde el directorio del servidor, con docker en PATH:<br/><font face="Courier" size="8">docker start sigaa-db-1<br/>docker compose --env-file .secrets/hosted.env -f compose.hosted.yaml up -d tunnel<br/>python3 scripts/refresh-hosted-origin.py</font><br/>El script obtiene el enlace actual y sincroniza el origen HTTPS permitido por el login. No ejecutar prepare-hosted.py de nuevo: protege las credenciales existentes. No volver a levantar el Compose antiguo.')
para('Límites y pendientes','Cloudflare Quick Tunnel es temporal, sin garantía de disponibilidad y puede cambiar de URL al reiniciarse. No sustituye un dominio y túnel estable de producción. Fuente: developers.cloudflare.com/tunnel/get-started/quick-tunnels/. Falta rotar el secreto heredado del propietario de PostgreSQL, automatizar respaldos y validar restauración con las cuentas nuevas. Las pantallas avanzadas de asistencia, alertas y edición de notas del prototipo no están integradas todavía en este portal seguro. No se declara terminado ese trabajo ni aprobado el sprint por el Product Owner.')
story.append(PageBreak())
story.append(Paragraph('Validación del despliegue',styles['Title']))
para('Cobertura real','QA Sentinel aplicado al acceso y a permisos, no a una auditoría integral. Cuatro recorridos en Chrome: docente y estudiante a 1440 y 390 px. Se verificó login, rol, curso asignado, matrícula, recarga de sesión, cookie segura, rechazo sin sesión (401), rechazo CSRF (403), cierre de sesión y ausencia de desborde horizontal. El estudiante no puede abrir el espacio docente (403). Los tres contadores muestran 1 tras cargar PostgreSQL. No se certificó Safari, Firefox, WCAG ni carga concurrente.')
para('Conclusión','Acceso HTTPS y cuentas aptos para demostración con observaciones. Para producción escolar: requiere correcciones antes de producción por el acceso temporal y los pendientes operativos y funcionales indicados. No hay puntuación global ni se simularon ceremonias Scrum. Evidencia ejecutable: scripts/verify-hosted.mjs; resultados sin secretos en output/evidence/hosted-results.json.')
story.extend([Spacer(1,12),Image(str(evidence/'teacher-1440.png'),width=500,height=312.5),Spacer(1,8),Paragraph('Vista docente: datos persistentes del curso de demostración.',styles['BodyText'])])
SimpleDocTemplate(str(out),leftMargin=45,rightMargin=45,topMargin=35,bottomMargin=35).build(story)
print(out)

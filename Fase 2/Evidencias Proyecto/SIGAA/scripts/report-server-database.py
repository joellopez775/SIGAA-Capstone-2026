"""Generate the factual database deployment record; contains no credentials."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

root = Path(__file__).resolve().parents[2]
output = root / 'Gestión Scrum SIGAA/PDF/02 Sprints/Sprint 3/11 Base de datos en servidor.pdf'
output.parent.mkdir(parents=True, exist_ok=True)
styles = getSampleStyleSheet()
styles['Title'].textColor = colors.HexColor('#153E35')
styles['Title'].alignment = TA_LEFT
styles['BodyText'].fontSize = 10
styles['BodyText'].leading = 15
doc = SimpleDocTemplate(str(output), rightMargin=48, leftMargin=48, topMargin=42, bottomMargin=42)
story = [Paragraph('SIGAA | Base de datos en servidor', styles['Title']),
         Paragraph('Registro de ejecución - 15 de octubre de 2026', styles['BodyText']), Spacer(1, 15)]
sections = [
('Resultado confirmado', 'PostgreSQL 16.15 está funcionando en Docker en el Mac servidor-privado. Se reutilizó el contenedor sigaa-db-1 y el volumen persistente sigaa_postgres_data. No se creó una segunda base ni se reemplazó el volumen. La base existente se llama sigaa y utiliza el modelo escolar.'),
('Respaldo y migración', 'Se guardó un respaldo completo en formato pg_dump -Fc y se restauró sin errores en una base temporal independiente. Tras comprobar la restauración se eliminó únicamente esa base temporal; los respaldos se conservan. Se aplicaron las migraciones aditivas 006 y 007 del commit 62fbcba. No se ejecutó de nuevo la conversión 003. security_schema quedó en 1; schema_version conserva el marcador histórico 0.5.0.'),
('Comprobaciones realizadas', 'Contenedor saludable tras reiniciar; volumen conservado; tres reglas de alerta presentes; tablas de sesiones y límites de acceso disponibles. Se verificó una consulta SQL desde la API antigua antes de detenerla. Había cero usuarios, estudiantes y matrículas: no se crearon cuentas ni datos ficticios. La base de datos no equivale a una aplicación completa desplegada.'),
('Acceso y aislamiento', 'El puerto 5432 no tiene publicación en el Mac ni en Internet. El contenedor está conectado exclusivamente a sigaa_database_private, una red Docker interna. Solo los contenedores que el administrador conecte podrán utilizarla. SSH hacia el Mac cifra la administración. No se habilitó TLS en PostgreSQL: la conexión dentro de Docker no debe describirse como cifrada. No se distribuyeron credenciales al equipo ni se rotaron las existentes.'),
('Aplicación anterior detenida', 'Docker había arrancado automáticamente sigaa-api-1 y sigaa-web-1, una versión antigua con puertos 3000 y 8088 publicados en todas las interfaces. Se detuvieron y se desactivó su reinicio automático para no exponer esa demo. Sus contenedores e imágenes se conservaron. No se modificaron las bases ni aplicaciones ajenas a SIGAA.'),
('Operación y pendientes', 'Docker Desktop debe estar iniciado y el Mac debe permanecer encendido. La base tiene política unless-stopped; puede iniciarse con docker start sigaa-db-1. El aislamiento actual está aplicado al contenedor: no ejecutar el Compose antiguo porque podría recrear su red anterior. Falta desplegar la API y web actuales con una configuración reproducible, configurar HTTPS y cuentas reales, rotar las credenciales heredadas y definir respaldos periódicos. No se declara cerrado el Sprint 3 ni aprobada la revisión del Product Owner.'),
('Ubicación de los respaldos', '/srv/sigaa-deployment-20261015/<br/>pre-migration.dump y post-migration.dump. Directorio privado (700), archivos de respaldo con permisos 600. Los respaldos no se suben a Git ni a Jira. Las migraciones utilizadas también se conservan en ese directorio.'),
]
for title, body in sections:
    story.extend([Paragraph(title, styles['Heading2']), Paragraph(body, styles['BodyText'])])
doc.build(story)
print(output)

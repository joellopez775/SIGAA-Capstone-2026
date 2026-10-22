#!/usr/bin/env python3
"""Compare an exported Cloudflare zone with the captured original, then report."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shlex
import argparse
import subprocess
from concurrent.futures import ThreadPoolExecutor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'SIGAA/tmp/cloudflare-preparation'
original = json.loads((WORK/'hostmar-before.json').read_text())
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--export', type=Path, default=WORK/'cloudflare-after-route.bind')
args = parser.parse_args()
export = args.export.read_text()
sigaa = 'sigaa.ignisert.com'
tunnel_target = '7ac8287b-036d-4f67-8968-02f2ab0682b6.cfargotunnel.com'

def key(row):
    name, ttl, cls, kind, data = row
    if kind == 'TXT':
        data = ''.join(shlex.split(data))
    else:
        data = ' '.join(data.split()).rstrip('.')
    return name.rstrip('.'), kind, data

source = {key(r) for r in original['records'] if r[3] not in ('NS','SOA')}
actual_rows = []
for line in export.splitlines():
    if not line.strip() or line.startswith(';'):
        continue
    clean = line.split(' ; cf_tags=')[0]
    row = clean.split(None,4)
    if len(row) != 5 or row[3] in ('NS','SOA'):
        continue
    if row[0].rstrip('.') == sigaa:
        assert row[3] == 'CNAME' and row[4].rstrip('.') == tunnel_target
        assert 'cf-proxied:true' in line and row[1] == '1'
    elif row[3] in ('A','AAAA','CNAME'):
        assert 'cf-proxied:false' in line, line
    if row[0].rstrip('.') != sigaa:
        assert row[1] == '14400', row
    actual_rows.append(row)
actual = {key(r) for r in actual_rows}
assert len(actual_rows) == len(actual) == len(source) == 24
expected = {r for r in source if r[0] != sigaa} | {(sigaa, 'CNAME', tunnel_target)}
assert actual == expected, {'missing':list(expected-actual),'extra':list(actual-expected)}
# Read the currently delegated provider, without altering any DNS data.
def public_records(query):
    name, kind = query
    raw = subprocess.check_output(['dig','@ns1.donweb.com','+time=5','+tries=2','+noall','+answer',name,kind], text=True)
    rows = [line.split(None,4) for line in raw.splitlines() if line and not line.startswith(';')]
    return {key(r) for r in rows if len(r)==5 and r[0].rstrip('.')==name and r[3]==kind}
with ThreadPoolExecutor(max_workers=3) as executor:
    live = set().union(*executor.map(public_records, sorted({(r[0],r[1]) for r in source})))
assert live == source, 'Public service records differ from the original snapshot'
delegation = subprocess.check_output(['dig','@a.gtld-servers.net','ignisert.com','NS','+norecurse','+noall','+authority'], text=True)
ns = {line.split()[4].rstrip('.') for line in delegation.splitlines() if line and not line.startswith(';') and len(line.split())==5 and line.split()[3]=='NS'}
assert ns == {'ns1.donweb.com','ns2.donweb.com'}, ns
dkim = next(k[2] for k in source if k[0]=='mail._domainkey.ignisert.com')
verification = {
    'source_time':original['captured_at'], 'compared_records':24,
    'unrelated_records_preserved':23, 'expected_sigaa_change_only':True,
    'public_service_records_unchanged':24, 'duplicates':0, 'proxy_enabled_records':1,
    'unrelated_ttl_seconds':14400, 'sigaa_ttl':'auto', 'delegation_changed':False,
    'parent_nameservers':['ns1.donweb.com','ns2.donweb.com'],
    'prepared_nameservers':['jade.ns.cloudflare.com','jay.ns.cloudflare.com'],
    'sigaa_tunnel_created':True,
    'tunnel_name':'sigaa-mac-servidor',
    'tunnel_id':'7ac8287b-036d-4f67-8968-02f2ab0682b6',
    'route_configured':True, 'route_service':'http://web:8080',
    'public_hostname_activated':False,
    'dkim_sha256':hashlib.sha256(dkim.encode()).hexdigest(),
}
(WORK/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
(WORK/'cloudflare-after-route.bind').write_text(export)
(ROOT/'SIGAA/output/evidence/domain-dns-verification.json').write_text(json.dumps(verification,indent=2)+'\n')

spec = importlib.util.spec_from_file_location('scrum_pdf', ROOT/'scripts/generate-scrum-pdfs.py')
pdf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdf)
CONTENT = '''# Preparación DNS de SIGAA

**Dominio:** ignisert.com. **Aplicación prevista:** sigaa.ignisert.com. **Corte:** 15 de octubre de 2026. Preparación sin activar el dominio ni cambiar los servidores DNS del registro.

## 1. Qué quedó guardado en Cloudflare

Zona en plan gratuito y estado pendiente. Hay 24 registros de servicios, sin duplicados. Tras configurar SIGAA, 23 registros conservan exactamente sus contenidos originales y TTL de 14.400 segundos. Solo sigaa cambia al túnel permanente, con proxy y TTL automático. Una consulta nueva a DonWeb confirma que los 24 registros públicos siguen como antes.

El proxy permanece desactivado para la web, correo, FTP y panel de Ignisert. No se habilitó enrutamiento de correo de Cloudflare ni modificación de robots.txt. No se modificaron Ferozo, la delegación del registrador, firewall, SSH ni PostgreSQL. La API de SIGAA se actualizó manteniendo el enlace temporal.

## 2. Registros de Ignisert preservados

Los nombres cortos pertenecen a ignisert.com. @ significa el dominio principal. Los 23 registros de esta tabla están en modo DNS only. Las filas agrupadas representan varios registros individuales.

| Nombre | Tipo | Destino / contenido | Cantidad |
|---|---|---|---|
| @, ftp, autoconfig, autodiscover, mail | A | 200.58.111.124 | 5 |
| mx1 | A | 200.58.122.206 | 1 |
| mipanel | A | 200.58.109.42 | 1 |
| @, ftp, autoconfig, autodiscover, mail | AAAA | 2800:6c0:2::c:288 | 5 |
| www, www.sigaa | CNAME | ignisert.com | 2 |
| @ | MX | Prioridad 0: mail.ignisert.com | 1 |
| @ | MX | Prioridad 20: mx1.ignisert.com | 1 |
| _imaps._tcp | SRV | 0 5 993 c2881640.ferozo.com | 1 |
| _pop3s._tcp | SRV | 0 5 995 c2881640.ferozo.com | 1 |
| _smtps._tcp | SRV | 0 5 465 c2881640.ferozo.com | 1 |
| _submission._tcp | SRV | 0 5 587 c2881640.ferozo.com | 1 |
| @ | TXT | v=spf1 include:comp.hostmar.com -all | 1 |
| _dmarc | TXT | v=DMARC1; p=none | 1 |
| mail._domainkey | TXT | Clave DKIM pública completa, preservada y comparada | 1 |

En SRV, los números son prioridad, peso y puerto, respectivamente. La clave DKIM no se abrevia en el archivo importado ni en la comparación; solo se resume en esta tabla por legibilidad. No es una contraseña ni una clave privada.

**Registro 24, solo en Cloudflare:** sigaa es un CNAME con proxy hacia 7ac8287b-036d-4f67-8968-02f2ab0682b6.cfargotunnel.com. El DNS público de DonWeb todavía conserva sigaa hacia ignisert.com. www.sigaa no forma parte de la publicación solicitada.

:::pagebreak

## 3. Servidores DNS: actual frente a preparado

| Nivel / estado | Servidores | Observación |
|---|---|---|
| Delegación vigente en .com | ns1.donweb.com / ns2.donweb.com | Es la delegación del registro que habría que cambiar tras la autorización. |
| NS publicados dentro de la zona de Ferozo | ns3.hostmar.com / ns4.hostmar.com | No confundir estos registros internos con la delegación del registrador. |
| Asignados por Cloudflare | jade.ns.cloudflare.com / jay.ns.cloudflare.com | Preparados, pero no configurados como delegación pública. |

Se conservan 23 registros y se modifica únicamente sigaa en la zona pendiente. SOA y NS son registros de autoridad: Cloudflare genera los suyos. La consulta inicial a .com no devolvió un DS de DNSSEC; debe comprobarse nuevamente justo antes de activar, sin desactivar ninguna opción a ciegas.

## 4. Ruta configurada y aplicación preparada

Se guardó una única ruta en el túnel existente: sigaa.ignisert.com hacia http://web:8080. Cloudflare no pudo crear automáticamente el CNAME porque ya existía; se editó ese registro, sin borrarlo ni duplicarlo. El destino es el identificador del túnel, no el enlace temporal. La zona sigue pendiente de activación.

La ruta abarca solo el tráfico web de SIGAA. No publica SSH, PostgreSQL ni una ruta general a la red privada. El Mac debe estar encendido, con Docker activo y conexión a Internet.

**Realizado con autorización:** túnel sigaa-mac-servidor creado y conectado al Mac. Cloudflare indica Healthy; la comprobación interna devuelve HTTP 200 y cuatro conexiones. El conector Docker independiente usa compose.tunnel.yaml, sin puertos publicados, con sistema de archivos de solo lectura y únicamente la red frontend. No pertenece a la red privada de PostgreSQL.

La credencial está en .secrets/cloudflare-sigaa-tunnel.token, con permisos 0600, fuera de Git y montada en modo lectura. La API conserva APP_ORIGIN con la demo y añade APP_ADDITIONAL_ORIGINS=https://sigaa.ignisert.com. Solo acepta orígenes exactos HTTPS en producción; rechaza comodines y configuraciones inválidas. Cookies host-only, Secure, HttpOnly, SameSite=Strict y controles CSRF permanecen activos.

La API fue reconstruida y quedó saludable; Nginx recibió una recarga de configuración. No se reiniciaron los túneles ni la base de datos. /api/health responde versión 0.8.0. No se alteraron los datos académicos.

:::pagebreak

## 5. Condiciones antes de activar

1. Confirmar la comparación de registros y obtener autorización específica para el cambio de delegación. Este informe no sustituye esa autorización.
2. La ruta, el CNAME y los dos orígenes ya están preparados. No retirar la demo hasta validar el nuevo hostname; la salud del conector no certifica el acceso público.
3. Volver a comparar los registros de origen por si fueron editados desde este corte. Verificar DNSSEC en el registrador y asegurar acceso para revertir la delegación si fuera necesario.
4. Solo entonces cambiar los servidores DNS en el registrador. No basta con editar los registros NS dentro de Ferozo.
5. Comprobar la propagación, emisión del certificado, login y navegación por rol; verificar los destinos web y de correo de Ignisert. Una prueba de envío/recepción de correo requiere coordinación y autorización, y no se ha realizado aquí.

La copia y verificación reducen el riesgo de interrupción, pero no garantizan una migración sin incidencias. La propagación DNS no es instantánea. El respaldo conserva los destinos anteriores; cualquier reversión debe contemplar las cachés y los cambios realizados después de esta preparación.

## 6. Evidencias y alcance de la revisión

Pruebas: 6 unitarias y 44 de integración aprobadas en Docker con PostgreSQL desechable y red aislada. En la API desplegada se verificaron 8 combinaciones: cuatro roles por dos cabeceras Origin, con login, consulta de sesión, cookies seguras, rechazo sin CSRF y cierre de sesión. Se rechazaron cuatro orígenes no permitidos, incluido el ausente.

Límite de la prueba: estas solicitudes HTTP viajaron por la demo vigente. No prueban aún la resolución DNS ni el certificado TLS de sigaa.ignisert.com. Las cookies no se comparten entre dominios: al cambiar de enlace cada usuario debe iniciar sesión nuevamente.

La exportación BIND posterior comprueba 23 registros intactos, un único cambio autorizado para sigaa y ningún duplicado. SPF, DMARC y DKIM permanecen íntegros. Una consulta nueva a DonWeb confirma los 24 registros públicos originales y la delegación .com sigue en ns1/ns2.donweb.com.

Evidencias en Git: output/evidence/domain-dns-verification.json y domain-origins-tests.json. Respaldo local: tmp/cloudflare-preparation/hostmar-before.bind. Exportación posterior: cloudflare-after-route.bind. La captura de la ruta queda en esa carpeta temporal. No se incluyen contraseñas, sesiones ni tokens en las evidencias.

Reversión de la API: respaldo privado del servidor en /srv/sigaa-before-domain.DKiuVB y etiqueta de imagen sigaa-current-api:before-domain-20261015. Para revertir se recuperan código, compose y entorno anteriores, se recrea solo la API y se recarga Nginx. No revertir DNS ni restaurar la base de datos para deshacer este cambio de aplicación.

**Resultado:** pasos 1 y 2 completos: aplicación preparada, ruta y CNAME guardados en la zona pendiente. DNS públicos sin cambios. La activación y validación HTTPS del nuevo dominio quedan pendientes de autorización y propagación.
'''
pdf.register_fonts()
styles = pdf.make_styles()
styles['Bodyx'].spaceAfter = 2*mm
title, story = pdf.parse_markdown(CONTENT,styles,A4[0]-36*mm)
target = ROOT/'SIGAA/output/pdf/Preparación DNS de SIGAA - Revisión antes de activar.pdf'
pdf.SigaaDocTemplate(str(target),title,A4).build(story)
print(json.dumps(verification,ensure_ascii=False,indent=2))
print(target)

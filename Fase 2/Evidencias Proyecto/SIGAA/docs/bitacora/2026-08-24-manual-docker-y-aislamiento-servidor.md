# Bitácora — Manual Docker y aislamiento del servidor

Fecha: 24 de agosto de 2026. Historia: PB-040.

## Solicitud del Product Owner

Crear un manual para ejecutar SIGAA en cualquier PC con Docker y definir una
conexión cifrada que permita usar el sistema sin entregar acceso al Mac servidor
ni a PostgreSQL.

## Incremento realizado

- Manual multiplataforma para clonar, iniciar, actualizar y diagnosticar SIGAA.
- Puertos del entorno local limitados a `127.0.0.1`.
- Compose de servidor sin puertos publicados para web, API ni PostgreSQL.
- Redes separadas `frontend` y `backend`; esta última marcada `internal`.
- Cloudflare Tunnel en contenedor con token montado como secreto local.
- Cloudflare Access definido como barrera obligatoria durante la etapa demo.
- Encabezados HTTP defensivos incorporados en Nginx.
- Script que falla si el servidor publica algún puerto accidentalmente.

## Verificación

- Ambos archivos Compose validados.
- Configuración efectiva del servidor inspeccionada: cero puertos publicados.
- Sintaxis del script de verificación aprobada.

## Decisión pendiente del propietario

Para activar el despliegue endurecido se requiere un dominio administrado en
Cloudflare, un túnel permanente y la lista exacta de correos autorizados. El
token y las credenciales reales no se almacenan en Git.

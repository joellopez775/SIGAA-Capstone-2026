# Bitácora técnica — entorno Docker

Fecha: 21 de agosto de 2026.

## Objetivo

Crear una línea base ejecutable que reduzca diferencias entre los equipos del grupo y permita verificar web, API y PostgreSQL con comandos repetibles.

## Implementación

- Docker Compose con servicios `web`, `api` y `db`.
- React compilado con Vite y servido por Nginx.
- API Node.js con rutas `/health` y `/db-health`.
- PostgreSQL 16 con volumen persistente e inicialización versionada.
- Healthchecks y orden de arranque condicionado por salud.
- Proxy `/api` desde Nginx hacia la API interna.
- Dependencias fijadas mediante `package-lock.json`.
- Scripts de verificación para shell y PowerShell.
- Plantilla de GitHub Actions para pruebas, build y validación Docker. Su activación requiere publicar el archivo con una credencial que tenga permiso `workflow`.

## Resultado de pruebas locales

| Verificación | Resultado |
|---|---|
| `docker compose config --quiet` | Aprobado |
| Pruebas API | 3 aprobadas, 0 fallidas |
| Auditoría npm API | 0 vulnerabilidades reportadas |
| Build web Vite | Aprobado |
| Auditoría npm web | 0 vulnerabilidades reportadas |
| Contenedor PostgreSQL | Healthy |
| Contenedor API | Healthy |
| Contenedor web | Healthy |
| API directa `/health` | `status: ok` |
| Consulta `/db-health` | Base `sigaa`, `status: ok` |
| Proxy web `/api/health` | `status: ok` |
| Revisión visual | Interfaz cargada y conexión confirmada |

## Hallazgo y corrección

El puerto web inicial `8080` estaba ocupado en el equipo de validación. Se cambió el valor predeterminado a `8088` y se mantuvo configurable mediante `WEB_PORT` en `.env`.

## Evidencia

- `compose.yaml`
- `apps/api/`
- `apps/web/`
- `infra/postgres/init/001_schema.sql`
- `scripts/verify-docker.sh`
- `scripts/verify-docker.ps1`
- `ci/sigaa-ci.yml.example`

## Estado

Línea base Docker verificada localmente. La plantilla CI queda versionada, pendiente de activación por permisos del token de GitHub. La implementación de módulos funcionales continúa en los siguientes sprints.

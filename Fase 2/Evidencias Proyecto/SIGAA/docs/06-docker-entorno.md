# Entorno de desarrollo con Docker

## Requisito

- Docker Desktop en Windows/macOS, o Docker Engine con el complemento Compose en Linux.

No es necesario instalar Node.js ni PostgreSQL en el equipo anfitrión.

## Inicio rápido

Desde la carpeta `SIGAA`:

```bash
docker compose up --build
```

Cuando los servicios estén saludables:

- Aplicación: <http://localhost:8088>
- API: <http://localhost:3000/health>
- Base de datos mediante API: <http://localhost:3000/db-health>

Para trabajar en segundo plano:

```bash
docker compose up --build --detach
docker compose ps
```

## Detener

```bash
docker compose down
```

Este comando conserva la base de datos. Para reiniciar completamente los datos:

```bash
docker compose down --volumes
```

## Personalizar puertos o credenciales

```bash
cp .env.example .env
```

Editar `.env` y volver a ejecutar Compose. El archivo `.env` no debe subirse a Git.

## Verificación esperada

```bash
docker compose ps
```

Los servicios `db`, `api` y `web` deben indicar `healthy`.

Verificación automatizada en macOS/Linux:

```bash
sh scripts/verify-docker.sh
```

En Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verify-docker.ps1
```

Pruebas adicionales:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/db-health
curl http://localhost:8088/api/health
```

## Diagnóstico

```bash
docker compose logs --tail=100 db
docker compose logs --tail=100 api
docker compose logs --tail=100 web
```

Problemas frecuentes:

- Puerto ocupado: cambiar `WEB_PORT` o `API_PORT` en `.env`.
- Docker detenido: iniciar Docker Desktop y repetir el comando.
- Volumen antiguo incompatible: respaldar lo necesario y ejecutar `docker compose down --volumes`.
- Cambios que no aparecen: ejecutar `docker compose up --build` para reconstruir imágenes.

## Flujo de actualización para el equipo

```bash
git pull
docker compose up --build --detach
docker compose ps
```

No usar `npm install` en el equipo anfitrión para ejecutar la línea base. Los Dockerfiles y lockfiles son la fuente reproducible.

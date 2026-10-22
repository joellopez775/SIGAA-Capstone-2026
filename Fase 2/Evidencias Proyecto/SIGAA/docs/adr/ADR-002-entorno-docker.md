# ADR-002 — Entorno reproducible con Docker

- Estado: aceptado para el desarrollo del MVP.
- Fecha: 2026-08-21.
- Historias relacionadas: PB-005, PB-006 y PB-014.

## Contexto

El proyecto será ejecutado por integrantes con equipos y configuraciones diferentes. Instalar manualmente Node.js, PostgreSQL, dependencias y herramientas aumenta el riesgo de errores, versiones incompatibles y pérdida de tiempo durante las demostraciones.

## Decisión

La línea base de SIGAA se ejecutará mediante Docker Compose con tres servicios:

- `web`: aplicación React compilada y servida por Nginx.
- `api`: API Node.js.
- `db`: PostgreSQL con volumen persistente y script de inicialización.

Los tres servicios tendrán healthchecks. La aplicación web accederá a la API mediante el proxy interno de Nginx y la API accederá a PostgreSQL por la red privada de Compose.

## Comando canónico

```bash
docker compose up --build
```

## Consecuencias

- Docker Desktop o Docker Engine con Compose es el único requisito obligatorio.
- Las versiones de dependencias Node quedan fijadas en `package-lock.json`.
- La base de datos persiste en un volumen y no depende de una instalación local.
- Las credenciales incluidas son exclusivamente para desarrollo local.
- El equipo debe verificar `docker compose ps` antes de declarar el entorno operativo.

## Recuperación

```bash
docker compose down
docker compose up --build
```

Para eliminar también los datos locales y reinicializar PostgreSQL:

```bash
docker compose down --volumes
docker compose up --build
```

La eliminación del volumen destruye los datos locales y debe usarse deliberadamente.

# Exposición temporal mediante Cloudflare Tunnel

Fecha: 21 de agosto de 2026  
Sprint: 1

## Objetivo

Permitir que el equipo revise remotamente la aplicación SIGAA ejecutada en el
entorno Docker local del Product Owner.

## Implementación

Se levantó un Cloudflare Quick Tunnel apuntando al frontend publicado por Docker
en `http://localhost:8088`. El proxy web conserva el acceso relativo a la API,
por lo que la demostración incluye frontend, API y PostgreSQL.

Comando utilizado:

```bash
cloudflared tunnel --url http://localhost:8088 --no-autoupdate
```

URL asignada durante esta sesión:

`https://owners-contract-eugene-taxi.trycloudflare.com`

## Verificación

- Página pública: respuesta HTTP 200.
- Endpoint público `/api/health`: respuesta HTTP 200 con estado `ok`.
- Contenedores `web`, `api` y `db`: saludables.

## Consideraciones

El Quick Tunnel no ofrece garantía de disponibilidad ni una URL permanente.
Depende de que el equipo local, Docker y `cloudflared` permanezcan en ejecución.
Para una publicación estable se deberá configurar un túnel nombrado o un entorno
de despliegue persistente asociado a una cuenta y dominio de Cloudflare.

# Despliegue de SIGAA en Mac servidor

Fecha: 21 de agosto de 2026  
Sprint: 1  
Servidor: `servidor-privado.local` (`servidor-privado`)

## Objetivo

Trasladar la demostración desde el equipo de desarrollo a un Mac dedicado y
ejecutarla mediante Docker Compose.

## Configuración

- Usuario remoto: `joellopez` mediante clave SSH Ed25519.
- Arquitectura: Intel `x86_64`.
- Código: `~/Services/sigaa`, rama `fase-1-evidencias`.
- Aplicación: `~/Services/sigaa/SIGAA`.
- Docker Desktop: instalación de usuario en `~/Applications/Docker.app`.
- Motor Docker: `29.7.2`.
- Docker Compose: `v5.4.0`.
- Persistencia: volumen Docker `sigaa_postgres_data`.
- Reinicio de servicios: política `unless-stopped`.
- Inicio de Docker: LaunchAgent `com.sigaa.docker-server`.

## Servicios

| Servicio | Puerto | Estado verificado |
|---|---:|---|
| Web | 8088 | Healthy, HTTP 200 |
| API | 3000 | Healthy |
| PostgreSQL | interno | Healthy |

Acceso mediante la red privada:

`http://servidor-privado:8088`

## Verificación

- Repositorio remoto en el commit `601bcf3`.
- Compilación web y API completada en el servidor.
- `docker compose ps`: tres servicios saludables.
- `/api/health`: HTTP 200 con estado `ok`.
- Acceso desde otro equipo a la IP del servidor: HTTP 200.

## Operación

Los contenedores vuelven a levantarse cuando inicia el motor Docker. El
LaunchAgent abre Docker Desktop al iniciar la sesión gráfica del usuario. La
disponibilidad depende de que el Mac permanezca encendido y conectado a la red
privada.

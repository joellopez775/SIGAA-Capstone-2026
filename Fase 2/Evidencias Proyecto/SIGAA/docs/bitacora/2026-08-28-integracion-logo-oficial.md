# Integración del logo oficial SIGAA

Fecha: 28 de agosto de 2026  
Sprint: 1  
Responsable de aprobación: Product Owner

## Objetivo

Incorporar a la interfaz la identidad visual oficial proporcionada para SIGAA,
manteniendo su legibilidad en la portada y en espacios reducidos.

## Trabajo realizado

- Se agregó el archivo fuente a `apps/web/src/assets/sigaa-logo.png`.
- Se reemplazó el sello provisional de la pantalla de acceso por el logo completo.
- Se incorporó la marca al encabezado del formulario para conservar su presencia
  en resoluciones donde la portada se presenta en una sola columna.
- Se creó una presentación compacta del símbolo para las barras laterales.
- Se aplicó la misma identidad en los portales docente y estudiante.
- El recorte compacto se realiza con CSS y no altera el archivo original.

## Criterios de verificación

- Compilación web de producción sin errores.
- Reconstrucción del contenedor web.
- Revisión visual del acceso en el navegador local.
- Consola del navegador sin errores relacionados con el activo.

## Resultado

La aplicación deja de utilizar la letra provisional «S» como marca y adopta el
logo oficial suministrado por el Product Owner.

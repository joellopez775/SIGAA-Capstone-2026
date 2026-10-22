# Rediseño de navegación móvil

Fecha: 28 de agosto de 2026  
Sprint: 1

## Motivo

El Product Owner aprobó la versión web, pero rechazó la barra superior móvil por
su peso visual. Solicitó una experiencia más próxima a la claridad y sobriedad
de Apple en teléfonos.

## Decisiones

- Reducir el encabezado a marca, nombre y avatar.
- Separar navegación y encabezado para evitar una barra superior de dos pisos.
- Ubicar las tres acciones principales en un dock inferior accesible al pulgar.
- Utilizar translucidez, desenfoque y sombras suaves.
- Mantener la paleta institucional de SIGAA.
- Reservar espacio para el área segura inferior de iOS.

## Iteración posterior

El dock inferior fue reemplazado posteriormente por un menú hamburger circular
y un panel de pantalla completa, después de una nueva revisión del Product
Owner. La decisión vigente se documenta en
`2026-08-28-menu-movil-desplegable.md`.

## Alcance

El cambio afecta únicamente resoluciones de hasta 760 px y se aplica a las
experiencias docente y estudiante. La navegación de escritorio no cambia.

## Verificación prevista

- Compilación web de producción.
- Reconstrucción del contenedor Docker.
- Revisión de reglas responsive y ausencia de desbordes.
- Confirmación de servicios web, API y base de datos.

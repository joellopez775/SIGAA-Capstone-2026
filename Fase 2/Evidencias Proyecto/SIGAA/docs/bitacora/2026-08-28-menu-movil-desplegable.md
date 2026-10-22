# Menú móvil desplegable

Fecha: 28 de agosto de 2026  
Sprint: 1

## Motivo

El Product Owner observó que la navegación móvil superior se percibía cortada y
propuso reemplazarla por un botón hamburger circular en la esquina superior
derecha.

## Implementación

- Encabezado compacto compatible con el área segura superior de iPhone.
- Botón circular con transición entre hamburger y cierre.
- Menú de pantalla completa con vidrio translúcido y desenfoque.
- Entrada escalonada de las opciones de navegación.
- Perfil y cierre de sesión dentro del panel.
- Bloqueo del desplazamiento del contenido mientras el menú está abierto.
- Comportamiento equivalente para docentes y estudiantes.

## Alcance

El cambio se activa hasta 760 px de ancho. La navegación lateral de escritorio
no fue modificada.

## Verificación

- Compilación de producción aprobada.
- Contenedores web, API y base de datos saludables.
- Acceso local sin desbordamiento horizontal.
- Página y healthcheck disponibles mediante el túnel público de Cloudflare.

## Corrección posterior

Durante la validación del Product Owner se detectó que el botón cambiaba de
estado, pero el panel quedaba recortado por la altura y el desbordamiento del
encabezado. Se corrigió haciendo que el encabezado abierto ocupe `100dvh` y
posicionando el panel dentro de esa capa de pantalla completa.

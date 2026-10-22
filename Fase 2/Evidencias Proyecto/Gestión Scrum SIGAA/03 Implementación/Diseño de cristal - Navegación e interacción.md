# Diseño de cristal - Navegación e interacción

SIGAA. Cambio visual solicitado por el Product Owner, 15 de octubre de 2026. Conserva la paleta verde y dorada. No modifica permisos, API ni esquema de datos. Pendiente de aprobación visual de Joel.

## Experiencia implementada

- Menú flotante de cristal verde, bordes luminosos, desenfoque de fondo e iconos vectoriales consistentes.
- Magnificación por proximidad del cursor: el icono bajo el puntero y sus vecinos crecen gradualmente, sin cambiar el espacio reservado a cada opción. El foco de teclado también destaca el destino.
- Indicador compartido: una sola superficie de selección se desplaza entre secciones; no se reconstruye una selección independiente por botón.
- Tarjetas translúcidas, campos legibles y elevación suave de métricas al pasar el cursor. Formularios y registros mantienen su comportamiento.
- En teléfono, botón circular fijo con zona segura superior; transición de dos líneas a cierre y apertura del panel desde la esquina. No empuja el contenido de la página.
- Al abrir el menú móvil, el fondo deja de ser interactivo. Escape cierra y devuelve el foco al botón; Tab permanece entre menú y cierre. El panel permite desplazamiento en pantallas bajas.
- La preferencia de movimiento reducido desactiva ampliaciones y animaciones. Si el navegador no admite desenfoque, se usan superficies opacas.

## Alcance y componentes

GlassNavigation.jsx contiene navegación, iconos, ampliación, control de foco y cierre. glass.css define las superficies, transiciones y adaptación responsive. SecureApp.jsx integra el componente compartido para los cuatro roles de demostración y suaviza el cambio de contenido.

La pantalla de login no fue rediseñada en esta iteración. Los efectos no cambian qué acciones permite cada rol. El texto del inicio se orienta a la comunidad escolar, conservando los datos persistentes existentes.

## Verificación y límites

Compilación local y Docker correctas. Pasaron 25 recorridos funcionales en bases aisladas y 16 combinaciones de rol/tamaño por HTTPS: 768x1024, 390x844, 320x740 y 844x390. Los cuatro roles pasaron magnificación e indicador a 1440x1000, teclado y movimiento reducido. Evidencia: SIGAA/output/evidence/glass-*.json; sin escrituras académicas en la demo.

Durante la prueba se detectó una ventana inicial en la que el formulario de estructura podía recibir entrada antes de terminar de cargar los catálogos. Se bloquea hasta disponer de estos datos y se actualizan los campos con el estado más reciente. No se resuelve ocultando el error ni omitiendo el recorrido.

Cobertura de QA: navegación por rol, menú móvil, estados de selección, ampliación por puntero, teclado, movimiento reducido, desbordamiento y regresión de formularios. No se afirma compatibilidad probada en Safari/Firefox ni conformidad WCAG integral. Los efectos de cristal requieren revisión en teléfonos físicos de menor potencia.

Recomendación limitada al cambio visual: apto con observaciones para la demo; pruebas aprobadas y aprobación visual del PO pendiente. Esto no certifica el sistema completo para producción escolar. No se registran ceremonias ni aceptaciones no realizadas.

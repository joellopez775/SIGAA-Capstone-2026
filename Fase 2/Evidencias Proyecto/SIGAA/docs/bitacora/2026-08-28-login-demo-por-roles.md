# Bitácora - login demo por roles

Fecha simulada: 28 de agosto de 2026.

## Cambio solicitado

Unificar el acceso para docentes y estudiantes. El usuario no debe escoger el
rol antes de iniciar sesión: la cuenta autenticada determina la experiencia y
los permisos visibles.

## Implementación

- Formulario único con correo institucional y contraseña.
- Endpoint `POST /auth/demo-login` para las cuentas sintéticas.
- Enrutamiento automático al portal docente o al portal del estudiante.
- Eliminación del cambio directo de rol desde las barras de navegación.
- Mensaje controlado ante credenciales incorrectas.
- Botones de autocompletado exclusivos del entorno de demostración.

## Cuentas sintéticas

| Rol | Usuario | Contraseña |
|---|---|---|
| Docente | `docente@sigaa.demo` | `Docente2026!` |
| Estudiante | `estudiante@sigaa.demo` | `Estudiante2026!` |

## Verificación

- Login docente: respuesta `200`, rol `teacher`.
- Login estudiante: respuesta `200`, rol `student` y estudiante `est-001`.
- Contraseña incorrecta: respuesta `401` y error estable.
- Suite API: 9/9 pruebas aprobadas.
- Build web: correcto.
- Docker Compose: servicios operativos.
- Formulario renderizado sin errores de consola.

## Restricción

Las contraseñas están versionadas porque pertenecen exclusivamente al prototipo
local. La autenticación real con hash, sesión, recuperación y RBAC corresponde
a Sprint 2 y deberá usar secretos fuera del repositorio.

# Flujo Git y estándar de evidencias

## Objetivo

Mantener una historia verificable de decisiones, documentos, código, pruebas y entregas durante las 18 semanas.

## Ramas

- `main`: línea estable y entregas aceptadas.
- `fase-1-evidencias`: avance documental actual.
- Ramas de trabajo futuras: `feature/PB-XXX-descripcion`, `docs/PB-XXX-descripcion` o `fix/PB-XXX-descripcion`.

## Commits

Formato recomendado:

```text
tipo(SIGAA): descripción breve [PB-XXX]
```

Tipos: `docs`, `feat`, `fix`, `test`, `chore` y `refactor`.

Ejemplos:

```text
docs(SIGAA): registrar Product Vision y Sprint 0 [PB-002]
test(SIGAA): agregar evidencia de reglas de alerta [PB-020]
```

## Evidencia mínima por historia

- Identificador de historia.
- Responsable y participantes.
- Fecha.
- Criterios de aceptación evaluados.
- Resultado de prueba o validación.
- Vínculo al commit, archivo, captura, acta o versión.
- Defectos o decisiones pendientes.

## Ubicación

```text
SIGAA/
├── docs/
│   ├── bitacora/
│   ├── fase-1/
│   └── scrum/sprint-N/
└── entregables/
    ├── fase-1/
    └── gestion/
```

## Reglas de protección

- No subir contraseñas, tokens, archivos `.env` ni datos personales reales.
- Usar `.env.example` cuando comience la implementación.
- Mantener evidencia técnica legible sin depender únicamente de una herramienta externa.
- No modificar retrospectivamente un acta cerrada; registrar una adenda.
- Revisar el diff antes de cada commit y agregar solo archivos del alcance correspondiente.

## Cierre diario

Al finalizar una sesión de trabajo:

1. Actualizar Scrumboard.
2. Registrar avance, decisión o impedimento en la bitácora.
3. Enlazar evidencia con historias `PB-XXX`.
4. Revisar que no existan secretos ni datos personales.
5. Crear commit descriptivo y subir la rama.

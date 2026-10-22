# Arquitectura preliminar — SIGAA

Estado: borrador de Sprint 1. Debe validarse mediante una prueba técnica y ADR-001.

## Objetivos arquitectónicos

- Separar reglas escolares de la interfaz y persistencia.
- Proteger datos mediante autenticación, autorización y auditoría.
- Mantener alertas explicables y verificables.
- Facilitar pruebas unitarias e integración.
- Permitir despliegue reproducible con Docker.

## Vista de contenedores

```mermaid
flowchart LR
    U["Usuario autorizado"] --> W["Aplicación web"]
    W -->|"HTTPS / JSON"| A["API SIGAA"]
    A --> D["PostgreSQL"]
    A --> J["Motor de alertas"]
    J --> D
    A --> N["Adaptador de notificaciones"]
    A --> L["Auditoría y logs"]
    L --> D
```

## Módulos propuestos

| Módulo | Responsabilidad |
|---|---|
| Identidad y acceso | Usuarios, autenticación, roles y permisos |
| Estructura escolar | Establecimiento, años escolares, niveles, cursos y asignaturas |
| Comunidad educativa | Estudiantes, apoderados y matrículas anuales por curso |
| Evaluación y asistencia | Evaluaciones, notas, sesiones y asistencia |
| Alertas | Reglas, ejecución, evidencia, severidad y deduplicación |
| Seguimiento | Asignación, intervenciones, estados y cierre |
| Analítica | Indicadores y reportes |
| Auditoría | Cambios sensibles, actor y marca temporal |

## Modelo de datos conceptual

```mermaid
erDiagram
    USUARIO ||--o{ USUARIO_ROL : posee
    ROL ||--o{ USUARIO_ROL : asigna
    ESTABLECIMIENTO ||--o{ PERIODO_ESCOLAR : organiza
    PERIODO_ESCOLAR ||--o{ CURSO : contiene
    NIVEL_EDUCATIVO ||--o{ CURSO : clasifica
    ESTUDIANTE ||--o{ MATRICULA : registra
    CURSO ||--o{ MATRICULA : recibe
    CURSO ||--o{ CURSO_ASIGNATURA : imparte
    ASIGNATURA ||--o{ CURSO_ASIGNATURA : compone
    CURSO_ASIGNATURA ||--o{ EVALUACION : define
    EVALUACION ||--o{ CALIFICACION : produce
    ESTUDIANTE ||--o{ CALIFICACION : obtiene
    CURSO_ASIGNATURA ||--o{ SESION : programa
    SESION ||--o{ ASISTENCIA : registra
    ESTUDIANTE ||--o{ ASISTENCIA : posee
    ESTUDIANTE ||--o{ ALERTA : genera
    REGLA_ALERTA ||--o{ ALERTA : explica
    ALERTA ||--o{ INTERVENCION : recibe
    USUARIO ||--o{ INTERVENCION : realiza
```

## Flujo principal de alerta

```mermaid
sequenceDiagram
    participant Docente
    participant Web
    participant API
    participant Motor
    participant BD
    participant UTP

    Docente->>Web: Registra nota o asistencia
    Web->>API: Envía dato validado
    API->>BD: Persiste y audita cambio
    API->>Motor: Solicita evaluar reglas
    Motor->>BD: Consulta contexto escolar
    Motor->>BD: Registra o actualiza alerta explicable
    UTP->>Web: Consulta bandeja priorizada
    Web->>API: Solicita alertas autorizadas
    API-->>Web: Devuelve severidad y evidencia
```

## Requisitos no funcionales iniciales

- Seguridad: mínimo privilegio, contraseñas protegidas, control por rol y auditoría.
- Rendimiento: consultas principales bajo un umbral que se definirá con volumen de prueba.
- Disponibilidad: recuperación documentada y manejo de fallos controlado para la demo.
- Portabilidad: ejecución local mediante Docker Compose.
- Mantenibilidad: módulos, migraciones, pruebas y decisiones versionadas.
- Privacidad: datos sintéticos o anonimizados; no almacenar información innecesaria.

## Preguntas abiertas

- Framework backend definitivo.
- Estrategia de autenticación.
- Regla exacta de cálculo de notas y asistencia.
- Canal real o simulado de notificaciones.
- Volumen de datos y umbrales de rendimiento.

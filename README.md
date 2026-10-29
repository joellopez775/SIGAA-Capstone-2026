# SIGAA Capstone 2026

Sistema Integral de Gestión Académica y Alertas Tempranas para colegios y liceos.
Proyecto de Ingeniería en Informática, Duoc UC, sede Plaza Vespucio.

Equipo: Joel López, Matías Martínez y Agustín Sorolla. Product Owner: Joel López.

## Organización académica

Estructura indicada en el video de configuración de GitHub:

```text
Fase 1/
  Evidencias Individuales/
  Evidencias Grupales/
Fase 2/
  Evidencias Individuales/
  Evidencias Grupales/
  Evidencias Proyecto/
    SIGAA/                 Aplicación, Docker, base de datos y pruebas
    Gestión Scrum SIGAA/   Backlog, sprints, cronograma y PDF
    scripts/               Generación de documentos
Fase 3/
  Evidencias Individuales/
  Evidencias Grupales/
```

Los documentos individuales conservan el prefijo `Apellido_Nombre`. Los PDF acompañan a los formatos editables disponibles; no los reemplazan.

- [Aplicación y manual técnico](<Fase 2/Evidencias Proyecto/SIGAA/README.md>).
- [Expediente Scrum](<Fase 2/Evidencias Proyecto/Gestión Scrum SIGAA/README.md>).
- [Informes PDF](<Fase 2/Evidencias Proyecto/SIGAA/output/pdf/>).
- [Informe de actualización al 28 de octubre](<Fase 2/Evidencias Proyecto/SIGAA/output/pdf/Informe de actualización SIGAA.pdf>).
- [Presentación de avance editable](<Fase 2/Evidencias Proyecto/SIGAA/output/presentaciones/Avance del proyecto SIGAA.pptx>) y [copia PDF](<Fase 2/Evidencias Proyecto/SIGAA/output/pdf/Presentación de avance SIGAA.pdf>).
- [Guiones y material de estudio por integrante](<Fase 2/Evidencias Proyecto/SIGAA/output/pdf/Preparación de presentación/>): dos PDF para Joel, dos para Agustín y dos para Matías.
- [Sprints y registros PDF](<Fase 2/Evidencias Proyecto/Gestión Scrum SIGAA/PDF/02 Sprints/>).
- [Carta Gantt por sprints](<Fase 2/Evidencias Proyecto/Gestión Scrum SIGAA/05 Planificación/Carta Gantt SIGAA por sprints.xlsx>).
- [Estado de entregas](<ESTADO DE ENTREGAS.md>).
- [Informe de publicación y controles](<Informe de publicación.pdf>).
- [Inventario de publicación](INVENTARIO.json).

## Ejecutar una copia local

La presentación de avance contiene 18 diapositivas con contexto inicial: Joel
expone de la 1 a la 6, Agustín de la 7 a la 12 y Matías de la 13 a la 18.
Se proponen seis minutos por persona. Cada guion incluye qué mostrar y las
transiciones; cada material de estudio incluye conceptos, ejemplos, preguntas
y práctica. El PowerPoint incorpora el guion en sus notas. El informe y la
presentación usan Georgia y Helvetica Neue, según la tipografía de la plataforma.
Estos materiales preparan la exposición y no acreditan una defensa realizada.

Actualización del 28-10-2026: incremento 0.9.0 con casos, apoderados y ficha
integral, preparado para revisión. Documentación en
[Sprint 5](<Fase 2/Evidencias Proyecto/Gestión Scrum SIGAA/PDF/02 Sprints/Sprint 5/>).
El servidor público no fue actualizado con esta entrega; las notificaciones
siguen pendientes. Los informes anteriores conservan sus fechas de corte.

Requisitos: Git y Docker Desktop, o Docker Engine con Compose. No se requiere acceso al servidor del equipo.

```sh
git clone https://github.com/joellopez775/SIGAA-Capstone-2026.git
cd SIGAA-Capstone-2026
cd "Fase 2/Evidencias Proyecto/SIGAA"
cp .env.example .env
```

En Windows PowerShell utiliza `Copy-Item .env.example .env`. Edita `.env` y asigna `POSTGRES_PASSWORD` a una clave aleatoria propia de al menos 32 caracteres alfanuméricos. No subas ese archivo.

```sh
docker compose up --build -d
docker compose ps
```

Abre <http://localhost:8088>. La instalación local crea su propia base de datos; no conecta a la base del servidor. Las cuentas no se incluyen en Git. Para generar usuarios ficticios en una instalación vacía:

```sh
docker compose exec -e ALLOW_SAMPLE_DATA=yes -e CREDENTIALS_FILE=/tmp/cuentas-locales.json api npm run seed:local
docker compose cp api:/tmp/cuentas-locales.json .secrets-cuentas-locales.json
```

Guarda ese archivo de contraseñas de forma privada. Los correos de prueba están en `apps/api/src/sample-data.js`. El sembrador exige una base vacía y no debe ejecutarse en producción.

La carga ampliada del servidor (80 alumnos, 4 cursos, notas, asistencia y anotaciones) está documentada en `output/pdf/Carga de datos de demostración SIGAA.pdf`. Su ejecutor administrativo requiere un despliegue preparado; no es un paso de instalación local.

## Desarrollo y publicación

Trabaja en una rama `feature/nombre-del-cambio`, prueba el cambio y abre una solicitud de revisión hacia `main`. No incluyas `.env`, claves, tokens, respaldos ni datos de alumnos reales. Las pruebas de integración utilizan un PostgreSQL efímero independiente; configura `TEST_DB_PASSWORD` antes de ejecutar `compose.test.yaml`.

Esta publicación es una copia consolidada al 22 de octubre de 2026. Las evidencias conservan sus fechas originales, principalmente el 15 de octubre. Los registros históricos no acreditan reuniones, aprobaciones o pruebas posteriores a su fecha. Las credenciales y el historial del repositorio anterior no se trasladan.

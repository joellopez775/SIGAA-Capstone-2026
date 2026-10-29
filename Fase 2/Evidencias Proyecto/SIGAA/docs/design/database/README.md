# Modelo físico de SIGAA 0.9.1

[PDF completo de 14 páginas](<../../../output/pdf/Diagrama de base de datos actualizado - SIGAA.pdf>).

Corte: 28 de octubre de 2026. Fuente: instalación temporal y aislada de
PostgreSQL 16.15, con migraciones 001 a 010. Se extrajeron únicamente metadatos:
33 tablas, 324 columnas, 70 claves foráneas y una vista virtual. No contiene
datos de personas, credenciales ni información copiada de producción.

## Contenido

- Página 1: alcance y leyenda.
- Página 2: plano general vectorial, formato A0 vertical, con todas las PK/FK.
- Páginas 3-8: seis módulos, todos los campos, referencias externas grises.
- Páginas 9-14: las 70 FK con columnas exactas y cardinalidad física.

Cada tabla se desarrolla una vez en su módulo; puede aparecer como referencia
en otros módulos. Cada FK se dibuja una vez entre las relaciones salientes de
su módulo, además de aparecer en la vista general. Los índices parciales no
se convierten en cardinalidades globales. Las columnas JSON y entidad_id de
auditoría no producen FK implícitas. La vista no se cuenta como tabla física.

El catálogo JSON incluye tipos, nulabilidad, valores por defecto, claves,
restricciones CHECK e índices completos/parciales. Los diagramas muestran los
campos, PK, FK y unicidad simple; no reemplazan el catálogo de restricciones.
La existencia de una tabla no significa que tenga ya una pantalla implementada.

## Archivos y regeneración

- `catalog.sql`: consulta de solo lectura de los catálogos PostgreSQL.
- `00-general.dot` y `01-modulo.dot` a `06-modulo.dot`: fuentes editables.
- `../../../output/evidence/database-schema-0.9.1.json`: esquema extraído y
  huellas SHA-256 de las diez migraciones.
- `../../../output/evidence/database-diagram-validation.json`: cobertura y
  dimensiones verificadas.

Para obtener el catálogo, ejecutar catalog.sql en una copia aislada previamente
migrada y sin datos productivos, con `psql -At -v ON_ERROR_STOP=1`. No ejecutar
la migración 003 sobre una base escolar en uso: reemplaza el modelo inicial.

Desde la carpeta SIGAA, con Python/reportlab/pypdf, Node y @viz-js/viz disponibles:

```sh
python3 scripts/generate-database-diagram.py prepare
node scripts/layout-database.mjs
python3 scripts/generate-database-diagram.py pdf
```

`SIGAA_VIZ_MODULE` permite indicar el módulo Graphviz si está instalado fuera
del proyecto. El generador usa Georgia y Helvetica Neue del sistema macOS;
para otra plataforma, configurar sus rutas equivalentes. Las fuentes DOT son
portables y se pueden abrir directamente con Graphviz. El PDF conserva textos
y líneas vectoriales para ampliar o imprimir a escala.

Los documentos de arquitectura anteriores se conservan como antecedentes.
Este archivo describe el esquema actual del repositorio, no una certificación
de que el servidor público ya esté ejecutando la versión 0.9.1.

#!/bin/sh
set -eu

compose_file="${1:-compose.server.yaml}"
env_file="${2:-.env.server}"

docker compose --env-file "$env_file" -f "$compose_file" config --quiet
docker compose --env-file "$env_file" -f "$compose_file" ps

published_ports=$(docker compose --env-file "$env_file" -f "$compose_file" config --format json | grep -c '"published"' || true)
if [ "$published_ports" -ne 0 ]; then
  echo "ERROR: la configuración del servidor publica puertos en el host." >&2
  exit 1
fi

docker compose --env-file "$env_file" -f "$compose_file" exec -T db sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"' >/dev/null 2>&1 || {
  echo "ERROR: PostgreSQL no está saludable." >&2
  exit 1
}

docker compose --env-file "$env_file" -f "$compose_file" exec -T web wget -q -O /dev/null http://127.0.0.1:8080/healthz
echo "OK: aplicación saludable y sin puertos publicados en el Mac servidor."

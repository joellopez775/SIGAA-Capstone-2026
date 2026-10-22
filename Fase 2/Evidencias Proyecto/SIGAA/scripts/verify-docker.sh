#!/usr/bin/env sh
set -eu

web_port="${WEB_PORT:-8088}"
api_port="${API_PORT:-3000}"

docker compose config --quiet
docker compose ps

curl --fail --silent "http://localhost:${api_port}/health"
printf '\n'
curl --fail --silent "http://localhost:${api_port}/db-health"
printf '\n'
curl --fail --silent "http://localhost:${web_port}/api/health"
printf '\n'
curl --fail --silent "http://localhost:${web_port}/healthz"
printf '\nVerificación SIGAA completada.\n'

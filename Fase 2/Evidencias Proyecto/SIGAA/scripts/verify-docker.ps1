$ErrorActionPreference = "Stop"

$webPort = if ($env:WEB_PORT) { $env:WEB_PORT } else { "8088" }
$apiPort = if ($env:API_PORT) { $env:API_PORT } else { "3000" }

docker compose config --quiet
if ($LASTEXITCODE -ne 0) { throw "La configuración de Docker Compose no es válida." }

docker compose ps

$apiHealth = Invoke-RestMethod -Uri "http://localhost:$apiPort/health"
$dbHealth = Invoke-RestMethod -Uri "http://localhost:$apiPort/db-health"
$proxyHealth = Invoke-RestMethod -Uri "http://localhost:$webPort/api/health"
$webHealth = Invoke-RestMethod -Uri "http://localhost:$webPort/healthz"

if ($apiHealth.status -ne "ok") { throw "La API no está saludable." }
if ($dbHealth.status -ne "ok") { throw "PostgreSQL no está saludable." }
if ($proxyHealth.status -ne "ok") { throw "El proxy web hacia la API no responde." }
if ($webHealth -ne "ok") { throw "La aplicación web no está saludable." }

Write-Host "Verificación SIGAA completada." -ForegroundColor Green

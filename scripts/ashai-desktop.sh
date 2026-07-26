#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/ashish/Linuxx/AshAI"
COMPOSE_FILE="$PROJECT_DIR/docker/docker-compose.yml"
APP_URL="http://localhost:5500"

cd "$PROJECT_DIR"
docker compose -f "$COMPOSE_FILE" up -d --build

for _ in $(seq 1 60); do
    if curl --silent --fail "$APP_URL" >/dev/null; then
        break
    fi
    sleep 1
done

if command -v google-chrome >/dev/null 2>&1; then
    exec google-chrome --app="$APP_URL"
elif command -v chromium >/dev/null 2>&1; then
    exec chromium --app="$APP_URL"
elif command -v chromium-browser >/dev/null 2>&1; then
    exec chromium-browser --app="$APP_URL"
else
    exec xdg-open "$APP_URL"
fi

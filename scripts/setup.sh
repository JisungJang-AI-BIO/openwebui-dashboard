#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════
# Open WebUI + Dashboard - Docker Deployment Script
# ═══════════════════════════════════════════════════════════════
# Usage:
#   cd /mnt/nvme2/openwebui-docker-with-dashboard
#   cp .env.example .env   # fill in secrets
#   bash scripts/setup.sh
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "============================================"
echo " Open WebUI + Dashboard Deployment"
echo "============================================"

# ----- Step 0: Pre-flight checks -----
echo ""
echo "[Step 0] Pre-flight checks..."

if ! command -v docker &>/dev/null; then
    echo "ERROR: docker is not installed"; exit 1
fi
echo "  Docker: $(docker --version)"

if ! docker compose version &>/dev/null; then
    echo "ERROR: docker compose (V2) is not available"; exit 1
fi
echo "  Compose: $(docker compose version --short)"

if ! command -v nvidia-smi &>/dev/null; then
    echo "WARNING: nvidia-smi not found."
else
    echo "  GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)"
fi

if docker network inspect openwebui-db_default &>/dev/null; then
    echo "  DB network: openwebui-db_default (found)"
else
    echo "  ERROR: Docker network 'openwebui-db_default' not found."
    echo "  Ensure the webui-db PostgreSQL container is running."
    exit 1
fi

# ----- Step 1: Verify files -----
echo ""
echo "[Step 1] Project directory: ${PROJECT_DIR}"

cd "$PROJECT_DIR"

if [[ ! -f "docker-compose.yml" ]]; then
    echo "  ERROR: docker-compose.yml not found"; exit 1
fi
if [[ ! -f ".env" ]]; then
    echo "  ERROR: .env not found. Run: cp .env.example .env"; exit 1
fi

chmod 600 .env
echo "  .env permissions set to 600"

# ----- Step 2: Generate WEBUI_SECRET_KEY if not set -----
echo ""
echo "[Step 2] Checking WEBUI_SECRET_KEY..."

if grep -q "^WEBUI_SECRET_KEY=" .env; then
    echo "  WEBUI_SECRET_KEY is already set"
else
    SECRET_KEY=$(openssl rand -hex 32)
    sed -i "s|^# WEBUI_SECRET_KEY=.*|WEBUI_SECRET_KEY=${SECRET_KEY}|" .env
    echo "  Generated and set WEBUI_SECRET_KEY"
fi

# ----- Step 3: Build and start all services -----
echo ""
echo "[Step 3] Building dashboard images and pulling Open WebUI..."

docker compose build
docker compose pull open-webui
docker compose up -d

echo "  Waiting for services to start..."
sleep 15

# ----- Step 4: Verify -----
echo ""
echo "[Step 4] Verification..."

docker compose ps
echo ""

# Open WebUI health
echo "  Open WebUI health:"
for i in $(seq 1 6); do
    if curl -sf http://127.0.0.1:10085/health > /dev/null 2>&1; then
        echo "    Health check passed"; break
    fi
    if [[ $i -eq 6 ]]; then
        echo "    Health check failed. Check: docker logs open-webui"
    else
        echo "    Attempt ${i}/6 - waiting 10s..."; sleep 10
    fi
done

# Dashboard backend health
echo "  Dashboard backend:"
curl -sf http://127.0.0.1:10086/health 2>/dev/null && echo "" || echo "    Not ready yet (check: docker logs dashboard-backend)"

# GPU
echo "  GPU inside container:"
docker exec open-webui nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || echo "    GPU not accessible"

# ----- Step 5: nginx reminder -----
echo ""
echo "[Step 5] nginx configuration"
echo "  sudo cp ${PROJECT_DIR}/nginx/openwebui.conf /etc/nginx/conf.d/openwebui.conf"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  Firewall: ensure port 30088 is open for dashboard access"

# ----- Done -----
echo ""
echo "============================================"
echo " Deployment complete!"
echo "============================================"
echo ""
echo " Open WebUI:  https://openwebui.sbiologics.com"
echo " Dashboard:   https://openwebui.sbiologics.com:30088"
echo ""
echo " Logs:    docker compose logs -f"
echo " Restart: docker compose restart"
echo " Stop:    docker compose down"
echo " Update:  docker compose pull && docker compose build && docker compose up -d"
echo ""

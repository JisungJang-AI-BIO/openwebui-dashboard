#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Import Skills & Tools into Open WebUI (no API key needed)
# =============================================================================
# Runs a Python script inside the OpenWebUI container that directly inserts
# into the PostgreSQL database. No API key or manual steps required.
#
# Usage:
#   bash scripts/import-skills-tools.sh                     # production
#   bash scripts/import-skills-tools.sh open-webui-staging  # staging
#
# Prerequisites:
#   - OpenWebUI container must be running and healthy
#   - At least one admin account must exist in OpenWebUI
# =============================================================================

CONTAINER="${1:-open-webui}"

echo "============================================"
echo " Import Skills & Tools"
echo "============================================"
echo ""
echo " Container: $CONTAINER"
echo ""

# ---------------------------------------------------------------------------
# Check container is running
# ---------------------------------------------------------------------------
if ! docker inspect "$CONTAINER" &>/dev/null; then
    echo "ERROR: Container '$CONTAINER' not found."
    echo "Is Open WebUI running?"
    exit 1
fi

STATE=$(docker inspect -f '{{.State.Status}}' "$CONTAINER" 2>/dev/null)
if [[ "$STATE" != "running" ]]; then
    echo "ERROR: Container '$CONTAINER' is $STATE (expected: running)."
    exit 1
fi

# ---------------------------------------------------------------------------
# Run import script inside the container
# ---------------------------------------------------------------------------
docker exec "$CONTAINER" python3 /app/OpenWebUI-Skills/server-setup/import-to-db.py

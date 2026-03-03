#!/bin/bash
# =============================================================================
# Master Setup Script — OpenWebUI Skills
# Orchestrates all setup steps in the correct order.
#
# Usage:
#   cd <project-root>
#   bash server-setup/setup.sh [--skip-system] [--skip-python] [--skip-vendor] [--phase PHASE]
#
# Options:
#   --skip-system   Skip system dependency installation (apt)
#   --skip-python   Skip Python dependency installation (pip)
#   --skip-vendor   Skip Anthropic scripts clone
#   --phase PHASE   Python install phase (1|2|3|docx|all) [default: docx]
# =============================================================================

set -e

PROJ_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SETUP_DIR="$PROJ_DIR/server-setup"

SKIP_SYSTEM=false
SKIP_PYTHON=false
SKIP_VENDOR=false
PY_PHASE="docx"

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-system) SKIP_SYSTEM=true; shift ;;
        --skip-python) SKIP_PYTHON=true; shift ;;
        --skip-vendor) SKIP_VENDOR=true; shift ;;
        --phase)       PY_PHASE="$2"; shift 2 ;;
        *) shift ;;
    esac
done

echo "╔══════════════════════════════════════════╗"
echo "║   OpenWebUI-Skills Setup                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Project     : $PROJ_DIR"
echo "Skip system : $SKIP_SYSTEM"
echo "Skip python : $SKIP_PYTHON"
echo "Skip vendor : $SKIP_VENDOR"
echo "Python phase: $PY_PHASE"
echo ""

# -----------------------------------------------------------------------
# Step 1: System Dependencies
# -----------------------------------------------------------------------
if [ "$SKIP_SYSTEM" = false ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " Step 1/4: System Dependencies (apt)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    bash "$SETUP_DIR/install-system-deps.sh"
else
    echo "[SKIP] Step 1: System Dependencies"
fi

# -----------------------------------------------------------------------
# Step 2: Anthropic Scripts
# -----------------------------------------------------------------------
if [ "$SKIP_VENDOR" = false ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " Step 2/4: Anthropic Scripts (vendor/)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    bash "$SETUP_DIR/clone-anthropic-scripts.sh" "$PROJ_DIR"
else
    echo "[SKIP] Step 2: Anthropic Scripts"
fi

# -----------------------------------------------------------------------
# Step 3: Python Dependencies
# -----------------------------------------------------------------------
if [ "$SKIP_PYTHON" = false ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " Step 3/4: Python Dependencies (pip)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    bash "$SETUP_DIR/install-python-deps.sh" --phase "$PY_PHASE"
else
    echo "[SKIP] Step 3: Python Dependencies"
fi

# -----------------------------------------------------------------------
# Step 4: Verification
# -----------------------------------------------------------------------
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Step 4/4: Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
bash "$SETUP_DIR/verify-all.sh" "$PROJ_DIR"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Setup Complete                         ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Register tools in OpenWebUI:"
echo "     Workspace → Tools → '+' → Paste tools/*.py content"
echo "  2. Register skills in OpenWebUI:"
echo "     Workspace → Skills → '+' → Paste skills/*.md content"
echo "  3. Configure Tool Valves in OpenWebUI:"
echo "     SCRIPTS_DIR = $PROJ_DIR/vendor/docx"
echo "  4. Test with TEST_GUIDE.md:"
echo "     See tests/TEST_GUIDE.md for step-by-step validation"
echo ""

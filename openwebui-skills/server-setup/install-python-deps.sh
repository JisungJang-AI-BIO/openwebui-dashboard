#!/bin/bash
# =============================================================================
# Python Dependencies: Check & Install (All Phases)
# Only installs what's missing — never upgrades existing packages.
#
# Usage:
#   bash server-setup/install-python-deps.sh [--phase 1|2|3|all]
#
# Default: --phase 1 (Document Processing)
# =============================================================================

set -e

PHASE="${2:-1}"
# Parse --phase argument
while [[ $# -gt 0 ]]; do
    case $1 in
        --phase) PHASE="$2"; shift 2 ;;
        *) shift ;;
    esac
done

echo "============================================"
echo " Python Dependencies Check & Install"
echo "============================================"
echo ""
echo "Python : $(python --version 2>&1)"
echo "pip    : $(pip --version 2>&1 | head -1)"
echo "Env    : ${VIRTUAL_ENV:-${CONDA_DEFAULT_ENV:-'(system python)'}}"
echo "Phase  : $PHASE"
echo ""

# ---------------------------------------------------------------------------
# Check & install function
# ---------------------------------------------------------------------------
TOTAL_SKIP=0
TOTAL_INSTALL=0
TOTAL_FAIL=0

check_and_install_phase() {
    local phase_label="$1"
    shift
    # Remaining args are pip_name:import_name pairs
    local need=()

    echo "--- $phase_label ---"

    while [ $# -gt 0 ]; do
        local pip_name="${1%%:*}"
        local import_name="${1#*:}"
        shift

        if python -c "import $import_name" &>/dev/null 2>&1; then
            local ver
            ver=$(python -c "
try:
    import $import_name as m
    v = getattr(m, '__version__', None) or getattr(m, 'VERSION', None)
    print(v or 'OK')
except: print('OK')
" 2>/dev/null)
            echo "  [SKIP] $pip_name ($ver)"
            TOTAL_SKIP=$((TOTAL_SKIP + 1))
        else
            echo "  [NEED] $pip_name"
            need+=("$pip_name")
        fi
    done

    echo ""
    if [ ${#need[@]} -eq 0 ]; then
        echo "  ✅ All $phase_label dependencies present."
    else
        echo "  Installing: ${need[*]}"
        pip install "${need[@]}" 2>&1 | tail -5
        echo ""
        echo "  Verify:"
        for pip_name in "${need[@]}"; do
            # Re-derive import name (simple mapping)
            if python -c "
import importlib
try:
    importlib.import_module('$pip_name'.replace('-','_').lower())
    exit(0)
except:
    pass
# common renames
renames = {'python-docx':'docx','python-pptx':'pptx','Pillow':'PIL','pytesseract':'pytesseract'}
mod = renames.get('$pip_name', '$pip_name'.replace('-','_'))
importlib.import_module(mod)
" &>/dev/null 2>&1; then
                echo "    ✅ $pip_name"
                TOTAL_INSTALL=$((TOTAL_INSTALL + 1))
            else
                echo "    ❌ $pip_name — FAILED"
                TOTAL_FAIL=$((TOTAL_FAIL + 1))
            fi
        done
    fi
    echo ""
}

# ---------------------------------------------------------------------------
# Phase Definitions
# pip_name:import_name pairs
# ---------------------------------------------------------------------------

install_phase1_docx() {
    check_and_install_phase "Phase 1 — DOCX Tool" \
        "python-docx:docx" \
        "lxml:lxml" \
        "mammoth:mammoth" \
        "defusedxml:defusedxml"
}

install_phase1_pdf() {
    check_and_install_phase "Phase 1 — PDF Tool" \
        "pypdf:pypdf" \
        "pdfplumber:pdfplumber" \
        "reportlab:reportlab" \
        "pdf2image:pdf2image" \
        "pytesseract:pytesseract" \
        "Pillow:PIL"
}

install_phase1_office() {
    check_and_install_phase "Phase 1 — PPTX & XLSX Tools" \
        "python-pptx:pptx" \
        "openpyxl:openpyxl" \
        "pandas:pandas" \
        "xlsxwriter:xlsxwriter"
}

install_phase2() {
    check_and_install_phase "Phase 2 — GIF Creator" \
        "imageio:imageio" \
        "numpy:numpy"
}

install_phase3() {
    check_and_install_phase "Phase 3 — Web Testing" \
        "playwright:playwright"
    echo "  Note: After installing playwright, run:"
    echo "    playwright install chromium"
    echo "    playwright install-deps"
}

# ---------------------------------------------------------------------------
# Run selected phases
# ---------------------------------------------------------------------------

case "$PHASE" in
    1)
        install_phase1_docx
        install_phase1_pdf
        install_phase1_office
        ;;
    2)
        install_phase2
        ;;
    3)
        install_phase3
        ;;
    docx)
        install_phase1_docx
        ;;
    pdf)
        install_phase1_pdf
        ;;
    office)
        install_phase1_office
        ;;
    all)
        install_phase1_docx
        install_phase1_pdf
        install_phase1_office
        install_phase2
        install_phase3
        ;;
    *)
        echo "Unknown phase: $PHASE"
        echo "Usage: $0 --phase [1|2|3|docx|pdf|office|all]"
        exit 1
        ;;
esac

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "============================================"
echo " Summary"
echo "============================================"
echo "  Skipped (already installed) : $TOTAL_SKIP"
echo "  Newly installed             : $TOTAL_INSTALL"
echo "  Failed                      : $TOTAL_FAIL"
echo ""

# Full status for active phases
echo "--- Installed Versions ---"
python -c "
packages = {
    # Phase 1: DOCX
    'python-docx': 'docx',
    'lxml': 'lxml',
    'mammoth': 'mammoth',
    'defusedxml': 'defusedxml',
    # Phase 1: PDF
    'pypdf': 'pypdf',
    'pdfplumber': 'pdfplumber',
    'reportlab': 'reportlab',
    'pdf2image': 'pdf2image',
    'pytesseract': 'pytesseract',
    'Pillow': 'PIL',
    # Phase 1: Office
    'python-pptx': 'pptx',
    'openpyxl': 'openpyxl',
    'pandas': 'pandas',
    'xlsxwriter': 'xlsxwriter',
    # Phase 2
    'imageio': 'imageio',
    'numpy': 'numpy',
}
for pip_name, mod in packages.items():
    try:
        m = __import__(mod)
        v = getattr(m, '__version__', 'OK')
        print(f'  {pip_name:20s} {v}')
    except ImportError:
        print(f'  {pip_name:20s} —')
"
echo ""
echo "Done."

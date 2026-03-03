#!/bin/bash
# =============================================================================
# Full Environment Verification (All Skills)
# Run after installation to confirm everything is in place.
#
# Usage:
#   bash server-setup/verify-all.sh [project_dir]
# =============================================================================

PROJ_DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)}"

echo "============================================"
echo " Full Environment Verification"
echo "============================================"
echo ""
echo "Project: $PROJ_DIR"
echo "Python : $(python --version 2>&1)"
echo "Env    : ${VIRTUAL_ENV:-${CONDA_DEFAULT_ENV:-'(system python)'}}"
echo ""

FAIL=0
WARN=0

pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  ⚠️  $1"; WARN=$((WARN + 1)); }

check_cmd() {
    if command -v "$2" &>/dev/null; then pass "$1"; else fail "$1 — '$2' not found"; fi
}

check_python() {
    if python -c "import $2" &>/dev/null 2>&1; then pass "$1"; else fail "$1 — 'import $2' failed"; fi
}

check_python_opt() {
    if python -c "import $2" &>/dev/null 2>&1; then pass "$1"; else warn "$1 — 'import $2' not available (optional)"; fi
}

check_file() {
    if [ -f "$2" ]; then pass "$1"; else fail "$1 — $2 not found"; fi
}

check_file_opt() {
    if [ -f "$2" ]; then pass "$1"; else warn "$1 — $2 not found (optional)"; fi
}

check_dir() {
    if [ -d "$2" ]; then pass "$1"; else fail "$1 — $2 not found"; fi
}

check_dir_opt() {
    if [ -d "$2" ]; then pass "$1"; else warn "$1 — $2 not found (optional)"; fi
}

# ==========================================================================
# 1. Project Structure
# ==========================================================================
echo "[1. Project Structure]"
check_dir  "Project directory"    "$PROJ_DIR"
check_dir  "tools/"               "$PROJ_DIR/tools"
check_dir  "skills/"              "$PROJ_DIR/skills"
check_dir  "server-setup/"        "$PROJ_DIR/server-setup"
check_dir  "tests/"               "$PROJ_DIR/tests"

# ==========================================================================
# 2. Vendor (Anthropic Scripts)
# ==========================================================================
echo ""
echo "[2. Anthropic Scripts (vendor/)]"
VENDOR="$PROJ_DIR/vendor"
check_dir "vendor/ directory" "$VENDOR"

# docx scripts
echo "  --- docx ---"
check_file "  unpack.py"          "$VENDOR/docx/office/unpack.py"
check_file "  pack.py"            "$VENDOR/docx/office/pack.py"
check_file "  validate.py"        "$VENDOR/docx/office/validate.py"
check_file "  soffice.py"         "$VENDOR/docx/office/soffice.py"
check_file "  accept_changes.py"  "$VENDOR/docx/accept_changes.py"
check_file "  comment.py"         "$VENDOR/docx/comment.py"
check_dir_opt "  validators/"     "$VENDOR/docx/office/validators"
check_dir_opt "  schemas/"        "$VENDOR/docx/office/schemas"

# pdf scripts
echo "  --- pdf ---"
check_dir_opt "  pdf scripts"     "$VENDOR/pdf"

# pptx scripts
echo "  --- pptx ---"
check_dir_opt "  pptx scripts"    "$VENDOR/pptx"

# xlsx scripts
echo "  --- xlsx ---"
check_dir_opt "  xlsx scripts"    "$VENDOR/xlsx"

# validators module import test
if python -c "
import sys; sys.path.insert(0, '$VENDOR/docx/office')
from validators import DOCXSchemaValidator
" &>/dev/null 2>&1; then
    pass "  validators module importable"
else
    warn "  validators module import failed (XSD validation will use fallback)"
fi

# ==========================================================================
# 3. System Tools
# ==========================================================================
echo ""
echo "[3. System Tools]"
check_cmd "LibreOffice"     soffice
check_cmd "Pandoc"          pandoc
check_cmd "pdftoppm"        pdftoppm
check_cmd "qpdf"            qpdf
check_cmd "Tesseract"       tesseract
check_cmd "Node.js"         node
check_cmd "npm"             npm

if npm list -g docx &>/dev/null 2>&1; then
    pass "docx npm package (global)"
else
    warn "docx npm package not found globally (docx-js creation disabled)"
fi

# ==========================================================================
# 4. Python Packages — Phase 1 (Document Processing)
# ==========================================================================
echo ""
echo "[4. Python Packages]"

echo "  --- DOCX (required) ---"
check_python "python-docx"  "docx"
check_python "lxml"         "lxml"
check_python "mammoth"      "mammoth"
check_python "defusedxml"   "defusedxml"

echo "  --- PDF (Phase 1) ---"
check_python_opt "pypdf"        "pypdf"
check_python_opt "pdfplumber"   "pdfplumber"
check_python_opt "reportlab"    "reportlab"
check_python_opt "pdf2image"    "pdf2image"
check_python_opt "pytesseract"  "pytesseract"
check_python_opt "Pillow"       "PIL"

echo "  --- PPTX & XLSX (Phase 1) ---"
check_python_opt "python-pptx"  "pptx"
check_python_opt "openpyxl"     "openpyxl"
check_python_opt "pandas"       "pandas"
check_python_opt "xlsxwriter"   "xlsxwriter"

echo "  --- Phase 2 ---"
check_python_opt "imageio"      "imageio"
check_python_opt "numpy"        "numpy"

# ==========================================================================
# 5. OpenWebUI Tools
# ==========================================================================
echo ""
echo "[5. OpenWebUI Tools]"

check_tool() {
    local label="$1"
    local tool_file="$2"
    shift 2
    # Remaining args are method names to check

    if [ ! -f "$tool_file" ]; then
        warn "$label — file not found"
        return
    fi

    local methods_check=""
    for m in "$@"; do
        methods_check="${methods_check}assert hasattr(t, '$m'), '$m missing'; "
    done

    if python -c "
import importlib.util
spec = importlib.util.spec_from_file_location('tool', '$tool_file')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
t = mod.Tools()
$methods_check
" &>/dev/null 2>&1; then
        pass "$label — class loads, all methods present"
    else
        fail "$label — import or method check failed"
        echo "    Debug:"
        python -c "
import importlib.util, traceback
spec = importlib.util.spec_from_file_location('tool', '$tool_file')
mod = importlib.util.module_from_spec(spec)
try:
    spec.loader.exec_module(mod)
    t = mod.Tools()
    methods = [m for m in dir(t) if not m.startswith('_') and callable(getattr(t, m))]
    print('    Methods found:', methods)
except Exception:
    traceback.print_exc()
" 2>&1 | sed 's/^/    /'
    fi
}

check_tool "docx_tool.py" "$PROJ_DIR/tools/docx_tool.py" \
    read_docx create_docx create_docx_from_js edit_docx_xml convert_docx validate_docx

# Future tools (check only if file exists)
for future_tool in pdf_tool.py pptx_tool.py xlsx_tool.py gif_creator_tool.py; do
    tool_path="$PROJ_DIR/tools/$future_tool"
    if [ -f "$tool_path" ]; then
        check_tool "$future_tool" "$tool_path"
    fi
done

# ==========================================================================
# 6. OpenWebUI Skills (Markdown files)
# ==========================================================================
echo ""
echo "[6. OpenWebUI Skills]"
check_file "docx.md"   "$PROJ_DIR/skills/docx.md"

SKILL_COUNT=$(ls -1 "$PROJ_DIR/skills/"*.md 2>/dev/null | wc -l)
echo "  Total skill files: $SKILL_COUNT"

# ==========================================================================
# 7. Korean Fonts
# ==========================================================================
echo ""
echo "[7. Korean Fonts]"
if fc-list 2>/dev/null | grep -qi nanum; then
    pass "Nanum fonts available"
    fc-list 2>/dev/null | grep -i nanum | head -3 | sed 's/^/    /'
else
    warn "Nanum fonts not found (Korean rendering may fail)"
fi

# ==========================================================================
# Summary
# ==========================================================================
echo ""
echo "============================================"
if [ $FAIL -eq 0 ] && [ $WARN -eq 0 ]; then
    echo " ALL CHECKS PASSED ✅"
elif [ $FAIL -eq 0 ]; then
    echo " PASSED with $WARN warning(s) ⚠️"
    echo " (Warnings are for optional/future components)"
else
    echo " $FAIL FAILED, $WARN warning(s) ❌"
fi
echo "============================================"

exit $FAIL

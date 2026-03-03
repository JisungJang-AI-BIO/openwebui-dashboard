#!/bin/bash
# =============================================================================
# System Dependencies: Check & Install
# Only installs what's missing — never upgrades existing packages.
# =============================================================================

set -e

echo "============================================"
echo " System Dependencies Check & Install"
echo "============================================"
echo ""

install_if_missing() {
    local cmd="$1"
    local pkg="$2"
    local label="${3:-$pkg}"

    if command -v "$cmd" &>/dev/null; then
        local ver
        ver=$("$cmd" --version 2>&1 | head -1)
        echo "[SKIP] $label — already installed: $ver"
    else
        echo "[INSTALL] $label — not found, installing $pkg ..."
        sudo apt-get install -y "$pkg"
        ver=$("$cmd" --version 2>&1 | head -1)
        echo "  → installed: $ver"
    fi
}

check_dpkg() {
    local pkg="$1"
    local label="${2:-$pkg}"

    if dpkg -s "$pkg" &>/dev/null 2>&1; then
        echo "[SKIP] $label — already installed"
        return 1  # not newly installed
    else
        echo "[INSTALL] $label ..."
        sudo apt-get install -y "$pkg"
        return 0  # newly installed
    fi
}

# apt-get update (safe, index refresh only)
sudo apt-get update -qq

echo ""
echo "--- Core Tools ---"
install_if_missing soffice libreoffice "LibreOffice"
install_if_missing pandoc pandoc "Pandoc"
install_if_missing pdftoppm poppler-utils "Poppler (pdftoppm)"
install_if_missing qpdf qpdf "qpdf"

echo ""
echo "--- OCR ---"
install_if_missing tesseract tesseract-ocr "Tesseract OCR"
check_dpkg tesseract-ocr-kor "Tesseract Korean language pack" || true

echo ""
echo "--- Node.js (for docx-js) ---"
install_if_missing node nodejs "Node.js"
install_if_missing npm npm "npm"

if npm list -g docx &>/dev/null 2>&1; then
    echo "[SKIP] docx (npm) — already installed globally"
else
    echo "[INSTALL] docx (npm) — installing globally ..."
    npm install -g docx
fi

echo ""
echo "--- Fonts ---"
FONTS_CHANGED=false
check_dpkg fonts-nanum "Nanum fonts" && FONTS_CHANGED=true || true
check_dpkg fonts-nanum-coding "Nanum Coding font" && FONTS_CHANGED=true || true
check_dpkg fonts-nanum-extra "Nanum Extra fonts" && FONTS_CHANGED=true || true

if [ "$FONTS_CHANGED" = true ]; then
    echo "[REBUILD] Font cache (new fonts installed) ..."
    sudo fc-cache -fv
else
    echo "[SKIP] Font cache — no new fonts installed"
fi

echo ""
echo "============================================"
echo " Summary"
echo "============================================"
echo ""
printf "%-14s %s\n" "soffice:" "$(soffice --version 2>&1 | head -1 || echo 'NOT FOUND')"
printf "%-14s %s\n" "pandoc:" "$(pandoc --version 2>&1 | head -1 || echo 'NOT FOUND')"
printf "%-14s %s\n" "pdftoppm:" "$(pdftoppm -v 2>&1 | head -1 || echo 'NOT FOUND')"
printf "%-14s %s\n" "qpdf:" "$(qpdf --version 2>&1 | head -1 || echo 'NOT FOUND')"
printf "%-14s %s\n" "tesseract:" "$(tesseract --version 2>&1 | head -1 || echo 'NOT FOUND')"
printf "%-14s %s\n" "node:" "$(node --version 2>&1 || echo 'NOT FOUND')"
printf "%-14s %s\n" "npm:" "$(npm --version 2>&1 || echo 'NOT FOUND')"
printf "%-14s %s\n" "docx(npm):" "$(npm list -g docx 2>/dev/null | grep docx || echo 'NOT FOUND')"
echo ""
echo "Done."

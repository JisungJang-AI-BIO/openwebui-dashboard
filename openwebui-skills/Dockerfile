# =============================================================================
# OpenWebUI-Skills — Custom Docker Image
# Extends an official OpenWebUI image with document processing dependencies.
#
# Build (standalone):
#   docker build -t openwebui-skills .
#
# Build (extend your existing image):
#   docker build --build-arg BASE_IMAGE=ghcr.io/open-webui/open-webui:cuda \
#     -t openwebui-skills:cuda .
#
# Run:
#   docker compose up -d
# =============================================================================

ARG BASE_IMAGE=ghcr.io/open-webui/open-webui:main
FROM ${BASE_IMAGE}

# --- Metadata ---
LABEL maintainer="JisungJang-AI-BIO"
LABEL description="OpenWebUI with Anthropic Skills dependencies (LibreOffice, Pandoc, Tesseract, Node.js, etc.)"

# --- System dependencies ---
USER root

RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        libreoffice \
        pandoc \
        poppler-utils \
        qpdf \
        tesseract-ocr \
        tesseract-ocr-kor \
        nodejs \
        npm \
        fonts-nanum \
        fonts-nanum-coding \
        fonts-nanum-extra \
        git \
    && fc-cache -fv \
    && npm install -g docx \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# --- Project files ---
WORKDIR /app/OpenWebUI-Skills

COPY requirements.txt ./
COPY server-setup/ ./server-setup/
COPY tools/ ./tools/
COPY skills/ ./skills/
COPY tests/ ./tests/

# --- Python dependencies ---
RUN pip install --no-cache-dir -r requirements.txt

# --- Anthropic vendor scripts ---
RUN bash server-setup/clone-anthropic-scripts.sh /app/OpenWebUI-Skills

# --- Switch back to non-root if base image uses one ---
# (OpenWebUI base image typically runs as root)

WORKDIR /app

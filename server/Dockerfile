# ---- base ----
FROM python:3.13-alpine AS base
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# ---- builder ----
FROM base AS builder
WORKDIR /app

# C-extension build deps (cryptography/cffi)
RUN apk add --no-cache \
    gcc \
    musl-dev \
    libffi-dev

# Sync dependencies first (separate layer — only re-runs when lock file changes)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Copy source and finish syncing (fast — deps already installed)
COPY . .
RUN uv sync --frozen --no-dev

# ---- runner ----
FROM python:3.13-alpine AS runner
WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Runtime system deps
# - ghostscript: file compression
# - libffi: runtime requirement for cryptography/cffi
RUN apk add --no-cache \
    ghostscript \
    libffi \
 && addgroup -S app \
 && adduser -S app -G app

COPY --from=builder --chown=app:app /app /app

USER app
EXPOSE 2323

CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "2323"]

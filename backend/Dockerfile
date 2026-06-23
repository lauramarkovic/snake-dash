# syntax=docker/dockerfile:1

# ---- Stage 1: Build Python dependencies with uv ----
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS python-dependencies

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# ---- Stage 2: Build the static frontend ----
FROM oven/bun:1 AS frontend-builder

WORKDIR /app

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ ./

ENV STATIC_BUILD=true
ENV VITE_API_URL=/api

RUN bun run build

# ---- Stage 3: Run the backend and serve the frontend with Python ----
FROM python:3.12-slim AS runtime

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV FRONTEND_DIST=/app/static

WORKDIR /app

COPY --from=python-dependencies /app/.venv ./.venv
COPY backend/ ./
COPY --from=frontend-builder /app/dist/client ./static

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

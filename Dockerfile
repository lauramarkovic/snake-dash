# syntax=docker/dockerfile:1

# ---- Stage 1: Build Frontend ----
FROM oven/bun:1 AS frontend-builder
WORKDIR /app

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ ./

# Build for Node.js SSR server.
# VITE_API_URL=/api makes the browser use a relative URL so all API calls
# go to the same origin (FastAPI on port 8000) in production.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
ENV NITRO_PRESET=node-server
RUN bun run build

# ---- Stage 2: Runtime ----
FROM python:3.12-slim

# Install Node.js 22 for the SSR server
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

WORKDIR /app

# Install Python dependencies (separate layer for caching)
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev

# Copy backend source
COPY backend/ ./

# Copy frontend SSR build from Stage 1
COPY --from=frontend-builder /app/.output ./frontend/.output

COPY start.sh ./
RUN chmod +x start.sh

# FastAPI proxies non-/api requests to the Node SSR server on port 3000
ENV SSR_URL=http://localhost:3000
ENV DATABASE_URL=sqlite:////data/snake.db

RUN mkdir -p /data

EXPOSE 8000

CMD ["/app/start.sh"]

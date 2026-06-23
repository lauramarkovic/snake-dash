#!/bin/sh
set -e

# Start the Node SSR server on port 3000 (internal, not exposed).
# FastAPI (port 8000) proxies all non-/api requests to it.
PORT=3000 node /app/frontend/.output/server/index.mjs &

exec uv run uvicorn main:app --host 0.0.0.0 --port 8000

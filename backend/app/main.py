import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import DEFAULT_DATABASE_URL, Database
from app.routers import auth, games, scores
from app.store import DatabaseStore


DEV_ORIGIN_REGEX = (
    r"^https?://(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$"
    r"|^https://(?:[a-z0-9-]+\.)*app\.github\.dev$"
)


def environment_flag(name: str, *, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def environment_int(name: str, *, default: int) -> int:
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except ValueError as exc:
        raise RuntimeError(f"{name} must be an integer") from exc


def create_app(
    *,
    seed: bool = True,
    database_url: str | None = None,
    frontend_directory: str | Path | None = None,
) -> FastAPI:
    resolved_database_url = database_url or os.getenv(
        "DATABASE_URL", DEFAULT_DATABASE_URL
    )
    database = Database(resolved_database_url)
    database.create_tables(
        max_attempts=environment_int("DATABASE_CONNECT_MAX_ATTEMPTS", default=10),
        retry_delay_seconds=environment_int(
            "DATABASE_CONNECT_RETRY_SECONDS", default=2
        ),
    )
    store = DatabaseStore(database, seed=seed)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        yield
        database.close()

    app = FastAPI(
        title="Snake Arena API",
        version="1.0.0",
        description="Database-backed backend for Snake Arena.",
        debug=environment_flag("DEBUG"),
        lifespan=lifespan,
    )
    app.state.database = database
    app.state.store = store
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],
        allow_origin_regex=DEV_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["Authorization"],
    )

    async def http_exception_handler(
        _request: Request, exc: HTTPException
    ) -> JSONResponse:
        if isinstance(exc.detail, dict) and {"error", "message"} <= exc.detail.keys():
            content = exc.detail
        else:
            content = {"error": "http_error", "message": str(exc.detail)}
        return JSONResponse(
            status_code=exc.status_code,
            content=content,
            headers=exc.headers,
        )

    async def validation_exception_handler(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else None
        message = first.get("msg", "Invalid request") if first else "Invalid request"
        return JSONResponse(
            status_code=400,
            content={"error": "invalid_request", "message": message},
        )

    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    api = FastAPI(
        title="Snake Arena API",
        version="1.0.0",
        description="Database-backed backend for Snake Arena.",
    )
    api.state.database = database
    api.state.store = store
    api.add_exception_handler(HTTPException, http_exception_handler)
    api.add_exception_handler(RequestValidationError, validation_exception_handler)

    @api.get("/health", include_in_schema=False)
    async def health() -> dict[str, str]:
        if not database.is_ready():
            raise HTTPException(status_code=503, detail="Database is unavailable")
        return {"status": "ok"}

    api.include_router(auth.router)
    api.include_router(scores.router)
    api.include_router(games.router)
    app.mount("/api", api)

    configured_frontend = frontend_directory or os.getenv("FRONTEND_DIST")
    if configured_frontend:
        frontend_path = Path(configured_frontend)
        if not frontend_path.is_dir():
            raise RuntimeError(f"Frontend directory does not exist: {frontend_path}")
        app.frontend("/", directory=frontend_path, fallback="index.html")

    return app


app = create_app(seed=environment_flag("SEED_DATABASE"))

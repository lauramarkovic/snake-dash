import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
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


def create_app(
    *,
    seed: bool = True,
    database_url: str | None = None,
) -> FastAPI:
    resolved_database_url = database_url or os.getenv(
        "DATABASE_URL", DEFAULT_DATABASE_URL
    )
    database = Database(resolved_database_url)
    database.create_tables()
    store = DatabaseStore(database, seed=seed)

    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        yield
        database.close()

    app = FastAPI(
        title="Snake Arena API",
        version="1.0.0",
        description="Database-backed backend for Snake Arena.",
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
    api.include_router(auth.router)
    api.include_router(scores.router)
    api.include_router(games.router)
    app.mount("/api", api)

    ssr_url = os.getenv("SSR_URL", "").rstrip("/")
    if ssr_url:
        _hop_by_hop = frozenset({
            "connection", "keep-alive", "proxy-authenticate",
            "proxy-authorization", "te", "trailers",
            "transfer-encoding", "upgrade", "host",
        })

        @app.api_route("/{path:path}", methods=["GET", "HEAD"], include_in_schema=False)
        async def proxy_to_ssr(path: str, request: Request) -> Response:
            target = f"{ssr_url}/{path}"
            if request.url.query:
                target = f"{target}?{request.url.query}"
            headers = {k: v for k, v in request.headers.items()
                       if k.lower() not in _hop_by_hop}
            async with httpx.AsyncClient(timeout=30.0) as client:
                r = await client.request(method=request.method, url=target,
                                         headers=headers)
            response_headers = {k: v for k, v in r.headers.items()
                                 if k.lower() not in _hop_by_hop}
            return Response(content=r.content, status_code=r.status_code,
                            headers=response_headers)

    return app


app = create_app()

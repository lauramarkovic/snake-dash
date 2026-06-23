from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import auth, games, scores
from app.store import InMemoryStore


def create_app(*, seed: bool = True) -> FastAPI:
    app = FastAPI(
        title="Snake Arena API",
        version="1.0.0",
        description="In-memory backend for Snake Arena.",
    )
    store = InMemoryStore(seed=seed)
    app.state.store = store
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173"],
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
        description="In-memory backend for Snake Arena.",
    )
    api.state.store = store
    api.add_exception_handler(HTTPException, http_exception_handler)
    api.add_exception_handler(RequestValidationError, validation_exception_handler)
    api.include_router(auth.router)
    api.include_router(scores.router)
    api.include_router(games.router)
    app.mount("/api", api)
    return app


app = create_app()

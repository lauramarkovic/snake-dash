import asyncio
import json
from collections.abc import AsyncIterator

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Request, status
from fastapi.responses import StreamingResponse

from app.auth import CurrentUser
from app.models import ActiveGame, ErrorResponse, GameState, PublishGameResponse


router = APIRouter(prefix="/games", tags=["Games"])


def sse(event: str, data: object) -> str:
    return f"event: {event}\ndata: {json.dumps(data, separators=(',', ':'))}\n\n"


GameId = Annotated[str, Path(alias="gameId", min_length=1)]


@router.get("", response_model=list[ActiveGame], operation_id="listActiveGames")
async def list_active_games(request: Request) -> list[ActiveGame]:
    return request.app.state.store.list_games()


@router.put(
    "/current",
    response_model=PublishGameResponse,
    operation_id="publishGame",
)
async def publish_game(
    state: GameState, user: CurrentUser, request: Request
) -> PublishGameResponse:
    game_id = await request.app.state.store.publish_game(user, state)
    return PublishGameResponse(gameId=game_id)


# Static stream routes must be registered before /{game_id}.
@router.get(
    "/stream",
    response_class=StreamingResponse,
    operation_id="subscribeActiveGames",
)
async def subscribe_active_games(request: Request) -> StreamingResponse:
    async def events() -> AsyncIterator[str]:
        store = request.app.state.store
        version = store.games_version
        while True:
            games = [
                game.model_dump(by_alias=True, mode="json")
                for game in store.list_games()
            ]
            yield sse("games", games)
            try:
                version = await asyncio.wait_for(
                    store.wait_for_games_change(version), timeout=15
                )
            except TimeoutError:
                yield ": keep-alive\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get(
    "/{gameId}/stream",
    response_class=StreamingResponse,
    operation_id="subscribeGame",
)
async def subscribe_game(game_id: GameId, request: Request) -> StreamingResponse:
    async def events() -> AsyncIterator[str]:
        store = request.app.state.store
        version = store.games_version
        while True:
            game = store.games.get(game_id)
            data = game.model_dump(by_alias=True, mode="json") if game else None
            yield sse("game", data)
            try:
                version = await asyncio.wait_for(
                    store.wait_for_games_change(version), timeout=15
                )
            except TimeoutError:
                yield ": keep-alive\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get(
    "/{gameId}",
    response_model=ActiveGame,
    operation_id="getActiveGame",
    responses={404: {"model": ErrorResponse}},
)
async def get_active_game(game_id: GameId, request: Request) -> ActiveGame:
    game = request.app.state.store.games.get(game_id)
    if game is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "game_not_found", "message": "Game not found"},
        )
    return game


@router.delete(
    "/{gameId}",
    status_code=status.HTTP_204_NO_CONTENT,
    operation_id="endGame",
)
async def end_game(game_id: GameId, user: CurrentUser, request: Request) -> None:
    game = request.app.state.store.games.get(game_id)
    if game is None:
        return
    if game.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "game_forbidden",
                "message": "The active game belongs to another user",
            },
        )
    await request.app.state.store.end_game(game_id)

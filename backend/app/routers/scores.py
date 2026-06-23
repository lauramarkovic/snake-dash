from typing import Annotated

from fastapi import APIRouter, Query, Request, status

from app.auth import CurrentUser
from app.models import Mode, ScoreEntry, SubmitScoreRequest


router = APIRouter(tags=["Scores"])


@router.post(
    "/leaderboard",
    status_code=status.HTTP_201_CREATED,
    operation_id="submitScore",
)
async def submit_score(
    payload: SubmitScoreRequest, user: CurrentUser, request: Request
) -> None:
    request.app.state.store.add_score(user, payload.mode, payload.score)


@router.get(
    "/leaderboard",
    response_model=list[ScoreEntry],
    operation_id="getLeaderboard",
)
async def get_leaderboard(
    request: Request,
    mode: Mode,
    limit: Annotated[int, Query(ge=1)] = 10,
) -> list[ScoreEntry]:
    return request.app.state.store.leaderboard(mode, limit)

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class APIModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        serialize_by_alias=True,
    )


class Mode(StrEnum):
    WALLS = "walls"
    PASSTHROUGH = "passthrough"


class Direction(StrEnum):
    UP = "up"
    DOWN = "down"
    LEFT = "left"
    RIGHT = "right"


class User(APIModel):
    id: str
    username: str


class Credentials(APIModel):
    username: str = Field(min_length=1)
    password: str = Field(min_length=1)


class SubmitScoreRequest(APIModel):
    mode: Mode
    score: int = Field(ge=0, multiple_of=10)


class ScoreEntry(APIModel):
    id: str
    user_id: str = Field(alias="userId")
    username: str
    mode: Mode
    score: int = Field(ge=0)
    created_at: int = Field(alias="createdAt")


class Cell(APIModel):
    x: int = Field(ge=0)
    y: int = Field(ge=0)


class GameState(APIModel):
    mode: Mode
    width: int = Field(ge=1)
    height: int = Field(ge=1)
    snake: list[Cell] = Field(min_length=1)
    dir: Direction
    pending_dir: Direction = Field(alias="pendingDir")
    food: Cell
    score: int = Field(ge=0)
    alive: bool
    tick: int = Field(ge=0)


class ActiveGame(APIModel):
    id: str
    user_id: str = Field(alias="userId")
    username: str
    mode: Mode
    state: GameState
    updated_at: int = Field(alias="updatedAt")


class PublishGameResponse(APIModel):
    game_id: str = Field(alias="gameId")


class ErrorResponse(APIModel):
    error: str
    message: str

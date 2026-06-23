import asyncio
import time
import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.auth import create_token, hash_password, verify_password
from app.database import ActiveGameRow, Database, ScoreRow, TokenRow, UserRow
from app.models import ActiveGame, GameState, Mode, ScoreEntry, User


def now_ms() -> int:
    return int(time.time() * 1000)


class DatabaseStore:
    def __init__(self, database: Database, *, seed: bool = True) -> None:
        self.database = database
        self._games_version = 0
        self._games_changed = asyncio.Condition()
        if seed:
            self.seed()

    def seed(self) -> None:
        with self.database.session() as session:
            if session.get(UserRow, "u-demo") is not None:
                return

            session.add_all(
                [
                    UserRow(
                        id="u-demo",
                        username="demo",
                        password_hash=hash_password("demo"),
                    ),
                    UserRow(
                        id="u-ada",
                        username="ada",
                        password_hash=hash_password("ada"),
                    ),
                    UserRow(
                        id="u-lin",
                        username="lin",
                        password_hash=hash_password("snake"),
                    ),
                ]
            )
            session.flush()

            timestamp = now_ms()
            session.add_all(
                [
                    ScoreRow(
                        id="s-1",
                        user_id="u-ada",
                        mode=Mode.WALLS,
                        score=180,
                        created_at=timestamp - 60_000,
                    ),
                    ScoreRow(
                        id="s-2",
                        user_id="u-demo",
                        mode=Mode.WALLS,
                        score=120,
                        created_at=timestamp - 50_000,
                    ),
                    ScoreRow(
                        id="s-3",
                        user_id="u-lin",
                        mode=Mode.WALLS,
                        score=90,
                        created_at=timestamp - 40_000,
                    ),
                    ScoreRow(
                        id="s-4",
                        user_id="u-ada",
                        mode=Mode.PASSTHROUGH,
                        score=240,
                        created_at=timestamp - 30_000,
                    ),
                    ScoreRow(
                        id="s-5",
                        user_id="u-demo",
                        mode=Mode.PASSTHROUGH,
                        score=150,
                        created_at=timestamp - 20_000,
                    ),
                    self._seed_game_row(
                        "u-ada", Mode.PASSTHROUGH, timestamp - 1_000, 70
                    ),
                    self._seed_game_row(
                        "u-lin", Mode.WALLS, timestamp - 2_000, 40
                    ),
                ]
            )
            session.commit()

    @staticmethod
    def _seed_game_row(
        user_id: str, mode: Mode, updated_at: int, score: int
    ) -> ActiveGameRow:
        state = GameState(
            mode=mode,
            width=20,
            height=20,
            snake=[
                {"x": 10, "y": 10},
                {"x": 9, "y": 10},
                {"x": 8, "y": 10},
            ],
            dir="right",
            pendingDir="right",
            food={"x": 4, "y": 7},
            score=score,
            alive=True,
            tick=score // 10,
        )
        return ActiveGameRow(
            id=f"g-{user_id}",
            user_id=user_id,
            mode=mode,
            state=state.model_dump(by_alias=True, mode="json"),
            updated_at=updated_at,
        )

    def authenticate(self, username: str, password: str) -> User | None:
        with self.database.session() as session:
            row = session.scalar(
                select(UserRow).where(UserRow.username == username)
            )
        if row is None or not verify_password(password, row.password_hash):
            return None
        return self._user(row)

    def signup(self, username: str, password: str) -> User | None:
        row = UserRow(
            id=f"u-{uuid.uuid4().hex}",
            username=username,
            password_hash=hash_password(password),
        )
        try:
            with self.database.session() as session:
                session.add(row)
                session.commit()
        except IntegrityError:
            return None
        return self._user(row)

    def issue_token(self, user_id: str) -> str:
        token = create_token()
        with self.database.session() as session:
            session.add(TokenRow(token=token, user_id=user_id))
            session.commit()
        return token

    def revoke_token(self, token: str) -> None:
        with self.database.session() as session:
            row = session.get(TokenRow, token)
            if row is not None:
                session.delete(row)
                session.commit()

    def get_user_for_token(self, token: str) -> User | None:
        with self.database.session() as session:
            row = session.scalar(
                select(UserRow)
                .join(TokenRow, TokenRow.user_id == UserRow.id)
                .where(TokenRow.token == token)
            )
        return self._user(row) if row else None

    def add_score(self, user: User, mode: Mode, score: int) -> None:
        with self.database.session() as session:
            session.add(
                ScoreRow(
                    id=f"s-{uuid.uuid4().hex}",
                    user_id=user.id,
                    mode=mode,
                    score=score,
                    created_at=now_ms(),
                )
            )
            session.commit()

    def leaderboard(self, mode: Mode, limit: int) -> list[ScoreEntry]:
        with self.database.session() as session:
            rows = session.execute(
                select(ScoreRow, UserRow.username)
                .join(UserRow, UserRow.id == ScoreRow.user_id)
                .where(ScoreRow.mode == mode)
                .order_by(ScoreRow.score.desc(), ScoreRow.created_at)
                .limit(limit)
            ).all()
        return [
            ScoreEntry(
                id=row.id,
                userId=row.user_id,
                username=username,
                mode=row.mode,
                score=row.score,
                createdAt=row.created_at,
            )
            for row, username in rows
        ]

    def list_games(self) -> list[ActiveGame]:
        with self.database.session() as session:
            rows = session.execute(
                select(ActiveGameRow, UserRow.username)
                .join(UserRow, UserRow.id == ActiveGameRow.user_id)
                .order_by(ActiveGameRow.updated_at.desc())
            ).all()
        return [self._game(row, username) for row, username in rows]

    def get_game(self, game_id: str) -> ActiveGame | None:
        with self.database.session() as session:
            result = session.execute(
                select(ActiveGameRow, UserRow.username)
                .join(UserRow, UserRow.id == ActiveGameRow.user_id)
                .where(ActiveGameRow.id == game_id)
            ).one_or_none()
        return self._game(*result) if result else None

    async def publish_game(self, user: User, state: GameState) -> str:
        with self.database.session() as session:
            row = session.scalar(
                select(ActiveGameRow).where(ActiveGameRow.user_id == user.id)
            )
            if row is None:
                row = ActiveGameRow(
                    id=f"g-{uuid.uuid4().hex}",
                    user_id=user.id,
                    mode=state.mode,
                    state=state.model_dump(by_alias=True, mode="json"),
                    updated_at=now_ms(),
                )
                session.add(row)
            else:
                row.mode = state.mode
                row.state = state.model_dump(by_alias=True, mode="json")
                row.updated_at = now_ms()
            session.commit()
            game_id = row.id
        await self.notify_games_changed()
        return game_id

    async def end_game(self, game_id: str) -> None:
        deleted = False
        with self.database.session() as session:
            row = session.get(ActiveGameRow, game_id)
            if row is not None:
                session.delete(row)
                session.commit()
                deleted = True
        if deleted:
            await self.notify_games_changed()

    async def notify_games_changed(self) -> None:
        async with self._games_changed:
            self._games_version += 1
            self._games_changed.notify_all()

    @property
    def games_version(self) -> int:
        return self._games_version

    async def wait_for_games_change(self, version: int) -> int:
        async with self._games_changed:
            await self._games_changed.wait_for(
                lambda: self._games_version != version
            )
            return self._games_version

    @staticmethod
    def _user(row: UserRow) -> User:
        return User(id=row.id, username=row.username)

    @staticmethod
    def _game(row: ActiveGameRow, username: str) -> ActiveGame:
        return ActiveGame(
            id=row.id,
            userId=row.user_id,
            username=username,
            mode=row.mode,
            state=GameState.model_validate(row.state),
            updatedAt=row.updated_at,
        )

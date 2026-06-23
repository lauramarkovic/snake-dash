import asyncio
import time
import uuid
from dataclasses import dataclass

from app.auth import create_token, hash_password, verify_password
from app.models import ActiveGame, GameState, Mode, ScoreEntry, User


def now_ms() -> int:
    return int(time.time() * 1000)


@dataclass(slots=True)
class UserRecord:
    user: User
    password_hash: str


class InMemoryStore:
    def __init__(self, *, seed: bool = True) -> None:
        self.users: dict[str, UserRecord] = {}
        self.user_ids_by_name: dict[str, str] = {}
        self.tokens: dict[str, str] = {}
        self.scores: list[ScoreEntry] = []
        self.games: dict[str, ActiveGame] = {}
        self.game_ids_by_user: dict[str, str] = {}
        self._games_version = 0
        self._games_changed = asyncio.Condition()
        if seed:
            self.seed()

    def seed(self) -> None:
        demo = self._add_user("u-demo", "demo", "demo")
        ada = self._add_user("u-ada", "ada", "ada")
        lin = self._add_user("u-lin", "lin", "snake")
        timestamp = now_ms()
        self.scores.extend(
            [
                ScoreEntry(id="s-1", userId=ada.id, username=ada.username, mode=Mode.WALLS, score=180, createdAt=timestamp - 60_000),
                ScoreEntry(id="s-2", userId=demo.id, username=demo.username, mode=Mode.WALLS, score=120, createdAt=timestamp - 50_000),
                ScoreEntry(id="s-3", userId=lin.id, username=lin.username, mode=Mode.WALLS, score=90, createdAt=timestamp - 40_000),
                ScoreEntry(id="s-4", userId=ada.id, username=ada.username, mode=Mode.PASSTHROUGH, score=240, createdAt=timestamp - 30_000),
                ScoreEntry(id="s-5", userId=demo.id, username=demo.username, mode=Mode.PASSTHROUGH, score=150, createdAt=timestamp - 20_000),
            ]
        )
        self._seed_game(ada, Mode.PASSTHROUGH, timestamp - 1_000, 70)
        self._seed_game(lin, Mode.WALLS, timestamp - 2_000, 40)

    def _add_user(self, user_id: str, username: str, password: str) -> User:
        user = User(id=user_id, username=username)
        self.users[user_id] = UserRecord(user, hash_password(password))
        self.user_ids_by_name[username] = user_id
        return user

    def _seed_game(
        self, user: User, mode: Mode, updated_at: int, score: int
    ) -> None:
        game_id = f"g-{user.id}"
        game = ActiveGame(
            id=game_id,
            userId=user.id,
            username=user.username,
            mode=mode,
            state=GameState(
                mode=mode,
                width=20,
                height=20,
                snake=[{"x": 10, "y": 10}, {"x": 9, "y": 10}, {"x": 8, "y": 10}],
                dir="right",
                pendingDir="right",
                food={"x": 4, "y": 7},
                score=score,
                alive=True,
                tick=score // 10,
            ),
            updatedAt=updated_at,
        )
        self.games[game_id] = game
        self.game_ids_by_user[user.id] = game_id

    def authenticate(self, username: str, password: str) -> User | None:
        user_id = self.user_ids_by_name.get(username)
        record = self.users.get(user_id) if user_id else None
        if record is None or not verify_password(password, record.password_hash):
            return None
        return record.user

    def signup(self, username: str, password: str) -> User | None:
        if username in self.user_ids_by_name:
            return None
        return self._add_user(f"u-{uuid.uuid4().hex}", username, password)

    def issue_token(self, user_id: str) -> str:
        token = create_token()
        self.tokens[token] = user_id
        return token

    def revoke_token(self, token: str) -> None:
        self.tokens.pop(token, None)

    def get_user_for_token(self, token: str) -> User | None:
        user_id = self.tokens.get(token)
        record = self.users.get(user_id) if user_id else None
        return record.user if record else None

    def add_score(self, user: User, mode: Mode, score: int) -> None:
        self.scores.append(
            ScoreEntry(
                id=f"s-{uuid.uuid4().hex}",
                userId=user.id,
                username=user.username,
                mode=mode,
                score=score,
                createdAt=now_ms(),
            )
        )

    def leaderboard(self, mode: Mode, limit: int) -> list[ScoreEntry]:
        matching = (score for score in self.scores if score.mode == mode)
        return sorted(
            matching, key=lambda score: (-score.score, score.created_at)
        )[:limit]

    def list_games(self) -> list[ActiveGame]:
        return sorted(
            self.games.values(), key=lambda game: game.updated_at, reverse=True
        )

    async def publish_game(self, user: User, state: GameState) -> str:
        game_id = self.game_ids_by_user.get(user.id) or f"g-{uuid.uuid4().hex}"
        self.games[game_id] = ActiveGame(
            id=game_id,
            userId=user.id,
            username=user.username,
            mode=state.mode,
            state=state,
            updatedAt=now_ms(),
        )
        self.game_ids_by_user[user.id] = game_id
        await self.notify_games_changed()
        return game_id

    async def end_game(self, game_id: str) -> None:
        game = self.games.pop(game_id, None)
        if game:
            self.game_ids_by_user.pop(game.user_id, None)
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

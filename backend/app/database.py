import time
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import JSON, BigInteger, ForeignKey, Integer, String, create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.engine.url import make_url
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    Session,
    mapped_column,
    sessionmaker,
)
from sqlalchemy.pool import StaticPool


DEFAULT_DATABASE_URL = "sqlite:///./snake_dash.db"


def normalize_database_url(database_url: str) -> str:
    """Use the installed Psycopg 3 driver for provider-supplied Postgres URLs."""
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


class Base(DeclarativeBase):
    pass


class UserRow(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))


class TokenRow(Base):
    __tablename__ = "tokens"

    token: Mapped[str] = mapped_column(String(255), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )


class ScoreRow(Base):
    __tablename__ = "scores"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    mode: Mapped[str] = mapped_column(String(32), index=True)
    score: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[int] = mapped_column(BigInteger, index=True)


class ActiveGameRow(Base):
    __tablename__ = "active_games"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    mode: Mapped[str] = mapped_column(String(32), index=True)
    state: Mapped[dict[str, object]] = mapped_column(JSON)
    updated_at: Mapped[int] = mapped_column(BigInteger, index=True)


def create_database_engine(database_url: str) -> Engine:
    database_url = normalize_database_url(database_url)
    options: dict[str, object] = {}
    url = make_url(database_url)
    if url.get_backend_name() == "sqlite":
        options["connect_args"] = {"check_same_thread": False}
        if url.database in {None, "", ":memory:"}:
            options["poolclass"] = StaticPool
    return create_engine(database_url, **options)


class Database:
    def __init__(self, database_url: str) -> None:
        self.engine = create_database_engine(database_url)
        self.session_factory = sessionmaker(
            bind=self.engine,
            class_=Session,
            expire_on_commit=False,
        )

    def create_tables(
        self, *, max_attempts: int = 1, retry_delay_seconds: float = 1
    ) -> None:
        for attempt in range(1, max_attempts + 1):
            try:
                Base.metadata.create_all(self.engine)
                return
            except OperationalError:
                if attempt == max_attempts:
                    raise
                time.sleep(retry_delay_seconds)

    def is_ready(self) -> bool:
        try:
            with self.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return True
        except SQLAlchemyError:
            return False

    @contextmanager
    def session(self) -> Iterator[Session]:
        with self.session_factory() as session:
            yield session

    def close(self) -> None:
        self.engine.dispose()

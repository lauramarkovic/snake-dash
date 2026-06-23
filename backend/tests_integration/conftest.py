from collections.abc import Iterator

from fastapi.testclient import TestClient
from pytest import fixture

from app.main import create_app


@fixture
def client(tmp_path) -> Iterator[TestClient]:
    database_url = f"sqlite:///{tmp_path / 'integration.db'}"
    with TestClient(
        create_app(database_url=database_url, seed=False)
    ) as test_client:
        yield test_client

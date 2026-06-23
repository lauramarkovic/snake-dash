from fastapi.testclient import TestClient
from pytest import fixture

from app.main import create_app


@fixture
def database_url(tmp_path) -> str:
    return f"sqlite:///{tmp_path / 'test.db'}"


@fixture
def client(database_url: str) -> TestClient:
    with TestClient(create_app(database_url=database_url)) as test_client:
        yield test_client


@fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/login", json={"username": "demo", "password": "demo"}
    )
    token = response.headers["authorization"].removeprefix("Bearer ")
    return {"Authorization": f"Bearer {token}"}

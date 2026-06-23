from fastapi.testclient import TestClient
from pytest import fixture

from app.main import create_app


@fixture
def client() -> TestClient:
    with TestClient(create_app()) as test_client:
        yield test_client


@fixture
def auth_headers(client: TestClient) -> dict[str, str]:
    response = client.post(
        "/api/auth/login", json={"username": "demo", "password": "demo"}
    )
    token = response.headers["authorization"].removeprefix("Bearer ")
    return {"Authorization": f"Bearer {token}"}

from fastapi.testclient import TestClient

from app.main import create_app


def test_data_persists_across_app_instances(database_url):
    with TestClient(create_app(database_url=database_url)) as first_client:
        signup = first_client.post(
            "/api/auth/signup",
            json={"username": "persistent-player", "password": "secret"},
        )
        assert signup.status_code == 201

    with TestClient(create_app(database_url=database_url)) as second_client:
        login = second_client.post(
            "/api/auth/login",
            json={"username": "persistent-player", "password": "secret"},
        )
        assert login.status_code == 200


def test_database_url_environment_variable(monkeypatch, tmp_path):
    database_path = tmp_path / "configured.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path}")

    with TestClient(create_app(seed=False)):
        pass

    assert database_path.exists()

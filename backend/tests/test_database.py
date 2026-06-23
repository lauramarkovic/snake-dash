from fastapi.testclient import TestClient
from sqlalchemy import BigInteger

from app.database import ActiveGameRow, ScoreRow, normalize_database_url
from app.main import create_app


def test_millisecond_timestamp_columns_use_big_integers():
    assert isinstance(ScoreRow.__table__.c.created_at.type, BigInteger)
    assert isinstance(ActiveGameRow.__table__.c.updated_at.type, BigInteger)


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


def test_provider_postgres_urls_use_psycopg_driver():
    assert (
        normalize_database_url("postgresql://user:password@host:5432/database")
        == "postgresql+psycopg://user:password@host:5432/database"
    )
    assert (
        normalize_database_url("postgres://user:password@host:5432/database")
        == "postgresql+psycopg://user:password@host:5432/database"
    )


def test_explicit_database_driver_is_preserved():
    database_url = "postgresql+psycopg://user:password@host:5432/database"
    assert normalize_database_url(database_url) == database_url


def test_health_endpoint_checks_database(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

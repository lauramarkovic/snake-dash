def preflight(client, origin: str):
    return client.options(
        "/api/auth/login",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )


def test_login_preflight_allows_local_development_origins(client):
    for origin in (
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3001",
    ):
        response = preflight(client, origin)

        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == origin


def test_login_preflight_allows_codespaces_origin(client):
    origin = "https://example-snake-dash-5173.app.github.dev"

    response = preflight(client, origin)

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == origin


def test_login_preflight_rejects_untrusted_origin(client):
    response = preflight(client, "https://example.com")

    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers

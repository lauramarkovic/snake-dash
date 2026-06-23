def test_login_returns_user_and_bearer_token(client):
    response = client.post(
        "/api/auth/login", json={"username": "demo", "password": "demo"}
    )

    assert response.status_code == 200
    assert response.json() == {"id": "u-demo", "username": "demo"}
    assert response.headers["authorization"].startswith("Bearer ")
    assert response.cookies["snake_session"]


def test_invalid_login_uses_contract_error_shape(client):
    response = client.post(
        "/api/auth/login", json={"username": "demo", "password": "wrong"}
    )

    assert response.status_code == 401
    assert response.json() == {
        "error": "invalid_credentials",
        "message": "Invalid username or password",
    }


def test_signup_hashes_password_and_authenticates_user(client):
    response = client.post(
        "/api/auth/signup", json={"username": "new-player", "password": "secret"}
    )
    assert response.status_code == 201
    user_id = response.json()["id"]
    record = client.app.state.store.users[user_id]
    assert record.password_hash != "secret"
    assert record.password_hash.startswith("scrypt$")

    login = client.post(
        "/api/auth/login", json={"username": "new-player", "password": "secret"}
    )
    assert login.status_code == 200


def test_me_and_logout_support_bearer_auth(client):
    login = client.post(
        "/api/auth/login", json={"username": "demo", "password": "demo"}
    )
    token = login.headers["authorization"]
    client.cookies.clear()

    assert client.get(
        "/api/auth/me", headers={"Authorization": token}
    ).json() == {"id": "u-demo", "username": "demo"}
    assert client.post(
        "/api/auth/logout", headers={"Authorization": token}
    ).status_code == 204
    assert client.get(
        "/api/auth/me", headers={"Authorization": token}
    ).status_code == 401


def test_me_requires_authentication(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["error"] == "not_authenticated"


def test_duplicate_signup_is_conflict(client):
    response = client.post(
        "/api/auth/signup", json={"username": "demo", "password": "anything"}
    )
    assert response.status_code == 409
    assert response.json()["error"] == "username_taken"

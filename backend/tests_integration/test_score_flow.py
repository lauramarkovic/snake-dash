from fastapi.testclient import TestClient


def test_user_can_sign_up_log_in_submit_score_and_read_leaderboard(
    client: TestClient,
) -> None:
    credentials = {
        "username": "integration-player",
        "password": "integration-secret",
    }

    signup = client.post("/api/auth/signup", json=credentials)

    assert signup.status_code == 201
    user = signup.json()
    assert user["username"] == credentials["username"]

    client.cookies.clear()
    login = client.post("/api/auth/login", json=credentials)

    assert login.status_code == 200
    assert login.json() == user
    authorization = login.headers["authorization"]
    assert authorization.startswith("Bearer ")

    submitted = client.post(
        "/api/leaderboard",
        headers={"Authorization": authorization},
        json={"mode": "walls", "score": 420},
    )

    assert submitted.status_code == 201

    leaderboard = client.get(
        "/api/leaderboard",
        params={"mode": "walls"},
    )

    assert leaderboard.status_code == 200
    entries = leaderboard.json()
    assert len(entries) == 1
    assert entries[0]["userId"] == user["id"]
    assert entries[0]["username"] == credentials["username"]
    assert entries[0]["mode"] == "walls"
    assert entries[0]["score"] == 420
    assert entries[0]["id"].startswith("s-")
    assert isinstance(entries[0]["createdAt"], int)

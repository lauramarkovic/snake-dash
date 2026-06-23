def test_seeded_leaderboard_is_filtered_sorted_and_limited(client):
    response = client.get("/api/leaderboard?mode=walls&limit=2")

    assert response.status_code == 200
    entries = response.json()
    assert [entry["score"] for entry in entries] == [180, 120]
    assert all(entry["mode"] == "walls" for entry in entries)


def test_submit_score_requires_authentication(client):
    response = client.post(
        "/api/leaderboard", json={"mode": "walls", "score": 100}
    )
    assert response.status_code == 401
    assert response.json()["error"] == "not_authenticated"


def test_submit_score_appears_on_leaderboard(client, auth_headers):
    response = client.post(
        "/api/leaderboard",
        headers=auth_headers,
        json={"mode": "walls", "score": 500},
    )
    assert response.status_code == 201

    leaderboard = client.get("/api/leaderboard?mode=walls").json()
    assert leaderboard[0]["score"] == 500
    assert leaderboard[0]["username"] == "demo"


def test_invalid_score_returns_bad_request(client, auth_headers):
    response = client.post(
        "/api/leaderboard",
        headers=auth_headers,
        json={"mode": "walls", "score": 15},
    )
    assert response.status_code == 400
    assert response.json()["error"] == "invalid_request"

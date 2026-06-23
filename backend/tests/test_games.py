GAME_STATE = {
    "mode": "walls",
    "width": 20,
    "height": 20,
    "snake": [{"x": 10, "y": 10}, {"x": 9, "y": 10}],
    "dir": "right",
    "pendingDir": "right",
    "food": {"x": 4, "y": 7},
    "score": 20,
    "alive": True,
    "tick": 2,
}


def test_active_games_are_seeded_and_sorted(client):
    response = client.get("/api/games")

    assert response.status_code == 200
    games = response.json()
    assert len(games) >= 2
    assert games[0]["updatedAt"] >= games[1]["updatedAt"]


def test_publish_updates_same_game_for_user(client, auth_headers):
    first = client.put(
        "/api/games/current", headers=auth_headers, json=GAME_STATE
    )
    second_state = {**GAME_STATE, "score": 30, "tick": 3}
    second = client.put(
        "/api/games/current", headers=auth_headers, json=second_state
    )

    assert first.status_code == 200
    assert first.json()["gameId"] == second.json()["gameId"]
    game = client.get(f"/api/games/{first.json()['gameId']}").json()
    assert game["state"]["score"] == 30


def test_user_can_end_own_game_idempotently(client, auth_headers):
    game_id = client.put(
        "/api/games/current", headers=auth_headers, json=GAME_STATE
    ).json()["gameId"]

    assert client.delete(
        f"/api/games/{game_id}", headers=auth_headers
    ).status_code == 204
    assert client.delete(
        f"/api/games/{game_id}", headers=auth_headers
    ).status_code == 204
    assert client.get(f"/api/games/{game_id}").status_code == 404


def test_user_cannot_end_another_users_game(client, auth_headers):
    response = client.delete("/api/games/g-u-ada", headers=auth_headers)
    assert response.status_code == 403
    assert response.json()["error"] == "game_forbidden"


def test_publish_rejects_out_of_bounds_schema_values(client, auth_headers):
    invalid = {**GAME_STATE, "width": 0}
    response = client.put(
        "/api/games/current", headers=auth_headers, json=invalid
    )
    assert response.status_code == 400

from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def test_frontend_serves_assets_and_spa_routes(tmp_path: Path):
    (tmp_path / "index.html").write_text("<h1>Snake Arena</h1>")
    (tmp_path / "app.js").write_text("console.log('snake')")

    app = create_app(
        seed=False,
        database_url="sqlite://",
        frontend_directory=tmp_path,
    )

    with TestClient(app) as client:
        route_response = client.get("/play", headers={"Accept": "text/html"})
        asset_response = client.get("/app.js")

    assert route_response.status_code == 200
    assert route_response.text == "<h1>Snake Arena</h1>"
    assert asset_response.status_code == 200
    assert asset_response.text == "console.log('snake')"

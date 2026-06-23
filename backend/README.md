# Snake Arena backend

FastAPI implementation of `../openapi.yaml` using SQLAlchemy. SQLite is used
by default, while the data layer remains portable to other SQL databases.

## Run

```bash
uv sync
uv run uvicorn main:app --reload
```

Set `DATABASE_URL` to choose the database. The default is:

```text
sqlite:///./snake_dash.db
```

For example:

```bash
DATABASE_URL=sqlite:///./local.db uv run uvicorn main:app --reload
```

The API is served under `http://localhost:8000/api`. Interactive docs for the
mounted API are available at `http://localhost:8000/api/docs`.

Primary endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/leaderboard`
- `POST /api/leaderboard`
- `GET /api/games/active`

Seeded credentials:

- `demo` / `demo`
- `ada` / `ada`
- `lin` / `snake`

Login and signup return an opaque bearer token in the `Authorization` response
header and set the `snake_session` cookie. Send the token on protected routes:

```text
Authorization: Bearer <token>
```

## Test

```bash
uv run pytest
```

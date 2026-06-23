# Deploying Snake Dash to Railway

Railway runs this repository as two services:

- an application service built from `backend/Dockerfile`
- a managed PostgreSQL service

The checked-in `railway.json` selects the Dockerfile and configures
`/api/health` as the deployment health check. The container listens on
Railway's injected `PORT`.

## Create the services

1. Push this repository to GitHub.
2. In Railway, create an empty project.
3. Add a PostgreSQL database to the project.
4. Add an application service from the GitHub repository.
5. In the application service's **Variables** tab, add a reference variable
   named `DATABASE_URL` that references the PostgreSQL service's
   `DATABASE_URL`.
6. In the application service's **Settings > Networking** section, generate a
   public domain.

No Railway volume is required for the application. Railway manages the
PostgreSQL service's persistent storage.

## Application variables

The only required application variable is:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

If the database service has a name other than `Postgres`, Railway will generate
the corresponding reference through its variable picker.

Optional variables:

```text
DEBUG=false
SEED_DATABASE=false
DATABASE_CONNECT_MAX_ATTEMPTS=10
DATABASE_CONNECT_RETRY_SECONDS=2
```

Keep `SEED_DATABASE` disabled in production. Enabling it creates the demo
accounts listed in `backend/README.md`.

## Verify the deployment

After Railway reports the deployment as healthy, replace `<domain>` with the
generated domain:

```bash
curl --fail https://<domain>/api/health
```

The expected response is:

```json
{"status":"ok"}
```

Opening `https://<domain>` should load the frontend. Both the frontend and API
are served by the same application service, so no production CORS or separate
frontend URL configuration is required.

## Database schema changes

The application currently creates missing tables at startup through SQLAlchemy.
That is sufficient for the current schema, but it does not alter existing
columns. Add a migration tool such as Alembic before making schema changes to a
production database.

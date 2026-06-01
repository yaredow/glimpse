# AGENTS.md — glimpse/api

Go backend for a movie recommendation app. Module `github.com/yaredow/glimpse-api`, Go 1.26.3.

## Commands

```sh
make run/api          # docker compose up -d + air live-reload (builds cmd/api)
make tidy             # go fmt ./... → go mod tidy → go mod verify → go mod vendor
make audit            # go mod tidy -diff → go mod verify → go vet ./... → staticcheck ./... → go test -race -vet=off ./...
make db/migration/new name=xxx   # create seq SQL migration in migrations/
make db/migration/up             # apply pending migrations (prompts confirm)
make db/migration/down           # roll back 1 migration (prompts confirm)
make docker/db/shell             # psql into the db container
make db/psql                     # psql via DB_DSN directly
```

## Key structure

| Path | Role |
|---|---|
| `cmd/api/main.go` | Entrypoint — loads .env, flags, slog, migrations, pgxpool, server |
| `internal/server/` | chi router + middleware + `Serve()` |
| `internal/data/` | pgxpool config (`db.go`), migration runner (`migrate.go`) |
| `internal/data/queries/` | sqlc-generated Go code (pgx/v5) |
| `internal/data/sql/` | sqlc source `.sql` files |
| `internal/httputil/` | JSON read/write helpers, error responses |
| `internal/health/` | `GET /v1/healthcheck` |
| `internal/users/` | `POST /v1/users/register` |
| `migrations/` | SQL migrations (golang-migrate, pgx v5 driver) |

## sqlc

Config in `sqlc.yaml`: source `internal/data/sql/`, schema `migrations/`, output `internal/data/queries/`. After editing `.sql` files:

```sh
sqlc generate
```

## DB & migrations

- Postgres 18 via Docker Compose (`compose.yaml`). `.env` supplies creds.
- Pool: 25 max / 5 min conns, 1h lifetime, 15m idle timeout.
- Migration DSN uses `pgx5://` scheme (converted from `postgres://` in `main.go`).

## Patterns

- Handlers live in feature packages (`internal/health/`, `internal/users/`) — struct embedding `*httputil.Helper`, explicit deps via constructor.
- JSON envelope: `httputil.Envelope` (`map[string]any`), `WriteJSON`, `ReadJSON` (1 MB limit, unknown fields rejected, trailing data rejected).
- Error responses: `ServerErrorResponse`, `BadRequestResponse`, `NotFoundResponse`, `MethodNotAllowedResponse`.
- `version` var (`"1.0.0"`) in `internal/server/server.go` and `internal/health/handler.go` — intended for ldflags, not wired yet.
- `.env` loaded but flag/env defaults take precedence.
- No tests, no auth middleware, no context-scoped values yet.

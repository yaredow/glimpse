-include .env
export

.PHONY: help
help:
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'

## run/api: ensure Postgres is up and run API with live reload
.PHONY: run/api
run/api:
	devenv up -d
	air

## db/psql: connect to the database with psql
.PHONY: db/psql
db/psql:
	psql "${DB_DSN}"

## db/migration/new: create a new SQL migration file (e.g. make db/migration/new name=add_users)
.PHONY: db/migration/new
db/migration/new:
	@echo "Creating a migration file for ${name}..."
	migrate create -seq -ext=.sql -dir=./migrations ${name}

## db/migration/up: apply all pending migrations
.PHONY: db/migration/up
db/migration/up:
	@echo "Running up migrations..."
	migrate -path ./migrations -database ${DB_DSN} up

## db/migration/down: roll back the most recent migration
.PHONY: db/migration/down
db/migration/down:
	@echo "Running down migrations..."
	migrate -path ./migrations -database ${DB_DSN} down 1

## demo/reset: clear nightly state for a demo user (e.g. make demo/reset email=demo@example.com)
.PHONY: demo/reset
demo/reset:
	@test -n "${email}" || (echo "usage: make demo/reset email=demo@example.com" && exit 1)
	@echo "Resetting demo state for ${email}..."
	psql "${DB_DSN}" -v ON_ERROR_STOP=1 -v email="${email}" -f ./scripts/reset_demo_state.sql

## tidy: format code and tidy/verify Go modules
.PHONY: tidy
tidy:
	@echo 'Formatting .go files...'
	go fmt ./...
	@echo 'Tidying module dependencies...'
	go mod tidy
	go mod verify
	go mod vendor

## audit: run dependency, lint, and test checks
.PHONY: audit
audit:
	@echo 'Checking module dependencies...'
	go mod tidy -diff
	go mod verify
	@echo 'Vetting code...'
	go vet ./...
	staticcheck ./...
	@echo 'Running tests...'
	go test -race -vet=off ./...

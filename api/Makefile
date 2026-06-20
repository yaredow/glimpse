-include .env
export

# ==================================================================================== #
# HELPERS
# ==================================================================================== #

## help: show available make targets
.PHONY: help
help:
	@echo "Usage:"
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' | sed -e 's/^/ /'

.PHONY: confirm
confirm:
	@echo "Are you sure? [y/N]" && read ans && [ $${ans: -N} = y ]


# ==================================================================================== #
# DOCKER
# ==================================================================================== #

## docker/up: start Docker services in detached mode
.PHONY: docker/up
docker/up:
		docker compose up -d

## docker/down: stop and remove Docker services
.PHONY: docker/down
docker/down:
		docker compose down

## docker/db/shell: open a psql shell in the db container
.PHONY: docker/db/shell
docker/db/shell:
		docker compose exec db psql -U ${DB_USER} -d ${DB_NAME}


# ==================================================================================== #
# DEVELOPMENT
# ==================================================================================== #

## run/api: run API with live reload (installs air if missing)
.PHONY: run/api
run/api: docker/up
	@if ! command -v air > /dev/null; then \
		echo "Installing Air..."; \
		go install github.com/air-verse/air@latest; \
	fi
	air

## db/psql: connect to the database with psql
.PHONY: db/psql
db/psql:
	psql ${DB_DSN}

## db/migration/new: create a new SQL migration file
.PHONY: db/migration/new
db/migration/new:
	@echo "Creating a migration file for ${name}"
	migrate create -seq -ext=.sql -dir=./migrations ${name}

## db/migration/up: apply all pending up migrations
.PHONY: db/migration/up
db/migration/up: confirm
	@echo "Running up migrations..."
	migrate -path ./migrations -database ${DB_DSN} up

## db/migration/down: roll back the most recent migration
.PHONY: db/migration/down
db/migration/down: confirm
	@echo "Running down migrations..."
	migrate -path ./migrations -database ${DB_DSN} down 1

## sqlc/generate: generate Go code from SQL queries
.PHONY: sqlc/generate
sqlc/generate:
	@echo 'Generating Go code from SQL...'
	sqlc generate

# ==================================================================================== #
# QUALITY CONTROL
# ==================================================================================== #

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

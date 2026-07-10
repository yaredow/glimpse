CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS genres (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_pools (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id        BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    slot_number     INT NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
    is_revealed     BOOLEAN NOT NULL DEFAULT FALSE,
    grid_session_id UUID NOT NULL DEFAULT gen_random_uuid(),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, slot_number)
);

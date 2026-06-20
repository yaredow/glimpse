CREATE TABLE users (
    id bigserial PRIMARY KEY,
    username text NOT NULL UNIQUE,
    email text NOT NULL UNIQUE,
    password_hash bytea NOT NULL,
    shuffles_remaining int NOT NULL DEFAULT 3,
    last_shuffle_reset timestamp with time zone NOT NULL DEFAULT NOW(),
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);


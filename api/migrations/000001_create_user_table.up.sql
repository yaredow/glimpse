CREATE TABLE users (
    id bigserial PRIMARY KEY,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    name text NOT NULL,
    activated bool NOT NULL DEFAULT FALSE,
    suspended_at timestamptz,
    onboarded bool NOT NULL DEFAULT FALSE,
    skips_remaining integer NOT NULL DEFAULT 3,
    syncs_remaining integer NOT NULL DEFAULT 3,
    last_reset_at timestamptz NOT NULL DEFAULT now(),
    version integer NOT NULL DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);


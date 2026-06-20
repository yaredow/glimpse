CREATE TABLE daily_pools (
    id bigserial PRIMARY KEY,
    user_id bigint REFERENCES users (id) ON DELETE CASCADE,
    movie_id bigint REFERENCES movies (id) ON DELETE CASCADE,
    slot_number int NOT NULL, -- 1 to 5
    is_revealed boolean NOT NULL DEFAULT FALSE, -- Flips to true when they tap to unblur
    assigned_at timestamp with time zone NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, slot_number) -- Ensures a user only ever has 5 slots max active
);


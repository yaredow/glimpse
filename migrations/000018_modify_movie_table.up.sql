ALTER TABLE movies
    ALTER COLUMN original_title DROP NOT NULL,
    ALTER COLUMN full_synopsis DROP NOT NULL,
    ALTER COLUMN runtime DROP NOT NULL,
    ALTER COLUMN vote_count DROP NOT NULL,
    ADD COLUMN tagline text,
    ADD COLUMN director text,
    ADD COLUMN cast_members jsonb,
    ADD COLUMN trailer_key text,
    ADD COLUMN spoken_languages text[],
    ADD COLUMN production_countries text[],
    ADD COLUMN detail_synced_at timestamp with time zone;


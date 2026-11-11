ALTER TABLE user_interactions ADD COLUMN rating SMALLINT;

ALTER TABLE user_interactions
    ADD CONSTRAINT user_interactions_rating_check
    CHECK (
        rating IS NULL
        OR (rating BETWEEN 1 AND 5 AND action = 'watched')
    );

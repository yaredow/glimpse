ALTER TABLE user_interactions
    DROP CONSTRAINT IF EXISTS user_interactions_rating_check;

ALTER TABLE user_interactions DROP COLUMN IF EXISTS rating;

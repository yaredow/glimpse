ALTER TABLE user_preferences
ADD COLUMN min_year integer NOT NULL DEFAULT 1888,
ADD COLUMN max_year integer NOT NULL DEFAULT 2100;

package domain

type MovieReview struct {
	ID        string   `json:"id"`
	Author    string   `json:"author"`
	Rating    *float64 `json:"rating,omitempty"`
	Content   string   `json:"content"`
	CreatedAt string   `json:"created_at"`
	URL       string   `json:"url"`
}

type MovieReviewsResponse struct {
	MovieID int64         `json:"movie_id"`
	Reviews []MovieReview `json:"reviews"`
}


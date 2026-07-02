package domain

import "time"

type Affinity struct {
	UserID      int64     `json:"-"`
	Dimension   string    `json:"dimension"`
	Value       string    `json:"value"`
	Score       float64   `json:"score"`
	Confidence  float64   `json:"confidence"`
	LastUpdated time.Time `json:"last_updated"`
}

package entity

import "time"

type UserAffinity struct {
	UserID      int64
	Dimension   string
	Value       string
	Score       float64
	Confidence  float64
	LastUpdated time.Time
}

type Dimension struct {
	Name  string
	Value string
}

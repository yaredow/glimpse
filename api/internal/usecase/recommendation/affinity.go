package recusecase

import "github.com/yaredow/glimpse-api/internal/entity"

type ActionWeight struct {
	Delta             float64
	AffectExploration bool
}

var ActionWeights = map[string]ActionWeight{
	"watched":       {Delta: 2.0, AffectExploration: true},
	"watchlist_add": {Delta: 1.5, AffectExploration: true},
	"revealed":      {Delta: 0.3, AffectExploration: false},
	"skipped":       {Delta: -0.5, AffectExploration: true},
}

func ValidActions() []string {
	keys := make([]string, 0, len(ActionWeights))
	for k := range ActionWeights {
		keys = append(keys, k)
	}
	return keys
}

func ValidateInteractionInput(v *entity.Validator, movieID int64, action, gridSessionID string, gridPosition *int) {
	v.Check(movieID != 0, "movie_id", "must be provided")
	v.Check(action != "", "action", "must be provided")

	if action != "" {
		_, ok := ActionWeights[action]
		v.Check(ok, "action", "must be one of: revealed, watched, skipped, watchlist_add")
	}

	v.Check(gridSessionID != "", "grid_session_id", "must be provided")

	if gridPosition != nil {
		v.Check(*gridPosition >= 0 && *gridPosition <= 4, "grid_position", "must be between 0 and 4")
	}
}

func getActionWeight(action string) (ActionWeight, bool) {
	w, ok := ActionWeights[action]
	return w, ok
}

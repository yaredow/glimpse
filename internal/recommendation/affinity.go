package recommendation

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

func getActionWeight(action string) (ActionWeight, bool) {
	w, ok := ActionWeights[action]
	return w, ok
}

package service_test

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/service"
)

func TestGetMoodFilter(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name        string
		mood        string
		expectNil   bool
		wantGenres  []string
		wantMinYear int
		wantMaxYear int
	}{
		{
			name:      "surprise returns nil",
			mood:      "surprise",
			expectNil: true,
		},
		{
			name:      "empty returns nil",
			mood:      "",
			expectNil: true,
		},
		{
			name:      "unknown returns nil",
			mood:      "unknown_mood",
			expectNil: true,
		},
		{
			name:       "spooky returns horror thriller mystery",
			mood:       "spooky",
			wantGenres: []string{"Horror", "Thriller", "Mystery"},
		},
		{
			name:       "mind_bender returns sci-fi mystery thriller",
			mood:       "mind_bender",
			wantGenres: []string{"Science Fiction", "Mystery", "Thriller"},
		},
		{
			name:       "feel_good returns comedy animation family romance",
			mood:       "feel_good",
			wantGenres: []string{"Comedy", "Animation", "Family", "Romance"},
		},
		{
			name:       "adrenaline returns action adventure crime",
			mood:       "adrenaline",
			wantGenres: []string{"Action", "Adventure", "Crime"},
		},
		{
			name:        "nostalgia returns 1975 to 1999",
			mood:        "nostalgia",
			wantMinYear: 1975,
			wantMaxYear: 1999,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			filter := service.GetMoodFilter(tc.mood)
			if tc.expectNil {
				require.Nil(t, filter)
				return
			}

			require.NotNil(t, filter)
			if len(tc.wantGenres) > 0 {
				require.Equal(t, tc.wantGenres, filter.Genres)
				require.Nil(t, filter.MinDate)
				require.Nil(t, filter.MaxDate)
			}
			if tc.wantMinYear > 0 {
				require.Empty(t, filter.Genres)
				require.NotNil(t, filter.MinDate)
				require.NotNil(t, filter.MaxDate)
				require.Equal(t, tc.wantMinYear, filter.MinDate.Year())
				require.Equal(t, time.Month(1), filter.MinDate.Month())
				require.Equal(t, tc.wantMaxYear, filter.MaxDate.Year())
				require.Equal(t, time.Month(12), filter.MaxDate.Month())
			}
		})
	}
}

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
		name              string
		mood              string
		expectNil         bool
		wantRequiredGenre string
		wantAnyGenres     []string
		wantAllGenres     []string
		wantMinYear       int
		wantMaxYear       int
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
			name:              "horror returns required Horror",
			mood:              "horror",
			wantRequiredGenre: "Horror",
		},
		{
			name:              "spooky alias returns required Horror",
			mood:              "spooky",
			wantRequiredGenre: "Horror",
		},
		{
			name:          "action_crime returns action crime",
			mood:          "action_crime",
			wantAnyGenres: []string{"Action", "Crime"},
		},
		{
			name:          "psychological returns mystery and sci-fi thriller",
			mood:          "psychological",
			wantAnyGenres: []string{"Mystery"},
			wantAllGenres: []string{"Science Fiction", "Thriller"},
		},
		{
			name:              "comedy returns required Comedy",
			mood:              "comedy",
			wantRequiredGenre: "Comedy",
		},
		{
			name:        "classics returns 1975 to 1999",
			mood:        "classics",
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
			if tc.wantRequiredGenre != "" {
				require.NotNil(t, filter.RequiredGenre)
				require.Equal(t, tc.wantRequiredGenre, *filter.RequiredGenre)
			}
			if len(tc.wantAnyGenres) > 0 {
				require.Equal(t, tc.wantAnyGenres, filter.AnyGenres)
			}
			if len(tc.wantAllGenres) > 0 {
				require.Equal(t, tc.wantAllGenres, filter.RequireAllGenres)
			}
			if tc.wantMinYear > 0 {
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


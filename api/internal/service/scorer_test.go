package service_test

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
	"github.com/yaredow/glimpse-api/internal/service"
)

func TestValidActions(t *testing.T) {
	t.Parallel()

	valid := service.ValidActions()
	require.Contains(t, valid, string(domain.ActionRevealed))
	require.Contains(t, valid, string(domain.ActionWatched))
	require.Contains(t, valid, string(domain.ActionSkipped))
	require.Contains(t, valid, string(domain.ActionWatchlistAdd))
	require.Contains(t, valid, string(domain.ActionPickTonight))
	require.Contains(t, valid, string(domain.ActionLockedIn))

	// Verify weights
	wPick, ok := service.ActionWeights[string(domain.ActionPickTonight)]
	require.True(t, ok)
	require.Equal(t, 2.5, wPick.Delta)
	require.True(t, wPick.AffectExploration)

	wLock, ok := service.ActionWeights[string(domain.ActionLockedIn)]
	require.True(t, ok)
	require.Equal(t, 3.0, wLock.Delta)
	require.True(t, wLock.AffectExploration)
}


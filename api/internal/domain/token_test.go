package domain_test

import (
	"crypto/sha256"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/yaredow/glimpse-api/internal/domain"
)

func TestGenerateToken(t *testing.T) {
	token, err := domain.GenerateToken(42, time.Hour, "activation")
	require.NoError(t, err)
	require.NotNil(t, token)
	require.Equal(t, int64(42), token.UserID)
	require.Equal(t, "activation", token.Scope)
	require.True(t, token.Expiry.After(time.Now()))
	require.NotEmpty(t, token.Plaintext)
	require.Len(t, token.Plaintext, 26)
	require.Len(t, token.Hash, 32)

	expectedHash := sha256.Sum256([]byte(token.Plaintext))
	require.Equal(t, expectedHash[:], token.Hash)
}

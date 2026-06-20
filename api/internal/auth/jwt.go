// Package auth provides authentication and authorization functionality.
package auth

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/yaredow/glimpse-api/internal/types"
)

var (
	ErrInvalidJWTToken = errors.New("invalid token")
	ErrExpiredToken    = errors.New("expired token")
)

const JWTTTL = 10 * time.Minute

type JWTManager struct {
	secret []byte
	issuer string
}

func NewManager(secret []byte, issuer string) *JWTManager {
	return &JWTManager{
		secret: secret,
		issuer: issuer,
	}
}

func (m *JWTManager) GenerateJWTToken(userID int64) (types.JWT, error) {
	expiry := time.Now().Add(JWTTTL)

	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(userID, 10),
		ExpiresAt: jwt.NewNumericDate(expiry),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    m.issuer,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(m.secret)

	return types.JWT{
		Token:  signed,
		Expiry: expiry,
	}, err
}

func (m *JWTManager) ValidateJWTToken(tokenStr string) (int64, error) {
	if len(m.secret) == 0 {
		return 0, fmt.Errorf("jwt secret not configured")
	}

	claims := &jwt.RegisteredClaims{}

	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.secret, nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return 0, ErrExpiredToken
		}
		return 0, ErrInvalidJWTToken
	}

	if !token.Valid {
		return 0, ErrInvalidJWTToken
	}

	userID, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return 0, ErrInvalidJWTToken
	}

	return userID, nil
}

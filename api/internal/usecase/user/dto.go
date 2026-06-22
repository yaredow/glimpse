package userusecase

import "github.com/yaredow/glimpse-api/internal/entity"

type RegisterInput struct {
	Username string
	Email    string
	Password string
}

type RegisterOutput struct {
	User            *entity.User
	ActivationToken string
}

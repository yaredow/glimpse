package entity

type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string { return e.Message }

type BusinessError struct {
	Field   string
	Message string
}

func (e BusinessError) Error() string { return e.Message }

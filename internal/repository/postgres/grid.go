package postgres

type GridRepository struct {
	db *DB
}

func NewGridRepository(db *DB) *GridRepository {
	return &GridRepository{db: db}
}

package postgres

import (
	"context"

	"github.com/yaredow/glimpse-api/internal/domain"
)

type GenreRepository struct {
	db *DB
}

func NewGenreRepository(db *DB) *GenreRepository {
	return &GenreRepository{db: db}
}

func (gr *GenreRepository) List(ctx context.Context) ([]*domain.Genre, error) {
	query := `SELECT id, name FROM genres ORDER BY name`

	rows, err := gr.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var genres []*domain.Genre
	for rows.Next() {
		var g domain.Genre
		if err := rows.Scan(&g.ID, &g.Name); err != nil {
			return nil, err
		}
		genres = append(genres, &g)
	}

	return genres, rows.Err()
}

func (gr *GenreRepository) GetNamesByID(ctx context.Context, ids []int) ([]string, error) {
	query := `SELECT name FROM genres WHERE id = ANY($1) ORDER BY name`

	rows, err := gr.db.Query(ctx, query, ids)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}

		names = append(names, name)
	}

	return names, rows.Err()
}

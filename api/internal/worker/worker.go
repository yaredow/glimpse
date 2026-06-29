package worker

import (
	"log"

	"golang.org/x/sync/errgroup"
)

type Pool struct {
	wg *errgroup.Group
}

func New() *Pool {
	return &Pool{wg: &errgroup.Group{}}
}

func (p *Pool) Background(fn func()) {
	p.wg.Go(func() error {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("background panic: %v", err)
			}
		}()
		fn()
		return nil
	})
}

func (p *Pool) Wait() error {
	return p.wg.Wait()
}

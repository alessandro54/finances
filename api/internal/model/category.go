package model

import "github.com/uptrace/bun"

type Category struct {
	bun.BaseModel `bun:"table:categories" json:"-"`

	Name      string  `bun:"name,pk" json:"name"`
	CreatedAt *string `bun:"created_at" json:"-"`
}

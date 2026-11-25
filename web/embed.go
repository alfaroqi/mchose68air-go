package web

import (
	"embed"
	"io/fs"
)

//go:embed assets/*
var assetsFS embed.FS

// FS returns the embedded frontend filesystem rooted at web/assets.
func FS() (fs.FS, error) {
	return fs.Sub(assetsFS, "assets")
}

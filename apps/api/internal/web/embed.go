package web

import (
	"embed"
	"io/fs"
	"mime"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

//go:embed all:dist
var DistFS embed.FS

// Handler returns a Gin handler that serves the embedded SPA.
func Handler() gin.HandlerFunc {
	subFS, err := fs.Sub(DistFS, "dist")
	if err != nil {
		return func(c *gin.Context) {
			c.String(http.StatusOK, "SPA not built yet")
		}
	}

	return func(c *gin.Context) {
		urlPath := c.Request.URL.Path

		// Skip API routes — let Gin handle them
		if strings.HasPrefix(urlPath, "/api/") {
			return
		}

		filePath := strings.TrimPrefix(urlPath, "/")
		if filePath == "" {
			filePath = "index.html"
		}

		// Try exact file (CSS, JS, images, fonts)
		if data, err := fs.ReadFile(subFS, filePath); err == nil {
			ct := mime.TypeByExtension(filepath.Ext(filePath))
			if ct == "" {
				ct = "application/octet-stream"
			}
			c.Data(http.StatusOK, ct, data)
			c.Abort()
			return
		}

		// Try path/index.html (Next.js trailing slash export)
		indexPath := strings.TrimSuffix(filePath, "/") + "/index.html"
		if data, err := fs.ReadFile(subFS, indexPath); err == nil {
			c.Data(http.StatusOK, "text/html; charset=utf-8", data)
			c.Abort()
			return
		}

		// SPA fallback — serve root index.html for client-side routing
		if data, err := fs.ReadFile(subFS, "index.html"); err == nil {
			c.Data(http.StatusOK, "text/html; charset=utf-8", data)
			c.Abort()
			return
		}
	}
}

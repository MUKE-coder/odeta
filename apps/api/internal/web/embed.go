package web

import (
	"embed"
	"io/fs"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// DistFS holds the compiled Next.js static output.
// Build: pnpm build (in apps/web) → copy apps/web/out → apps/api/internal/web/dist
//
//go:embed dist
var DistFS embed.FS

// Handler returns a Gin handler that serves the embedded SPA.
// - /api/* requests are skipped (handled by API routes)
// - Everything else serves from the embedded dist directory
// - Unknown paths fall back to index.html (SPA routing)
func Handler() gin.HandlerFunc {
	subFS, err := fs.Sub(DistFS, "dist")
	if err != nil {
		// During development, dist may only have .gitkeep — serve nothing
		return func(c *gin.Context) {
			if !strings.HasPrefix(c.Request.URL.Path, "/api/") {
				c.String(http.StatusOK, "SPA not built yet. Run: make build-web")
			}
		}
	}

	fileServer := http.FileServer(http.FS(subFS))

	return func(c *gin.Context) {
		urlPath := c.Request.URL.Path

		// Skip API routes
		if strings.HasPrefix(urlPath, "/api/") {
			c.Next()
			return
		}

		// Try serving the exact file
		filePath := strings.TrimPrefix(urlPath, "/")
		if filePath == "" {
			filePath = "index.html"
		}

		// Check if file exists
		if f, err := subFS.Open(filePath); err == nil {
			f.Close()
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}

		// Try with /index.html suffix (Next.js trailing slash export)
		indexPath := strings.TrimSuffix(filePath, "/") + "/index.html"
		if f, err := subFS.Open(indexPath); err == nil {
			f.Close()
			data, _ := fs.ReadFile(subFS, indexPath)
			c.Data(http.StatusOK, "text/html; charset=utf-8", data)
			return
		}

		// SPA fallback: serve root index.html for client-side routing
		data, err := fs.ReadFile(subFS, "index.html")
		if err != nil {
			c.String(http.StatusNotFound, "Not found")
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", data)
	}
}

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

// Dynamic route patterns: map URL path patterns to their pre-rendered placeholder paths.
// Next.js static export renders [param] routes at /placeholder/index.html.
var dynamicRoutes = []struct {
	prefix      string // URL prefix to match
	segments    int    // number of segments after prefix that are dynamic
	placeholder string // path to the pre-rendered page
}{
	{prefix: "dashboard/chat/", segments: 1, placeholder: "dashboard/chat/placeholder/index.html"},
	{prefix: "dashboard/projects/", segments: 1, placeholder: "dashboard/projects/placeholder/settings/index.html"},
}

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

		// COEP/COOP headers on non-API routes — required for WebContainers
		// Same-origin (single binary) so this won't break API calls
		if !strings.HasPrefix(urlPath, "/api/") {
			c.Header("Cross-Origin-Embedder-Policy", "require-corp")
			c.Header("Cross-Origin-Opener-Policy", "same-origin")
		}

		// Skip API routes
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

		// Try dynamic route placeholders
		cleanPath := strings.TrimSuffix(filePath, "/")
		for _, route := range dynamicRoutes {
			if strings.HasPrefix(cleanPath, route.prefix) {
				if data, err := fs.ReadFile(subFS, route.placeholder); err == nil {
					c.Data(http.StatusOK, "text/html; charset=utf-8", data)
					c.Abort()
					return
				}
			}
		}

		// Final fallback — serve root index.html
		if data, err := fs.ReadFile(subFS, "index.html"); err == nil {
			c.Data(http.StatusOK, "text/html; charset=utf-8", data)
			c.Abort()
			return
		}
	}
}

package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
)

// RegistryProxyHandler proxies JB component registry requests.
type RegistryProxyHandler struct{}

var allowedDomains = map[string]bool{
	"jb.desishub.com":                    true,
	"better-auth-ui.desishub.com":        true,
	"stripe-ui-component.desishub.com":   true,
	"file-storage-registry.vercel.app":   true,
}

// Proxy fetches a JB component registry JSON and returns it.
func (h *RegistryProxyHandler) Proxy(c *gin.Context) {
	rawURL := c.Query("url")
	if rawURL == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no url"})
		return
	}

	u, err := url.Parse(rawURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid url"})
		return
	}

	if !allowedDomains[u.Hostname()] {
		c.JSON(http.StatusForbidden, gin.H{"error": "domain not allowed"})
		return
	}

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(rawURL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "fetch failed"})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var data interface{}
	json.Unmarshal(body, &data)
	c.JSON(http.StatusOK, data)
}

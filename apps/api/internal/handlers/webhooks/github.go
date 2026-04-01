package webhooks

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// GitHubWebhook handles GitHub webhook events.
type GitHubWebhook struct {
	DB            *gorm.DB
	WebhookSecret string
}

type githubPushEvent struct {
	Ref        string `json:"ref"`
	Repository struct {
		FullName string `json:"full_name"`
		HTMLURL  string `json:"html_url"`
	} `json:"repository"`
}

// Handle processes incoming GitHub webhook events.
func (h *GitHubWebhook) Handle(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	// Verify webhook signature
	signature := c.GetHeader("X-Hub-Signature-256")
	if h.WebhookSecret != "" && !verifyGitHubSignature(body, signature, h.WebhookSecret) {
		log.Println("GitHub webhook: invalid signature")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	eventType := c.GetHeader("X-GitHub-Event")
	log.Printf("GitHub webhook: %s", eventType)

	switch eventType {
	case "push":
		var event githubPushEvent
		if err := json.Unmarshal(body, &event); err == nil {
			h.handlePush(event)
		}
	case "ping":
		log.Println("GitHub webhook: ping received")
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *GitHubWebhook) handlePush(event githubPushEvent) {
	repoName := event.Repository.FullName

	// Update project's GitHub info if repo is linked
	var project models.Project
	if err := h.DB.Where("github_repo_name = ?", repoName).First(&project).Error; err == nil {
		h.DB.Model(&project).Update("github_repo_url", event.Repository.HTMLURL)
		log.Printf("GitHub push: updated project %d repo URL", project.ID)
	}
}

func verifyGitHubSignature(body []byte, signature, secret string) bool {
	if !strings.HasPrefix(signature, "sha256=") {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expected), []byte(signature))
}

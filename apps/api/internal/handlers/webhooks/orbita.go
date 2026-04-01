package webhooks

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// OrbitaWebhook handles Orbita deployment webhook events.
type OrbitaWebhook struct {
	DB *gorm.DB
}

type orbitaEvent struct {
	Type   string `json:"type"`
	AppID  string `json:"app_id"`
	Status string `json:"status"`
	URL    string `json:"url"`
	Logs   string `json:"logs"`
}

// Handle processes incoming Orbita webhook events.
func (h *OrbitaWebhook) Handle(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	var event orbitaEvent
	if err := json.Unmarshal(body, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	log.Printf("Orbita webhook: %s (app: %s, status: %s)", event.Type, event.AppID, event.Status)

	switch event.Type {
	case "deployment.completed":
		h.handleDeploymentCompleted(event)
	case "deployment.failed":
		h.handleDeploymentFailed(event)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *OrbitaWebhook) handleDeploymentCompleted(event orbitaEvent) {
	// Find project by orbita app ID
	var project models.Project
	if err := h.DB.Where("orbita_app_id = ?", event.AppID).First(&project).Error; err != nil {
		log.Printf("Orbita: project not found for app %s", event.AppID)
		return
	}

	now := time.Now()

	// Update deployment record
	h.DB.Model(&models.Deployment{}).
		Where("project_id = ? AND status IN ?", project.ID, []string{models.DeploymentStatusPending, models.DeploymentStatusBuilding}).
		Updates(map[string]interface{}{
			"status":      models.DeploymentStatusLive,
			"deployed_at": &now,
			"logs":        event.Logs,
		})

	// Update project status
	h.DB.Model(&project).Update("status", models.ProjectStatusDeployed)

	log.Printf("Orbita: deployment completed for project %d", project.ID)
}

func (h *OrbitaWebhook) handleDeploymentFailed(event orbitaEvent) {
	var project models.Project
	if err := h.DB.Where("orbita_app_id = ?", event.AppID).First(&project).Error; err != nil {
		return
	}

	h.DB.Model(&models.Deployment{}).
		Where("project_id = ? AND status IN ?", project.ID, []string{models.DeploymentStatusPending, models.DeploymentStatusBuilding}).
		Updates(map[string]interface{}{
			"status": models.DeploymentStatusFailed,
			"logs":   event.Logs,
		})

	h.DB.Model(&project).Update("status", models.ProjectStatusFailed)

	log.Printf("Orbita: deployment failed for project %d", project.ID)
}

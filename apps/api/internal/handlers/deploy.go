package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/credits"
	"odeta/apps/api/internal/services/orbita"
)

// DeployHandler handles project deployment via Orbita.
type DeployHandler struct {
	DB      *gorm.DB
	Credits *credits.Service
	Orbita  *orbita.Service
}

type deployRequest struct {
	ProjectID uint   `json:"project_id" binding:"required"`
	Subdomain string `json:"subdomain" binding:"required,min=3,max=30"`
}

// Deploy triggers deployment for a project (paid feature: Starter/Pro only).
func (h *DeployHandler) Deploy(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req deployRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	// Verify project belongs to user
	var project models.Project
	if err := h.DB.Where("id = ? AND user_id = ?", req.ProjectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"},
		})
		return
	}

	// Check user plan (deployment is paid)
	var user models.User
	h.DB.First(&user, userID)
	if user.Plan == models.PlanFree {
		c.JSON(http.StatusForbidden, gin.H{
			"error": gin.H{
				"code":    "PLAN_REQUIRED",
				"message": "Deployment requires a Starter or Pro plan. Upgrade to deploy.",
			},
		})
		return
	}

	// Check subdomain availability
	var existing models.Deployment
	if err := h.DB.Where("subdomain = ?", req.Subdomain).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": gin.H{"code": "SUBDOMAIN_TAKEN", "message": "This subdomain is already in use"},
		})
		return
	}

	// Create deployment record
	deployment := models.Deployment{
		ProjectId: req.ProjectID,
		Status:    models.DeploymentStatusPending,
		Subdomain: req.Subdomain,
	}
	if err := h.DB.Create(&deployment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to create deployment"},
		})
		return
	}

	// Trigger Orbita deployment in background
	if h.Orbita != nil {
		go func() {
			h.DB.Model(&deployment).Update("status", models.DeploymentStatusBuilding)

			app, err := h.Orbita.CreateApp(project.Name, req.Subdomain, project.GithubRepoUrl)
			if err != nil {
				h.DB.Model(&deployment).Update("status", models.DeploymentStatusFailed)
				h.DB.Model(&deployment).Update("logs", fmt.Sprintf("Deployment failed: %v", err))
				return
			}

			if err := h.Orbita.Deploy(app.ID); err != nil {
				h.DB.Model(&deployment).Update("status", models.DeploymentStatusFailed)
				return
			}

			now := time.Now()
			h.DB.Model(&deployment).Updates(map[string]interface{}{
				"status":      models.DeploymentStatusLive,
				"deployed_at": &now,
			})
			h.DB.Model(&project).Updates(map[string]interface{}{
				"status":       models.ProjectStatusDeployed,
				"subdomain":    req.Subdomain,
				"orbita_app_id": app.ID,
			})
		}()
	}

	c.JSON(http.StatusAccepted, gin.H{
		"data": gin.H{
			"deployment_id": deployment.ID,
			"subdomain":     req.Subdomain,
			"status":        "pending",
			"url":           fmt.Sprintf("https://%s.odeta.app", req.Subdomain),
		},
	})
}

// ListDeployments returns all deployments for a project.
func (h *DeployHandler) ListDeployments(c *gin.Context) {
	var id uint
	if _, err := fmt.Sscanf(c.Param("id"), "%d", &id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid project ID"},
		})
		return
	}

	var deployments []models.Deployment
	h.DB.Where("project_id = ?", id).Order("created_at desc").Find(&deployments)

	c.JSON(http.StatusOK, gin.H{
		"data": deployments,
	})
}

// CheckSubdomain checks if a subdomain is available.
func (h *DeployHandler) CheckSubdomain(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "name query parameter is required"},
		})
		return
	}

	// Check reserved subdomains
	reserved := map[string]bool{
		"admin": true, "api": true, "www": true, "app": true,
		"dashboard": true, "mail": true, "ftp": true, "blog": true,
		"docs": true, "help": true, "support": true, "status": true,
	}
	if reserved[name] {
		c.JSON(http.StatusOK, gin.H{
			"data": gin.H{"available": false, "reason": "This subdomain is reserved"},
		})
		return
	}

	// Check if subdomain is taken
	var count int64
	h.DB.Model(&models.Deployment{}).Where("subdomain = ?", name).Count(&count)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"available": count == 0},
	})
}

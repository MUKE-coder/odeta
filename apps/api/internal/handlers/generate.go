package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/credits"
	"odeta/apps/api/internal/services/grit"
)

// GenerateHandler handles project generation and progress streaming.
type GenerateHandler struct {
	DB       *gorm.DB
	Credits  *credits.Service
	Executor *grit.PhaseExecutor
}

type generateRequest struct {
	ProjectID uint `json:"project_id" binding:"required"`
}

// Generate triggers project generation (costs 5 credits).
func (h *GenerateHandler) Generate(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req generateRequest
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

	// Check credits (5 for generation)
	const creditCost = 5
	result, err := h.Credits.Check(userID, creditCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Credit check failed"},
		})
		return
	}
	if !result.HasEnough {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error": gin.H{
				"code":    "INSUFFICIENT_CREDITS",
				"message": fmt.Sprintf("Generation requires %d credits but you have %d", creditCost, result.Balance),
				"balance": result.Balance,
			},
		})
		return
	}

	// Deduct credits upfront for generation
	projectIDPtr := &req.ProjectID
	newBalance, err := h.Credits.Deduct(userID, creditCost, models.CreditEventSpentGenerate, "Project generation", projectIDPtr)
	if err != nil {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error": gin.H{"code": "INSUFFICIENT_CREDITS", "message": err.Error()},
		})
		return
	}

	// Start phase execution in background
	go func() {
		if err := h.Executor.Execute(req.ProjectID); err != nil {
			fmt.Printf("Generation failed for project %d: %v\n", req.ProjectID, err)
		}
	}()

	c.JSON(http.StatusAccepted, gin.H{
		"data": gin.H{
			"project_id":     req.ProjectID,
			"status":         "building",
			"credits_used":   creditCost,
			"credits_remaining": newBalance,
			"message":        "Generation started. Connect to /api/projects/:id/progress for live updates.",
		},
	})
}

// StreamProgress streams phase execution progress via SSE.
func (h *GenerateHandler) StreamProgress(c *gin.Context) {
	projectID := c.GetUint("project_id")
	if projectID == 0 {
		// Try to parse from URL param
		var id uint
		if _, err := fmt.Sscanf(c.Param("id"), "%d", &id); err == nil {
			projectID = id
		}
	}

	if projectID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "project_id is required"},
		})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	ch := h.Executor.Subscribe(projectID)
	defer h.Executor.Unsubscribe(projectID, ch)

	c.Stream(func(w io.Writer) bool {
		select {
		case event, ok := <-ch:
			if !ok {
				return false
			}
			data, _ := json.Marshal(event)
			c.SSEvent(event.Type, string(data))
			c.Writer.Flush()
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

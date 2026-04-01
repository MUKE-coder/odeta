package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"odeta/apps/api/internal/services/credits"
)

// CreditsHandler handles credit-related endpoints.
type CreditsHandler struct {
	Credits *credits.Service
}

// GetBalance returns the current user's credit balance.
func (h *CreditsHandler) GetBalance(c *gin.Context) {
	userID := c.GetUint("user_id")

	balance, err := h.Credits.Balance(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch credit balance",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"credits": balance,
		},
	})
}

// GetLogs returns paginated credit logs for the current user.
func (h *CreditsHandler) GetLogs(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Use the credit log handler's list with user filter
	// This is a simplified version — the full handler from grit handles pagination
	c.Set("filter_user_id", userID)
	c.Next()
}

// CheckCredits checks if the user has enough credits for an operation.
func (h *CreditsHandler) CheckCredits(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req struct {
		Required int `json:"required" binding:"required,min=1"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{
				"code":    "VALIDATION_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	result, err := h.Credits.Check(userID, req.Required)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to check credits",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": result,
	})
}

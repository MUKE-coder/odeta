package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/credits"
)

// AdminHandler handles admin-only endpoints.
type AdminHandler struct {
	DB      *gorm.DB
	Credits *credits.Service
}

// GetStats returns platform-wide statistics.
func (h *AdminHandler) GetStats(c *gin.Context) {
	var userCount, projectCount, deployedCount, creditLogsCount int64

	h.DB.Model(&models.User{}).Count(&userCount)
	h.DB.Model(&models.Project{}).Count(&projectCount)
	h.DB.Model(&models.Project{}).Where("status = ?", models.ProjectStatusDeployed).Count(&deployedCount)
	h.DB.Model(&models.CreditLog{}).Count(&creditLogsCount)

	// Credits issued this month
	var creditsIssued int64
	h.DB.Model(&models.CreditLog{}).
		Where("type IN ? AND created_at >= date_trunc('month', now())", []string{models.CreditEventEarned, models.CreditEventPurchase, models.CreditEventMonthlyReset}).
		Select("COALESCE(SUM(amount), 0)").Scan(&creditsIssued)

	// Credits consumed this month
	var creditsConsumed int64
	h.DB.Model(&models.CreditLog{}).
		Where("amount < 0 AND created_at >= date_trunc('month', now())").
		Select("COALESCE(SUM(ABS(amount)), 0)").Scan(&creditsConsumed)

	// Plan breakdown
	var planCounts []struct {
		Plan  string `json:"plan"`
		Count int64  `json:"count"`
	}
	h.DB.Model(&models.User{}).Select("plan, count(*) as count").Group("plan").Scan(&planCounts)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"users":            userCount,
			"projects":         projectCount,
			"deployed":         deployedCount,
			"credit_logs":      creditLogsCount,
			"credits_issued":   creditsIssued,
			"credits_consumed": creditsConsumed,
			"plans":            planCounts,
		},
	})
}

type adjustCreditsRequest struct {
	Amount      int    `json:"amount" binding:"required"`
	Description string `json:"description" binding:"required"`
}

// AdjustCredits manually adds or removes credits from a user (admin only).
func (h *AdminHandler) AdjustCredits(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid user ID"}})
		return
	}

	var req adjustCreditsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()}})
		return
	}

	var newBalance int
	if req.Amount > 0 {
		newBalance, err = h.Credits.Add(uint(userID), req.Amount, models.CreditEventEarned, fmt.Sprintf("Admin adjustment: %s", req.Description))
	} else {
		newBalance, err = h.Credits.Deduct(uint(userID), -req.Amount, models.CreditEventSpentMessage, fmt.Sprintf("Admin adjustment: %s", req.Description), nil)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"user_id":     userID,
			"adjusted_by": req.Amount,
			"new_balance": newBalance,
		},
	})
}

type changePlanRequest struct {
	Plan string `json:"plan" binding:"required,oneof=free starter pro"`
}

// ChangePlan changes a user's plan (admin only).
func (h *AdminHandler) ChangePlan(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid user ID"}})
		return
	}

	var req changePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()}})
		return
	}

	if err := h.DB.Model(&models.User{}).Where("id = ?", userID).Update("plan", req.Plan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to update plan"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"user_id": userID, "plan": req.Plan},
	})
}

// SuspendUser toggles user active status (admin only).
func (h *AdminHandler) SuspendUser(c *gin.Context) {
	userID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": "Invalid user ID"}})
		return
	}

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "User not found"}})
		return
	}

	newActive := !user.Active
	h.DB.Model(&user).Update("active", newActive)

	status := "activated"
	if !newActive {
		status = "suspended"
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"user_id": userID, "active": newActive, "status": status},
	})
}

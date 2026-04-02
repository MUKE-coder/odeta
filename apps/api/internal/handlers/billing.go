package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/credits"
	"odeta/apps/api/internal/services/dgateway"
)

// BillingHandler handles billing-related endpoints.
type BillingHandler struct {
	DB       *gorm.DB
	DGateway *dgateway.Service
	Credits  *credits.Service
}

type purchaseRequest struct {
	Plan        string `json:"plan" binding:"required"`
	PhoneNumber string `json:"phone_number" binding:"required"`
	Currency    string `json:"currency"`
	Provider    string `json:"provider"`
}

// GetPlans returns available pricing plans.
func (h *BillingHandler) GetPlans(c *gin.Context) {
	plans := []gin.H{
		{
			"plan":        "free",
			"credits":     100,
			"price_ugx":   0,
			"price_usd":   0,
			"description": "Free — 100 credits/month",
			"current":     false,
		},
		{
			"plan":        "starter",
			"credits":     500,
			"price_ugx":   45000,
			"price_usd":   1200,
			"description": "Starter — 500 credits/month",
			"current":     false,
		},
		{
			"plan":        "pro",
			"credits":     2000,
			"price_ugx":   110000,
			"price_usd":   2900,
			"description": "Pro — 2,000 credits/month",
			"current":     false,
		},
	}

	userID := c.GetUint("user_id")
	var user models.User
	if err := h.DB.First(&user, userID).Error; err == nil {
		for i, p := range plans {
			if p["plan"] == user.Plan {
				plans[i]["current"] = true
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": plans})
}

// PurchaseCredits initiates a DGateway payment for credit purchase.
func (h *BillingHandler) PurchaseCredits(c *gin.Context) {
	if h.DGateway == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "BILLING_UNAVAILABLE", "message": "Payment service is not configured"},
		})
		return
	}

	userID := c.GetUint("user_id")

	var req purchaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	tier, ok := dgateway.Tiers[req.Plan]
	if !ok || req.Plan == "free" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "INVALID_PLAN", "message": "Invalid plan selected"},
		})
		return
	}

	currency := req.Currency
	if currency == "" {
		currency = "UGX"
	}

	amount := tier.AmountUGX
	if currency == "USD" {
		amount = tier.AmountUSD
	}

	metadata := map[string]interface{}{
		"user_id":      userID,
		"plan":         req.Plan,
		"credit_count": tier.Credits,
	}

	result, err := h.DGateway.CollectPayment(amount, currency, req.PhoneNumber, tier.Description, metadata)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "PAYMENT_ERROR", "message": "Failed to initiate payment: " + err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"reference": result.Data.Reference,
			"status":    result.Data.Status,
			"amount":    amount,
			"currency":  currency,
			"message":   "Payment initiated. Check your phone to approve.",
		},
	})
}

// CheckPayment verifies the status of a DGateway payment.
func (h *BillingHandler) CheckPayment(c *gin.Context) {
	if h.DGateway == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "BILLING_UNAVAILABLE", "message": "Payment service is not configured"},
		})
		return
	}

	reference := c.Query("reference")
	if reference == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": "reference is required"},
		})
		return
	}

	result, err := h.DGateway.GetTransaction(reference)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "PAYMENT_ERROR", "message": "Failed to check payment"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"reference": result.Data.Reference,
			"status":    result.Data.Status,
			"amount":    result.Data.Amount,
			"currency":  result.Data.Currency,
		},
	})
}

// GetSubscription returns the current user's plan and credit info.
func (h *BillingHandler) GetSubscription(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	h.DB.First(&user, userID)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"plan":    user.Plan,
			"credits": user.Credits,
		},
	})
}

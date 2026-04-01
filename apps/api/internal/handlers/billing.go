package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	stripesvc "odeta/apps/api/internal/services/stripe"
)

// BillingHandler handles billing-related endpoints.
type BillingHandler struct {
	DB     *gorm.DB
	Stripe *stripesvc.Service
}

type checkoutRequest struct {
	PriceID string `json:"price_id" binding:"required"`
	Mode    string `json:"mode"` // "subscription" or "payment"
}

// CreateCheckout creates a Stripe Checkout session.
func (h *BillingHandler) CreateCheckout(c *gin.Context) {
	if h.Stripe == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "BILLING_UNAVAILABLE", "message": "Billing is not configured"},
		})
		return
	}

	userID := c.GetUint("user_id")

	var req checkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "User not found"},
		})
		return
	}

	// Ensure user has a Stripe customer ID
	customerID := ""
	if user.StripeCustomerID != nil {
		customerID = *user.StripeCustomerID
	}
	if customerID == "" {
		id, err := h.Stripe.CreateCustomer(user.Email, user.FirstName+" "+user.LastName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": gin.H{"code": "STRIPE_ERROR", "message": "Failed to create Stripe customer"},
			})
			return
		}
		h.DB.Model(&user).Update("stripe_customer_id", &id)
		customerID = id
	}

	mode := req.Mode
	if mode == "" {
		mode = "subscription"
	}

	url, err := h.Stripe.CreateCheckoutSession(customerID, req.PriceID, mode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "STRIPE_ERROR", "message": "Failed to create checkout session"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"url": url},
	})
}

// CreatePortal creates a Stripe Billing Portal session.
func (h *BillingHandler) CreatePortal(c *gin.Context) {
	if h.Stripe == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "BILLING_UNAVAILABLE", "message": "Billing is not configured"},
		})
		return
	}

	userID := c.GetUint("user_id")

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "User not found"},
		})
		return
	}

	if user.StripeCustomerID == nil || *user.StripeCustomerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "NO_SUBSCRIPTION", "message": "No billing account found"},
		})
		return
	}

	url, err := h.Stripe.CreatePortalSession(*user.StripeCustomerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "STRIPE_ERROR", "message": "Failed to create portal session"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"url": url},
	})
}

// GetSubscription returns the current user's subscription info.
func (h *BillingHandler) GetSubscription(c *gin.Context) {
	userID := c.GetUint("user_id")

	var user models.User
	h.DB.First(&user, userID)

	var subscription models.Subscription
	err := h.DB.Where("user_id = ? AND status IN ?", userID, []string{"active", "trialing"}).
		Order("created_at desc").First(&subscription).Error

	if err != nil {
		// No active subscription — free plan
		c.JSON(http.StatusOK, gin.H{
			"data": gin.H{
				"plan":     user.Plan,
				"credits":  user.Credits,
				"has_subscription": false,
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"plan":                 user.Plan,
			"credits":              user.Credits,
			"has_subscription":     true,
			"subscription_id":      subscription.StripeSubscriptionId,
			"status":               subscription.Status,
			"current_period_end":   subscription.CurrentPeriodEnd,
			"cancel_at_period_end": subscription.CancelAtPeriodEnd,
		},
	})
}

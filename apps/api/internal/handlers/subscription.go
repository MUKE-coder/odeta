package handlers

import (
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// SubscriptionHandler handles subscription endpoints.
type SubscriptionHandler struct {
	DB *gorm.DB
}

// List returns a paginated list of subscriptions.
func (h *SubscriptionHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "created_at")
	sortOrder := c.DefaultQuery("sort_order", "desc")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	if sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "desc"
	}

	allowedSorts := map[string]bool{"id": true, "created_at": true, "user_id": true, "stripe_subscription_id": true, "stripe_price_id": true, "status": true}
	if !allowedSorts[sortBy] {
		sortBy = "created_at"
	}

	query := h.DB.Model(&models.Subscription{})

	if search != "" {
		query = query.Where("stripe_subscription_id ILIKE ? OR stripe_price_id ILIKE ? OR status ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Subscription
	offset := (page - 1) * pageSize
	if err := query.Order(sortBy + " " + sortOrder).Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch subscriptions",
			},
		})
		return
	}

	pages := int(math.Ceil(float64(total) / float64(pageSize)))

	c.JSON(http.StatusOK, gin.H{
		"data": items,
		"meta": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     pages,
		},
	})
}

// GetByID returns a single subscription by ID.
func (h *SubscriptionHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var item models.Subscription
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Subscription not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// Create adds a new subscription.
func (h *SubscriptionHandler) Create(c *gin.Context) {
	var req struct {
		UserId uint `json:"user_id"`
		StripeSubscriptionId string `json:"stripe_subscription_id" binding:"required"`
		StripePriceId string `json:"stripe_price_id" binding:"required"`
		Status string `json:"status" binding:"required"`
		CurrentPeriodStart *time.Time `json:"current_period_start"`
		CurrentPeriodEnd *time.Time `json:"current_period_end"`
		CancelAtPeriodEnd bool `json:"cancel_at_period_end"`
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

	item := models.Subscription{
		UserId: req.UserId,
		StripeSubscriptionId: req.StripeSubscriptionId,
		StripePriceId: req.StripePriceId,
		Status: req.Status,
		CurrentPeriodStart: req.CurrentPeriodStart,
		CurrentPeriodEnd: req.CurrentPeriodEnd,
		CancelAtPeriodEnd: req.CancelAtPeriodEnd,
	}

	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create subscription",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "Subscription created successfully",
	})
}

// Update modifies an existing subscription.
func (h *SubscriptionHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var item models.Subscription
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Subscription not found",
			},
		})
		return
	}

	var req struct {
		UserId *uint `json:"user_id"`
		StripeSubscriptionId string `json:"stripe_subscription_id"`
		StripePriceId string `json:"stripe_price_id"`
		Status string `json:"status"`
		CurrentPeriodStart *time.Time `json:"current_period_start"`
		CurrentPeriodEnd *time.Time `json:"current_period_end"`
		CancelAtPeriodEnd *bool `json:"cancel_at_period_end"`
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

	updates := map[string]interface{}{}
	if req.UserId != nil {
		updates["user_id"] = *req.UserId
	}
	if req.StripeSubscriptionId != "" {
		updates["stripe_subscription_id"] = req.StripeSubscriptionId
	}
	if req.StripePriceId != "" {
		updates["stripe_price_id"] = req.StripePriceId
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.CurrentPeriodStart != nil {
		updates["current_period_start"] = req.CurrentPeriodStart
	}
	if req.CurrentPeriodEnd != nil {
		updates["current_period_end"] = req.CurrentPeriodEnd
	}
	if req.CancelAtPeriodEnd != nil {
		updates["cancel_at_period_end"] = *req.CancelAtPeriodEnd
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update subscription",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Subscription updated successfully",
	})
}

// Delete soft-deletes a subscription.
func (h *SubscriptionHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var item models.Subscription
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Subscription not found",
			},
		})
		return
	}

	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete subscription",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Subscription deleted successfully",
	})
}

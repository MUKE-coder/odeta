package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// CreditLogHandler handles creditlog endpoints.
type CreditLogHandler struct {
	DB *gorm.DB
}

// List returns a paginated list of credit_logs.
func (h *CreditLogHandler) List(c *gin.Context) {
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

	allowedSorts := map[string]bool{"id": true, "created_at": true, "user_id": true, "amount": true, "type": true, "description": true, "project_id": true}
	if !allowedSorts[sortBy] {
		sortBy = "created_at"
	}

	query := h.DB.Model(&models.CreditLog{})

	if search != "" {
		query = query.Where("type ILIKE ? OR description ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.CreditLog
	offset := (page - 1) * pageSize
	if err := query.Order(sortBy + " " + sortOrder).Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch credit_logs",
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

// GetByID returns a single creditlog by ID.
func (h *CreditLogHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var item models.CreditLog
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "CreditLog not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// Create adds a new creditlog.
func (h *CreditLogHandler) Create(c *gin.Context) {
	var req struct {
		UserId uint `json:"user_id"`
		Amount int `json:"amount"`
		Type string `json:"type" binding:"required"`
		Description string `json:"description" binding:"required"`
		ProjectId *uint `json:"project_id"`
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

	item := models.CreditLog{
		UserId: req.UserId,
		Amount: req.Amount,
		Type: req.Type,
		Description: req.Description,
		ProjectId: req.ProjectId,
	}

	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create creditlog",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "CreditLog created successfully",
	})
}

// Update modifies an existing creditlog.
func (h *CreditLogHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var item models.CreditLog
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "CreditLog not found",
			},
		})
		return
	}

	var req struct {
		UserId *uint `json:"user_id"`
		Amount *int `json:"amount"`
		Type string `json:"type"`
		Description string `json:"description"`
		ProjectId *uint `json:"project_id"`
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
	if req.Amount != nil {
		updates["amount"] = *req.Amount
	}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.ProjectId != nil {
		updates["project_id"] = *req.ProjectId
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update creditlog",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "CreditLog updated successfully",
	})
}

// Delete soft-deletes a creditlog.
func (h *CreditLogHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var item models.CreditLog
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "CreditLog not found",
			},
		})
		return
	}

	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete creditlog",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "CreditLog deleted successfully",
	})
}

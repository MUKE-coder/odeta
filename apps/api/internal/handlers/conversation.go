package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// ConversationHandler handles conversation endpoints.
type ConversationHandler struct {
	DB *gorm.DB
}

// List returns a paginated list of conversations.
func (h *ConversationHandler) List(c *gin.Context) {
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

	allowedSorts := map[string]bool{"id": true, "created_at": true, "project_id": true, "role": true, "content": true, "phase": true, "credits_used": true, "metadata": true}
	if !allowedSorts[sortBy] {
		sortBy = "created_at"
	}

	query := h.DB.Model(&models.Conversation{})

	if search != "" {
		query = query.Where("role ILIKE ? OR content ILIKE ? OR phase ILIKE ? OR metadata ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Conversation
	offset := (page - 1) * pageSize
	if err := query.Order(sortBy + " " + sortOrder).Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch conversations",
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

// GetByID returns a single conversation by ID.
func (h *ConversationHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var item models.Conversation
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Conversation not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// Create adds a new conversation.
func (h *ConversationHandler) Create(c *gin.Context) {
	var req struct {
		ProjectId uint `json:"project_id"`
		Role string `json:"role" binding:"required"`
		Content string `json:"content"`
		Phase string `json:"phase" binding:"required"`
		CreditsUsed int `json:"credits_used"`
		Metadata string `json:"metadata"`
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

	item := models.Conversation{
		ProjectId: req.ProjectId,
		Role: req.Role,
		Content: req.Content,
		Phase: req.Phase,
		CreditsUsed: req.CreditsUsed,
		Metadata: req.Metadata,
	}

	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create conversation",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "Conversation created successfully",
	})
}

// Update modifies an existing conversation.
func (h *ConversationHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var item models.Conversation
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Conversation not found",
			},
		})
		return
	}

	var req struct {
		ProjectId *uint `json:"project_id"`
		Role string `json:"role"`
		Content string `json:"content"`
		Phase string `json:"phase"`
		CreditsUsed *int `json:"credits_used"`
		Metadata string `json:"metadata"`
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
	if req.ProjectId != nil {
		updates["project_id"] = *req.ProjectId
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.Phase != "" {
		updates["phase"] = req.Phase
	}
	if req.CreditsUsed != nil {
		updates["credits_used"] = *req.CreditsUsed
	}
	if req.Metadata != "" {
		updates["metadata"] = req.Metadata
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update conversation",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Conversation updated successfully",
	})
}

// Delete soft-deletes a conversation.
func (h *ConversationHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var item models.Conversation
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Conversation not found",
			},
		})
		return
	}

	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete conversation",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Conversation deleted successfully",
	})
}

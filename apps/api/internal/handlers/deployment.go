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

// DeploymentHandler handles deployment endpoints.
type DeploymentHandler struct {
	DB *gorm.DB
}

// List returns a paginated list of deployments.
func (h *DeploymentHandler) List(c *gin.Context) {
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

	allowedSorts := map[string]bool{"id": true, "created_at": true, "project_id": true, "status": true, "subdomain": true, "logs": true}
	if !allowedSorts[sortBy] {
		sortBy = "created_at"
	}

	query := h.DB.Model(&models.Deployment{})

	if search != "" {
		query = query.Where("status ILIKE ? OR subdomain ILIKE ? OR logs ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Deployment
	offset := (page - 1) * pageSize
	if err := query.Order(sortBy + " " + sortOrder).Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch deployments",
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

// GetByID returns a single deployment by ID.
func (h *DeploymentHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var item models.Deployment
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Deployment not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// Create adds a new deployment.
func (h *DeploymentHandler) Create(c *gin.Context) {
	var req struct {
		ProjectId uint `json:"project_id"`
		Status string `json:"status" binding:"required"`
		Subdomain string `json:"subdomain" binding:"required"`
		Logs string `json:"logs"`
		DeployedAt *time.Time `json:"deployed_at"`
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

	item := models.Deployment{
		ProjectId: req.ProjectId,
		Status: req.Status,
		Subdomain: req.Subdomain,
		Logs: req.Logs,
		DeployedAt: req.DeployedAt,
	}

	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create deployment",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "Deployment created successfully",
	})
}

// Update modifies an existing deployment.
func (h *DeploymentHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var item models.Deployment
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Deployment not found",
			},
		})
		return
	}

	var req struct {
		ProjectId *uint `json:"project_id"`
		Status string `json:"status"`
		Subdomain string `json:"subdomain"`
		Logs string `json:"logs"`
		DeployedAt *time.Time `json:"deployed_at"`
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
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Subdomain != "" {
		updates["subdomain"] = req.Subdomain
	}
	if req.Logs != "" {
		updates["logs"] = req.Logs
	}
	if req.DeployedAt != nil {
		updates["deployed_at"] = req.DeployedAt
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update deployment",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Deployment updated successfully",
	})
}

// Delete soft-deletes a deployment.
func (h *DeploymentHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var item models.Deployment
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Deployment not found",
			},
		})
		return
	}

	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete deployment",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Deployment deleted successfully",
	})
}

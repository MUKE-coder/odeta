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

// ProjectPhaseHandler handles projectphase endpoints.
type ProjectPhaseHandler struct {
	DB *gorm.DB
}

// List returns a paginated list of project_phases.
func (h *ProjectPhaseHandler) List(c *gin.Context) {
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

	allowedSorts := map[string]bool{"id": true, "created_at": true, "project_id": true, "phase_number": true, "title": true, "description": true, "status": true, "tasks": true}
	if !allowedSorts[sortBy] {
		sortBy = "created_at"
	}

	query := h.DB.Model(&models.ProjectPhase{})

	if search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ? OR status ILIKE ? OR tasks ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.ProjectPhase
	offset := (page - 1) * pageSize
	if err := query.Order(sortBy + " " + sortOrder).Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch project_phases",
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

// GetByID returns a single projectphase by ID.
func (h *ProjectPhaseHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var item models.ProjectPhase
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "ProjectPhase not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// Create adds a new projectphase.
func (h *ProjectPhaseHandler) Create(c *gin.Context) {
	var req struct {
		ProjectId uint `json:"project_id"`
		PhaseNumber int `json:"phase_number"`
		Title string `json:"title" binding:"required"`
		Description string `json:"description"`
		Status string `json:"status" binding:"required"`
		Tasks string `json:"tasks"`
		StartedAt *time.Time `json:"started_at"`
		CompletedAt *time.Time `json:"completed_at"`
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

	item := models.ProjectPhase{
		ProjectId: req.ProjectId,
		PhaseNumber: req.PhaseNumber,
		Title: req.Title,
		Description: req.Description,
		Status: req.Status,
		Tasks: req.Tasks,
		StartedAt: req.StartedAt,
		CompletedAt: req.CompletedAt,
	}

	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create projectphase",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "ProjectPhase created successfully",
	})
}

// Update modifies an existing projectphase.
func (h *ProjectPhaseHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var item models.ProjectPhase
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "ProjectPhase not found",
			},
		})
		return
	}

	var req struct {
		ProjectId *uint `json:"project_id"`
		PhaseNumber *int `json:"phase_number"`
		Title string `json:"title"`
		Description string `json:"description"`
		Status string `json:"status"`
		Tasks string `json:"tasks"`
		StartedAt *time.Time `json:"started_at"`
		CompletedAt *time.Time `json:"completed_at"`
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
	if req.PhaseNumber != nil {
		updates["phase_number"] = *req.PhaseNumber
	}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Tasks != "" {
		updates["tasks"] = req.Tasks
	}
	if req.StartedAt != nil {
		updates["started_at"] = req.StartedAt
	}
	if req.CompletedAt != nil {
		updates["completed_at"] = req.CompletedAt
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update projectphase",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "ProjectPhase updated successfully",
	})
}

// Delete soft-deletes a projectphase.
func (h *ProjectPhaseHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var item models.ProjectPhase
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "ProjectPhase not found",
			},
		})
		return
	}

	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete projectphase",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "ProjectPhase deleted successfully",
	})
}

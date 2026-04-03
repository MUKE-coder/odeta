package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// ProjectHandler handles project endpoints.
type ProjectHandler struct {
	DB *gorm.DB
}

// List returns a paginated list of projects.
func (h *ProjectHandler) List(c *gin.Context) {
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

	allowedSorts := map[string]bool{"id": true, "created_at": true, "name": true, "slug": true, "type": true, "status": true, "description": true, "tech_stack": true, "github_repo_url": true, "github_repo_name": true, "subdomain": true, "custom_domain": true, "orbita_app_id": true, "user_id": true}
	if !allowedSorts[sortBy] {
		sortBy = "created_at"
	}

	query := h.DB.Model(&models.Project{})

	if search != "" {
		query = query.Where("name ILIKE ? OR slug ILIKE ? OR type ILIKE ? OR status ILIKE ? OR description ILIKE ? OR tech_stack ILIKE ? OR github_repo_url ILIKE ? OR github_repo_name ILIKE ? OR subdomain ILIKE ? OR custom_domain ILIKE ? OR orbita_app_id ILIKE ?", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Project
	offset := (page - 1) * pageSize
	if err := query.Order(sortBy + " " + sortOrder).Offset(offset).Limit(pageSize).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to fetch projects",
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

// GetByID returns a single project by ID.
func (h *ProjectHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	var item models.Project
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Project not found",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": item,
	})
}

// Create adds a new project.
func (h *ProjectHandler) Create(c *gin.Context) {
	var req struct {
		Name           string `json:"name" binding:"required"`
		Slug           string `json:"slug" binding:"required"`
		Type           string `json:"type" binding:"required"`
		Status         string `json:"status"`
		Description    string `json:"description"`
		TechStack      string `json:"tech_stack"`
		GithubRepoUrl  string `json:"github_repo_url"`
		GithubRepoName string `json:"github_repo_name"`
		Subdomain      string `json:"subdomain"`
		CustomDomain   string `json:"custom_domain"`
		OrbitaAppId    string `json:"orbita_app_id"`
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

	// Make slug unique by appending a random suffix
	slug := req.Slug
	var existingCount int64
	h.DB.Model(&models.Project{}).Where("slug = ?", slug).Count(&existingCount)
	if existingCount > 0 {
		r := rand.New(rand.NewSource(time.Now().UnixNano()))
		slug = fmt.Sprintf("%s-%d", slug, r.Intn(9999))
	}

	item := models.Project{
		Name:           req.Name,
		Slug:           slug,
		Type:           req.Type,
		Status:         req.Status,
		Description:    req.Description,
		TechStack:      req.TechStack,
		GithubRepoUrl:  req.GithubRepoUrl,
		GithubRepoName: req.GithubRepoName,
		OrbitaAppId:    req.OrbitaAppId,
		UserId:         c.GetUint("user_id"),
	}
	if req.Subdomain != "" {
		item.Subdomain = &req.Subdomain
	}
	if req.CustomDomain != "" {
		item.CustomDomain = &req.CustomDomain
	}

	if err := h.DB.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to create project",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusCreated, gin.H{
		"data":    item,
		"message": "Project created successfully",
	})
}

// Update modifies an existing project.
func (h *ProjectHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var item models.Project
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Project not found",
			},
		})
		return
	}

	var req struct {
		Name string `json:"name"`
		Slug string `json:"slug"`
		Type string `json:"type"`
		Status string `json:"status"`
		Description string `json:"description"`
		TechStack string `json:"tech_stack"`
		GithubRepoUrl string `json:"github_repo_url"`
		GithubRepoName string `json:"github_repo_name"`
		Subdomain string `json:"subdomain"`
		CustomDomain string `json:"custom_domain"`
		OrbitaAppId string `json:"orbita_app_id"`
		UserId *uint `json:"user_id"`
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
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Slug != "" {
		updates["slug"] = req.Slug
	}
	if req.Type != "" {
		updates["type"] = req.Type
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.TechStack != "" {
		updates["tech_stack"] = req.TechStack
	}
	if req.GithubRepoUrl != "" {
		updates["github_repo_url"] = req.GithubRepoUrl
	}
	if req.GithubRepoName != "" {
		updates["github_repo_name"] = req.GithubRepoName
	}
	if req.Subdomain != "" {
		updates["subdomain"] = &req.Subdomain
	}
	if req.CustomDomain != "" {
		updates["custom_domain"] = &req.CustomDomain
	}
	if req.OrbitaAppId != "" {
		updates["orbita_app_id"] = req.OrbitaAppId
	}
	if req.UserId != nil {
		updates["user_id"] = *req.UserId
	}

	if err := h.DB.Model(&item).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to update project",
			},
		})
		return
	}

	h.DB.First(&item, item.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    item,
		"message": "Project updated successfully",
	})
}

// Delete soft-deletes a project.
func (h *ProjectHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	var item models.Project
	if err := h.DB.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{
				"code":    "NOT_FOUND",
				"message": "Project not found",
			},
		})
		return
	}

	if err := h.DB.Delete(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{
				"code":    "INTERNAL_ERROR",
				"message": "Failed to delete project",
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project deleted successfully",
	})
}

// ListConversations returns all conversations for a project (ordered by created_at ASC).
func (h *ProjectHandler) ListConversations(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	// Verify project belongs to user
	var project models.Project
	if err := h.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"},
		})
		return
	}

	var conversations []models.Conversation
	if err := h.DB.Where("project_id = ?", projectID).Order("created_at asc").Find(&conversations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to load conversations"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": conversations})
}

// UpdateMetadata updates the project's metadata JSON field.
func (h *ProjectHandler) UpdateMetadata(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	var project models.Project
	if err := h.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"},
		})
		return
	}

	var body map[string]interface{}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	// Merge with existing metadata
	existing := make(map[string]interface{})
	if project.Metadata != nil && *project.Metadata != "" {
		json.Unmarshal([]byte(*project.Metadata), &existing)
	}
	for k, v := range body {
		existing[k] = v
	}

	merged, _ := json.Marshal(existing)
	mergedStr := string(merged)

	if err := h.DB.Model(&project).Update("metadata", &mergedStr).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to update metadata"},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": project})
}

package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// ProjectService handles business logic for projects.
type ProjectService struct {
	DB *gorm.DB
}

// ProjectListParams holds pagination and filter parameters.
type ProjectListParams struct {
	Page      int
	PageSize  int
	Search    string
	SortBy    string
	SortOrder string
}

// List returns a paginated list of projects.
func (s *ProjectService) List(params ProjectListParams) ([]models.Project, int64, int, error) {
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}
	if params.SortOrder != "asc" && params.SortOrder != "desc" {
		params.SortOrder = "desc"
	}
	if params.SortBy == "" {
		params.SortBy = "created_at"
	}

	query := s.DB.Model(&models.Project{})

	if params.Search != "" {
		query = query.Where("name ILIKE ? OR slug ILIKE ? OR type ILIKE ? OR status ILIKE ? OR description ILIKE ? OR tech_stack ILIKE ? OR github_repo_url ILIKE ? OR github_repo_name ILIKE ? OR subdomain ILIKE ? OR custom_domain ILIKE ? OR orbita_app_id ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Project
	offset := (params.Page - 1) * params.PageSize
	if err := query.Order(params.SortBy + " " + params.SortOrder).Offset(offset).Limit(params.PageSize).Find(&items).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching projects: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return items, total, pages, nil
}

// GetByID returns a single project by ID.
func (s *ProjectService) GetByID(id uint) (*models.Project, error) {
	var item models.Project
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}
	return &item, nil
}

// Create creates a new project.
func (s *ProjectService) Create(item *models.Project) error {
	if err := s.DB.Create(item).Error; err != nil {
		return fmt.Errorf("creating project: %w", err)
	}
	return nil
}

// Update modifies an existing project.
func (s *ProjectService) Update(id uint, updates map[string]interface{}) (*models.Project, error) {
	var item models.Project
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("project not found: %w", err)
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating project: %w", err)
	}

	s.DB.First(&item, id)
	return &item, nil
}

// Delete soft-deletes a project.
func (s *ProjectService) Delete(id uint) error {
	var item models.Project
	if err := s.DB.First(&item, id).Error; err != nil {
		return fmt.Errorf("project not found: %w", err)
	}
	if err := s.DB.Delete(&item).Error; err != nil {
		return fmt.Errorf("deleting project: %w", err)
	}
	return nil
}

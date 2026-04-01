package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// ProjectPhaseService handles business logic for project_phases.
type ProjectPhaseService struct {
	DB *gorm.DB
}

// ProjectPhaseListParams holds pagination and filter parameters.
type ProjectPhaseListParams struct {
	Page      int
	PageSize  int
	Search    string
	SortBy    string
	SortOrder string
}

// List returns a paginated list of project_phases.
func (s *ProjectPhaseService) List(params ProjectPhaseListParams) ([]models.ProjectPhase, int64, int, error) {
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

	query := s.DB.Model(&models.ProjectPhase{})

	if params.Search != "" {
		query = query.Where("title ILIKE ? OR description ILIKE ? OR status ILIKE ? OR tasks ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.ProjectPhase
	offset := (params.Page - 1) * params.PageSize
	if err := query.Order(params.SortBy + " " + params.SortOrder).Offset(offset).Limit(params.PageSize).Find(&items).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching project_phases: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return items, total, pages, nil
}

// GetByID returns a single projectphase by ID.
func (s *ProjectPhaseService) GetByID(id uint) (*models.ProjectPhase, error) {
	var item models.ProjectPhase
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("projectphase not found: %w", err)
	}
	return &item, nil
}

// Create creates a new projectphase.
func (s *ProjectPhaseService) Create(item *models.ProjectPhase) error {
	if err := s.DB.Create(item).Error; err != nil {
		return fmt.Errorf("creating projectphase: %w", err)
	}
	return nil
}

// Update modifies an existing projectphase.
func (s *ProjectPhaseService) Update(id uint, updates map[string]interface{}) (*models.ProjectPhase, error) {
	var item models.ProjectPhase
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("projectphase not found: %w", err)
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating projectphase: %w", err)
	}

	s.DB.First(&item, id)
	return &item, nil
}

// Delete soft-deletes a projectphase.
func (s *ProjectPhaseService) Delete(id uint) error {
	var item models.ProjectPhase
	if err := s.DB.First(&item, id).Error; err != nil {
		return fmt.Errorf("projectphase not found: %w", err)
	}
	if err := s.DB.Delete(&item).Error; err != nil {
		return fmt.Errorf("deleting projectphase: %w", err)
	}
	return nil
}

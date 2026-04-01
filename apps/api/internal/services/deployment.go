package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// DeploymentService handles business logic for deployments.
type DeploymentService struct {
	DB *gorm.DB
}

// DeploymentListParams holds pagination and filter parameters.
type DeploymentListParams struct {
	Page      int
	PageSize  int
	Search    string
	SortBy    string
	SortOrder string
}

// List returns a paginated list of deployments.
func (s *DeploymentService) List(params DeploymentListParams) ([]models.Deployment, int64, int, error) {
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

	query := s.DB.Model(&models.Deployment{})

	if params.Search != "" {
		query = query.Where("status ILIKE ? OR subdomain ILIKE ? OR logs ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Deployment
	offset := (params.Page - 1) * params.PageSize
	if err := query.Order(params.SortBy + " " + params.SortOrder).Offset(offset).Limit(params.PageSize).Find(&items).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching deployments: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return items, total, pages, nil
}

// GetByID returns a single deployment by ID.
func (s *DeploymentService) GetByID(id uint) (*models.Deployment, error) {
	var item models.Deployment
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("deployment not found: %w", err)
	}
	return &item, nil
}

// Create creates a new deployment.
func (s *DeploymentService) Create(item *models.Deployment) error {
	if err := s.DB.Create(item).Error; err != nil {
		return fmt.Errorf("creating deployment: %w", err)
	}
	return nil
}

// Update modifies an existing deployment.
func (s *DeploymentService) Update(id uint, updates map[string]interface{}) (*models.Deployment, error) {
	var item models.Deployment
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("deployment not found: %w", err)
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating deployment: %w", err)
	}

	s.DB.First(&item, id)
	return &item, nil
}

// Delete soft-deletes a deployment.
func (s *DeploymentService) Delete(id uint) error {
	var item models.Deployment
	if err := s.DB.First(&item, id).Error; err != nil {
		return fmt.Errorf("deployment not found: %w", err)
	}
	if err := s.DB.Delete(&item).Error; err != nil {
		return fmt.Errorf("deleting deployment: %w", err)
	}
	return nil
}

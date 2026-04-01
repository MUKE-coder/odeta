package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// CreditLogService handles business logic for credit_logs.
type CreditLogService struct {
	DB *gorm.DB
}

// CreditLogListParams holds pagination and filter parameters.
type CreditLogListParams struct {
	Page      int
	PageSize  int
	Search    string
	SortBy    string
	SortOrder string
}

// List returns a paginated list of credit_logs.
func (s *CreditLogService) List(params CreditLogListParams) ([]models.CreditLog, int64, int, error) {
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

	query := s.DB.Model(&models.CreditLog{})

	if params.Search != "" {
		query = query.Where("type ILIKE ? OR description ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.CreditLog
	offset := (params.Page - 1) * params.PageSize
	if err := query.Order(params.SortBy + " " + params.SortOrder).Offset(offset).Limit(params.PageSize).Find(&items).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching credit_logs: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return items, total, pages, nil
}

// GetByID returns a single creditlog by ID.
func (s *CreditLogService) GetByID(id uint) (*models.CreditLog, error) {
	var item models.CreditLog
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("creditlog not found: %w", err)
	}
	return &item, nil
}

// Create creates a new creditlog.
func (s *CreditLogService) Create(item *models.CreditLog) error {
	if err := s.DB.Create(item).Error; err != nil {
		return fmt.Errorf("creating creditlog: %w", err)
	}
	return nil
}

// Update modifies an existing creditlog.
func (s *CreditLogService) Update(id uint, updates map[string]interface{}) (*models.CreditLog, error) {
	var item models.CreditLog
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("creditlog not found: %w", err)
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating creditlog: %w", err)
	}

	s.DB.First(&item, id)
	return &item, nil
}

// Delete soft-deletes a creditlog.
func (s *CreditLogService) Delete(id uint) error {
	var item models.CreditLog
	if err := s.DB.First(&item, id).Error; err != nil {
		return fmt.Errorf("creditlog not found: %w", err)
	}
	if err := s.DB.Delete(&item).Error; err != nil {
		return fmt.Errorf("deleting creditlog: %w", err)
	}
	return nil
}

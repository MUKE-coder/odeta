package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// SubscriptionService handles business logic for subscriptions.
type SubscriptionService struct {
	DB *gorm.DB
}

// SubscriptionListParams holds pagination and filter parameters.
type SubscriptionListParams struct {
	Page      int
	PageSize  int
	Search    string
	SortBy    string
	SortOrder string
}

// List returns a paginated list of subscriptions.
func (s *SubscriptionService) List(params SubscriptionListParams) ([]models.Subscription, int64, int, error) {
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

	query := s.DB.Model(&models.Subscription{})

	if params.Search != "" {
		query = query.Where("stripe_subscription_id ILIKE ? OR stripe_price_id ILIKE ? OR status ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Subscription
	offset := (params.Page - 1) * params.PageSize
	if err := query.Order(params.SortBy + " " + params.SortOrder).Offset(offset).Limit(params.PageSize).Find(&items).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching subscriptions: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return items, total, pages, nil
}

// GetByID returns a single subscription by ID.
func (s *SubscriptionService) GetByID(id uint) (*models.Subscription, error) {
	var item models.Subscription
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}
	return &item, nil
}

// Create creates a new subscription.
func (s *SubscriptionService) Create(item *models.Subscription) error {
	if err := s.DB.Create(item).Error; err != nil {
		return fmt.Errorf("creating subscription: %w", err)
	}
	return nil
}

// Update modifies an existing subscription.
func (s *SubscriptionService) Update(id uint, updates map[string]interface{}) (*models.Subscription, error) {
	var item models.Subscription
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating subscription: %w", err)
	}

	s.DB.First(&item, id)
	return &item, nil
}

// Delete soft-deletes a subscription.
func (s *SubscriptionService) Delete(id uint) error {
	var item models.Subscription
	if err := s.DB.First(&item, id).Error; err != nil {
		return fmt.Errorf("subscription not found: %w", err)
	}
	if err := s.DB.Delete(&item).Error; err != nil {
		return fmt.Errorf("deleting subscription: %w", err)
	}
	return nil
}

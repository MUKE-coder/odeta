package services

import (
	"fmt"
	"math"

	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

// ConversationService handles business logic for conversations.
type ConversationService struct {
	DB *gorm.DB
}

// ConversationListParams holds pagination and filter parameters.
type ConversationListParams struct {
	Page      int
	PageSize  int
	Search    string
	SortBy    string
	SortOrder string
}

// List returns a paginated list of conversations.
func (s *ConversationService) List(params ConversationListParams) ([]models.Conversation, int64, int, error) {
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

	query := s.DB.Model(&models.Conversation{})

	if params.Search != "" {
		query = query.Where("role ILIKE ? OR content ILIKE ? OR phase ILIKE ? OR metadata ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	var total int64
	query.Count(&total)

	var items []models.Conversation
	offset := (params.Page - 1) * params.PageSize
	if err := query.Order(params.SortBy + " " + params.SortOrder).Offset(offset).Limit(params.PageSize).Find(&items).Error; err != nil {
		return nil, 0, 0, fmt.Errorf("fetching conversations: %w", err)
	}

	pages := int(math.Ceil(float64(total) / float64(params.PageSize)))
	return items, total, pages, nil
}

// GetByID returns a single conversation by ID.
func (s *ConversationService) GetByID(id uint) (*models.Conversation, error) {
	var item models.Conversation
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}
	return &item, nil
}

// Create creates a new conversation.
func (s *ConversationService) Create(item *models.Conversation) error {
	if err := s.DB.Create(item).Error; err != nil {
		return fmt.Errorf("creating conversation: %w", err)
	}
	return nil
}

// Update modifies an existing conversation.
func (s *ConversationService) Update(id uint, updates map[string]interface{}) (*models.Conversation, error) {
	var item models.Conversation
	if err := s.DB.First(&item, id).Error; err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}

	if err := s.DB.Model(&item).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("updating conversation: %w", err)
	}

	s.DB.First(&item, id)
	return &item, nil
}

// Delete soft-deletes a conversation.
func (s *ConversationService) Delete(id uint) error {
	var item models.Conversation
	if err := s.DB.First(&item, id).Error; err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}
	if err := s.DB.Delete(&item).Error; err != nil {
		return fmt.Errorf("deleting conversation: %w", err)
	}
	return nil
}

package models

import (
	"time"

	"gorm.io/gorm"
)

// Conversation role constants
const (
	ConversationRoleUser      = "USER"
	ConversationRoleAssistant = "ASSISTANT"
	ConversationRoleSystem    = "SYSTEM"
)

// Conversation phase constants
const (
	ConversationPhaseDiscovery  = "DISCOVERY"
	ConversationPhasePlanning   = "PLANNING"
	ConversationPhaseBuilding   = "BUILDING"
	ConversationPhaseIteration  = "ITERATION"
)

// Conversation represents a chat message in a project.
type Conversation struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	ProjectId   uint           `gorm:"index;not null" json:"project_id"`
	Project     Project        `gorm:"foreignKey:ProjectId" json:"project,omitempty"`
	Role        string         `gorm:"size:20;not null" json:"role" binding:"required"`
	Content     string         `gorm:"type:text;not null" json:"content" binding:"required"`
	Phase       string         `gorm:"size:20" json:"phase"`
	CreditsUsed int            `gorm:"default:0" json:"credits_used"`
	Metadata    string         `gorm:"type:text" json:"metadata"`
	CreatedAt   time.Time      `gorm:"index" json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

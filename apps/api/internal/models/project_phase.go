package models

import (
	"time"

	"gorm.io/gorm"
)

// PhaseStatus constants
const (
	PhaseStatusPending    = "PENDING"
	PhaseStatusInProgress = "IN_PROGRESS"
	PhaseStatusCompleted  = "COMPLETED"
	PhaseStatusFailed     = "FAILED"
)

// ProjectPhase represents a build phase within a project.
type ProjectPhase struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	ProjectId   uint           `gorm:"index;not null" json:"project_id"`
	Project     Project        `gorm:"foreignKey:ProjectId" json:"project,omitempty"`
	PhaseNumber int            `gorm:"not null" json:"phase_number"`
	Title       string         `gorm:"size:255;not null" json:"title" binding:"required"`
	Description string         `gorm:"type:text" json:"description"`
	Status      string         `gorm:"size:20;default:'PENDING'" json:"status"`
	Tasks       string         `gorm:"type:text" json:"tasks"`
	StartedAt   *time.Time     `json:"started_at"`
	CompletedAt *time.Time     `json:"completed_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

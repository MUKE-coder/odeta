package models

import (
	"time"

	"gorm.io/gorm"
)

// DeploymentStatus constants
const (
	DeploymentStatusPending  = "PENDING"
	DeploymentStatusBuilding = "BUILDING"
	DeploymentStatusLive     = "LIVE"
	DeploymentStatusFailed   = "FAILED"
)

// Deployment represents an Orbita deployment record.
type Deployment struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	ProjectId  uint           `gorm:"index;not null" json:"project_id"`
	Project    Project        `gorm:"foreignKey:ProjectId" json:"project,omitempty"`
	Status     string         `gorm:"size:20;default:'PENDING'" json:"status"`
	Subdomain  string         `gorm:"size:255;uniqueIndex" json:"subdomain"`
	Logs       string         `gorm:"type:text" json:"logs"`
	DeployedAt *time.Time     `json:"deployed_at"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

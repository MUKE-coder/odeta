package models

import (
	"time"

	"gorm.io/gorm"
)

// ProjectType constants
const (
	ProjectTypeWebsite = "WEBSITE"
	ProjectTypeWebApp  = "WEB_APP"
)

// ProjectStatus constants
const (
	ProjectStatusDraft    = "DRAFT"
	ProjectStatusBuilding = "BUILDING"
	ProjectStatusBuilt    = "BUILT"
	ProjectStatusDeployed = "DEPLOYED"
	ProjectStatusFailed   = "FAILED"
	ProjectStatusPaused   = "PAUSED"
)

// Project represents a user-created project.
type Project struct {
	ID             uint           `gorm:"primarykey" json:"id"`
	Name           string         `gorm:"size:255;not null" json:"name" binding:"required"`
	Slug           string         `gorm:"size:255;uniqueIndex;not null" json:"slug" binding:"required"`
	Type           string         `gorm:"size:20;default:'WEB_APP'" json:"type"`
	Status         string         `gorm:"size:20;default:'DRAFT'" json:"status"`
	Description    string         `gorm:"type:text" json:"description"`
	TechStack      string         `gorm:"type:text" json:"tech_stack"`
	GithubRepoUrl  string         `gorm:"size:500" json:"github_repo_url"`
	GithubRepoName string         `gorm:"size:255" json:"github_repo_name"`
	Subdomain      *string        `gorm:"size:255;uniqueIndex" json:"subdomain"`
	CustomDomain   *string        `gorm:"size:255;uniqueIndex" json:"custom_domain"`
	OrbitaAppId    string         `gorm:"size:255" json:"orbita_app_id"`
	UserId         uint           `gorm:"index;not null" json:"user_id"`
	User           User           `gorm:"foreignKey:UserId" json:"user,omitempty"`
	Conversations  []Conversation `gorm:"foreignKey:ProjectId" json:"conversations,omitempty"`
	Phases         []ProjectPhase `gorm:"foreignKey:ProjectId" json:"phases,omitempty"`
	Deployments    []Deployment   `gorm:"foreignKey:ProjectId" json:"deployments,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

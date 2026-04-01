package models

import (
	"time"

	"gorm.io/gorm"
)

// CreditEventType constants
const (
	CreditEventEarned         = "EARNED"
	CreditEventSpentMessage   = "SPENT_MESSAGE"
	CreditEventSpentGenerate  = "SPENT_GENERATION"
	CreditEventSpentCommand   = "SPENT_COMMAND"
	CreditEventMonthlyReset   = "MONTHLY_RESET"
	CreditEventPurchase       = "PURCHASE"
)

// CreditLog represents an audit trail entry for credit transactions.
type CreditLog struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	UserId      uint           `gorm:"index;not null" json:"user_id"`
	User        User           `gorm:"foreignKey:UserId" json:"user,omitempty"`
	Amount      int            `gorm:"not null" json:"amount"`
	Type        string         `gorm:"size:30;not null" json:"type" binding:"required"`
	Description string         `gorm:"size:500;not null" json:"description" binding:"required"`
	ProjectId   *uint          `gorm:"index" json:"project_id"`
	CreatedAt   time.Time      `gorm:"index" json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

package models

import (
	"time"

	"gorm.io/gorm"
)

// SubscriptionStatus constants
const (
	SubscriptionStatusActive   = "active"
	SubscriptionStatusPastDue  = "past_due"
	SubscriptionStatusCanceled = "canceled"
	SubscriptionStatusTrialing = "trialing"
)

// Subscription represents a Stripe subscription record.
type Subscription struct {
	ID                   uint           `gorm:"primarykey" json:"id"`
	UserId               uint           `gorm:"index;not null" json:"user_id"`
	User                 User           `gorm:"foreignKey:UserId" json:"user,omitempty"`
	StripeSubscriptionId string         `gorm:"size:255;uniqueIndex;not null" json:"stripe_subscription_id"`
	StripePriceId        string         `gorm:"size:255;not null" json:"stripe_price_id"`
	Status               string         `gorm:"size:30;not null" json:"status"`
	CurrentPeriodStart   *time.Time     `json:"current_period_start"`
	CurrentPeriodEnd     *time.Time     `json:"current_period_end"`
	CancelAtPeriodEnd    bool           `gorm:"default:false" json:"cancel_at_period_end"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"-"`
}

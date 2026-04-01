package models

import (
	"fmt"
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Role constants
const (
	RoleAdmin  = "ADMIN"
	RoleEditor = "EDITOR"
	RoleUser   = "USER"
	// grit:roles
)

// Plan constants
const (
	PlanFree    = "free"
	PlanStarter = "starter"
	PlanPro     = "pro"
)

// PlanCredits maps plan names to their monthly credit allowance.
var PlanCredits = map[string]int{
	PlanFree:    100,
	PlanStarter: 500,
	PlanPro:     2000,
}

// User represents a user in the system.
type User struct {
	ID              uint           `gorm:"primarykey" json:"id"`
	FirstName       string         `gorm:"size:255;not null" json:"first_name" binding:"required"`
	LastName        string         `gorm:"size:255;not null" json:"last_name" binding:"required"`
	Email           string         `gorm:"size:255;uniqueIndex;not null" json:"email" binding:"required,email"`
	Password        string         `gorm:"size:255" json:"-"`
	Role            string         `gorm:"size:20;default:USER" json:"role"`
	Avatar          string         `gorm:"size:500" json:"avatar"`
	JobTitle        string         `gorm:"size:255" json:"job_title"`
	Bio             string         `gorm:"type:text" json:"bio"`
	Active          bool           `gorm:"default:true" json:"active"`
	Provider        string         `gorm:"size:50;default:'local'" json:"provider"`
	GoogleID        string         `gorm:"size:255" json:"-"`
	GithubID        string         `gorm:"size:255" json:"-"`
	EmailVerifiedAt *time.Time     `json:"email_verified_at"`
	IPAddress       string         `gorm:"size:45" json:"ip_address"`
	MACAddress      string         `gorm:"size:50" json:"mac_address"`

	// Odeta-specific fields
	Credits          int       `gorm:"default:100" json:"credits"`
	CreditsResetAt   time.Time `json:"credits_reset_at"`
	Plan             string    `gorm:"size:20;default:'free'" json:"plan"`
	StripeCustomerID *string   `gorm:"size:255;uniqueIndex" json:"stripe_customer_id"`
	GithubToken      string    `gorm:"size:500" json:"-"`

	// Associations
	Projects      []Project      `gorm:"foreignKey:UserId" json:"projects,omitempty"`
	CreditLogs    []CreditLog    `gorm:"foreignKey:UserId" json:"credit_logs,omitempty"`
	Subscriptions []Subscription `gorm:"foreignKey:UserId" json:"subscriptions,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// BeforeCreate hashes the password before saving.
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// CheckPassword compares the given password with the stored hash.
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// Models returns the ordered list of all models for migration.
// Models with no foreign key dependencies come first.
func Models() []interface{} {
	return []interface{}{
		&User{},
		&Upload{},
		&Blog{},
		&UIComponent{},
		&TwoFactorConfig{},
		&TrustedDevice{},
		&TOTPPendingToken{},
		&Project{},
		&Conversation{},
		&ProjectPhase{},
		&CreditLog{},
		&Deployment{},
		&Subscription{},
		// grit:models
	}
}

// Migrate runs database migrations for all models (creates new tables and adds new columns).
func Migrate(db *gorm.DB) error {
	models := Models()

	log.Println("Running migrations...")
	if err := db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}
	log.Printf("Migration complete — %d model(s) synced.", len(models))

	return nil
}

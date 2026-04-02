package credits

import (
	"context"
	"fmt"
	"time"

	"odeta/apps/api/internal/cache"
	"odeta/apps/api/internal/models"

	"gorm.io/gorm"
)

const creditCacheTTL = 5 * time.Second

func creditCacheKey(userID uint) string {
	return fmt.Sprintf("credits:balance:%d", userID)
}

// Service handles all credit operations with atomic DB transactions.
type Service struct {
	db    *gorm.DB
	cache *cache.Cache
}

// New creates a new credits service.
func New(db *gorm.DB, c *cache.Cache) *Service {
	return &Service{db: db, cache: c}
}

// CheckResult contains the result of a credit check.
type CheckResult struct {
	HasEnough bool `json:"has_enough"`
	Balance   int  `json:"balance"`
	Required  int  `json:"required"`
}

// Check verifies if the user has enough credits for an operation.
func (s *Service) Check(userID uint, required int) (CheckResult, error) {
	var user models.User
	if err := s.db.Select("credits").First(&user, userID).Error; err != nil {
		return CheckResult{}, fmt.Errorf("failed to fetch user credits: %w", err)
	}

	return CheckResult{
		HasEnough: user.Credits >= required,
		Balance:   user.Credits,
		Required:  required,
	}, nil
}

// Deduct atomically deducts credits from a user and logs the transaction.
// Returns the new balance or an error if insufficient credits.
func (s *Service) Deduct(userID uint, amount int, eventType, description string, projectID *uint) (int, error) {
	var newBalance int

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		// Lock the row for update to prevent race conditions
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&user, userID).Error; err != nil {
			return fmt.Errorf("user not found: %w", err)
		}

		if user.Credits < amount {
			return fmt.Errorf("insufficient credits: have %d, need %d", user.Credits, amount)
		}

		newBalance = user.Credits - amount

		if err := tx.Model(&user).Update("credits", newBalance).Error; err != nil {
			return fmt.Errorf("failed to update credits: %w", err)
		}

		log := models.CreditLog{
			UserId:      userID,
			Amount:      -amount,
			Type:        eventType,
			Description: description,
			ProjectId:   projectID,
		}
		if err := tx.Create(&log).Error; err != nil {
			return fmt.Errorf("failed to create credit log: %w", err)
		}

		return nil
	})

	if err == nil {
		s.invalidateBalanceCache(userID)
	}

	return newBalance, err
}

// Add atomically adds credits to a user and logs the transaction.
func (s *Service) Add(userID uint, amount int, eventType, description string) (int, error) {
	var newBalance int

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&user, userID).Error; err != nil {
			return fmt.Errorf("user not found: %w", err)
		}

		newBalance = user.Credits + amount

		if err := tx.Model(&user).Update("credits", newBalance).Error; err != nil {
			return fmt.Errorf("failed to update credits: %w", err)
		}

		log := models.CreditLog{
			UserId:      userID,
			Amount:      amount,
			Type:        eventType,
			Description: description,
		}
		if err := tx.Create(&log).Error; err != nil {
			return fmt.Errorf("failed to create credit log: %w", err)
		}

		return nil
	})

	if err == nil {
		s.invalidateBalanceCache(userID)
	}

	return newBalance, err
}

// Reset resets a user's credits to their plan's monthly allowance.
// Called by the daily cron job when CreditsResetAt has passed.
func (s *Service) Reset(userID uint) error {
	defer s.invalidateBalanceCache(userID)

	return s.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Set("gorm:query_option", "FOR UPDATE").First(&user, userID).Error; err != nil {
			return fmt.Errorf("user not found: %w", err)
		}

		allowance, ok := models.PlanCredits[user.Plan]
		if !ok {
			allowance = models.PlanCredits[models.PlanFree]
		}

		nextReset := time.Now().Add(30 * 24 * time.Hour)

		if err := tx.Model(&user).Updates(map[string]interface{}{
			"credits":          allowance,
			"credits_reset_at": nextReset,
		}).Error; err != nil {
			return fmt.Errorf("failed to reset credits: %w", err)
		}

		log := models.CreditLog{
			UserId:      userID,
			Amount:      allowance,
			Type:        models.CreditEventMonthlyReset,
			Description: fmt.Sprintf("Monthly credit reset (%s plan: %d credits)", user.Plan, allowance),
		}
		if err := tx.Create(&log).Error; err != nil {
			return fmt.Errorf("failed to create credit log: %w", err)
		}

		return nil
	})
}

// Balance returns the current credit balance for a user (Redis cached, 5s TTL).
func (s *Service) Balance(userID uint) (int, error) {
	ctx := context.Background()
	key := creditCacheKey(userID)

	// Try cache first
	if s.cache != nil {
		var balance int
		if found, err := s.cache.Get(ctx, key, &balance); err == nil && found {
			return balance, nil
		}
	}

	// Cache miss — hit DB
	var user models.User
	if err := s.db.Select("credits").First(&user, userID).Error; err != nil {
		return 0, fmt.Errorf("user not found: %w", err)
	}

	// Store in cache
	if s.cache != nil {
		_ = s.cache.Set(ctx, key, user.Credits, creditCacheTTL)
	}

	return user.Credits, nil
}

// invalidateBalanceCache removes the cached balance for a user.
func (s *Service) invalidateBalanceCache(userID uint) {
	if s.cache != nil {
		_ = s.cache.Delete(context.Background(), creditCacheKey(userID))
	}
}

// Initialize sets up credits for a newly registered user and logs the event.
func (s *Service) Initialize(userID uint, plan string) error {
	allowance, ok := models.PlanCredits[plan]
	if !ok {
		allowance = models.PlanCredits[models.PlanFree]
	}

	nextReset := time.Now().Add(30 * 24 * time.Hour)

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"credits":          allowance,
			"credits_reset_at": nextReset,
			"plan":             plan,
		}).Error; err != nil {
			return fmt.Errorf("failed to initialize credits: %w", err)
		}

		log := models.CreditLog{
			UserId:      userID,
			Amount:      allowance,
			Type:        models.CreditEventEarned,
			Description: fmt.Sprintf("Welcome credits (%s plan: %d credits)", plan, allowance),
		}
		if err := tx.Create(&log).Error; err != nil {
			return fmt.Errorf("failed to log credit initialization: %w", err)
		}

		return nil
	})
}

// ResetAllDue finds all users whose credits are due for reset and resets them.
// Returns the number of users reset.
func (s *Service) ResetAllDue() (int, error) {
	var users []models.User
	if err := s.db.Where("credits_reset_at <= ?", time.Now()).Find(&users).Error; err != nil {
		return 0, fmt.Errorf("failed to find users due for reset: %w", err)
	}

	resetCount := 0
	for _, user := range users {
		if err := s.Reset(user.ID); err != nil {
			// Log but don't stop — continue with other users
			fmt.Printf("Warning: failed to reset credits for user %d: %v\n", user.ID, err)
			continue
		}
		resetCount++
	}

	return resetCount, nil
}

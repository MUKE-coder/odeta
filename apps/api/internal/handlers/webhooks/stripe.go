package webhooks

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/credits"
)

// StripeWebhook handles Stripe webhook events.
type StripeWebhook struct {
	DB            *gorm.DB
	Credits       *credits.Service
	WebhookSecret string
}

// Handle processes incoming Stripe webhook events.
func (h *StripeWebhook) Handle(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	// Verify webhook signature
	event, err := webhook.ConstructEvent(body, c.GetHeader("Stripe-Signature"), h.WebhookSecret)
	if err != nil {
		log.Printf("Stripe webhook signature verification failed: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	log.Printf("Stripe webhook: %s", event.Type)

	switch event.Type {
	case "checkout.session.completed":
		h.handleCheckoutCompleted(event)
	case "customer.subscription.updated":
		h.handleSubscriptionUpdated(event)
	case "customer.subscription.deleted":
		h.handleSubscriptionDeleted(event)
	case "invoice.payment_failed":
		h.handlePaymentFailed(event)
	default:
		log.Printf("Stripe webhook: unhandled event type %s", event.Type)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *StripeWebhook) handleCheckoutCompleted(event stripe.Event) {
	var session stripe.CheckoutSession
	if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
		log.Printf("Stripe webhook: failed to unmarshal checkout session: %v", err)
		return
	}

	customerID := session.Customer.ID
	if customerID == "" {
		return
	}

	// Find user by Stripe customer ID
	var user models.User
	if err := h.DB.Where("stripe_customer_id = ?", customerID).First(&user).Error; err != nil {
		log.Printf("Stripe webhook: user not found for customer %s", customerID)
		return
	}

	if session.Mode == stripe.CheckoutSessionModeSubscription && session.Subscription != nil {
		subscriptionID := session.Subscription.ID

		// Determine plan from subscription
		plan := determinePlanFromSubscription(subscriptionID)

		// Create or update subscription record
		now := time.Now()
		periodEnd := now.Add(30 * 24 * time.Hour)
		sub := models.Subscription{
			UserId:               user.ID,
			StripeSubscriptionId: subscriptionID,
			StripePriceId:        "", // populated by subscription.updated
			Status:               models.SubscriptionStatusActive,
			CurrentPeriodStart:   &now,
			CurrentPeriodEnd:     &periodEnd,
		}
		h.DB.Create(&sub)

		// Update user plan and add credits
		h.DB.Model(&user).Update("plan", plan)
		allowance := models.PlanCredits[plan]
		h.Credits.Add(user.ID, allowance, models.CreditEventPurchase,
			fmt.Sprintf("Subscription activated: %s plan (%d credits)", plan, allowance))

		log.Printf("Stripe: activated %s plan for user %d", plan, user.ID)
	}
}

func (h *StripeWebhook) handleSubscriptionUpdated(event stripe.Event) {
	var sub stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
		log.Printf("Stripe webhook: failed to unmarshal subscription: %v", err)
		return
	}

	// Update subscription record
	updates := map[string]interface{}{
		"status":              string(sub.Status),
		"cancel_at_period_end": sub.CancelAtPeriodEnd,
	}
	if sub.CurrentPeriodStart > 0 {
		t := time.Unix(sub.CurrentPeriodStart, 0)
		updates["current_period_start"] = &t
	}
	if sub.CurrentPeriodEnd > 0 {
		t := time.Unix(sub.CurrentPeriodEnd, 0)
		updates["current_period_end"] = &t
	}
	if len(sub.Items.Data) > 0 {
		updates["stripe_price_id"] = sub.Items.Data[0].Price.ID
	}

	h.DB.Model(&models.Subscription{}).
		Where("stripe_subscription_id = ?", sub.ID).
		Updates(updates)

	// Update user plan
	var dbSub models.Subscription
	if err := h.DB.Where("stripe_subscription_id = ?", sub.ID).First(&dbSub).Error; err == nil {
		plan := determinePlanFromSubscription(sub.ID)
		h.DB.Model(&models.User{}).Where("id = ?", dbSub.UserId).Update("plan", plan)
	}
}

func (h *StripeWebhook) handleSubscriptionDeleted(event stripe.Event) {
	var sub stripe.Subscription
	if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
		return
	}

	// Update subscription status
	h.DB.Model(&models.Subscription{}).
		Where("stripe_subscription_id = ?", sub.ID).
		Update("status", models.SubscriptionStatusCanceled)

	// Downgrade user to free plan
	var dbSub models.Subscription
	if err := h.DB.Where("stripe_subscription_id = ?", sub.ID).First(&dbSub).Error; err == nil {
		h.DB.Model(&models.User{}).Where("id = ?", dbSub.UserId).Update("plan", models.PlanFree)
		log.Printf("Stripe: downgraded user %d to free plan", dbSub.UserId)
	}
}

func (h *StripeWebhook) handlePaymentFailed(event stripe.Event) {
	var invoice stripe.Invoice
	if err := json.Unmarshal(event.Data.Raw, &invoice); err != nil {
		return
	}

	if invoice.Customer == nil {
		return
	}

	var user models.User
	if err := h.DB.Where("stripe_customer_id = ?", invoice.Customer.ID).First(&user).Error; err == nil {
		log.Printf("Stripe: payment failed for user %d (%s)", user.ID, user.Email)
		// TODO: send payment failed email via mailer
	}
}

// determinePlanFromSubscription determines the plan based on subscription price.
// In production, this would check the price ID against configured tier prices.
func determinePlanFromSubscription(subscriptionID string) string {
	// Default to starter — in production, look up the price ID
	return models.PlanStarter
}

package webhooks

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/credits"
)

// DGatewayWebhook handles DGateway webhook events.
type DGatewayWebhook struct {
	DB      *gorm.DB
	Credits *credits.Service
}

// dgatewayEvent matches the DGateway webhook payload format.
type dgatewayEvent struct {
	Event     string `json:"event"`
	Timestamp string `json:"timestamp"`
	Data      struct {
		Reference     string                 `json:"reference"`
		Status        string                 `json:"status"`
		Amount        int                    `json:"amount"`
		Currency      string                 `json:"currency"`
		FailureReason string                 `json:"failure_reason"`
		Metadata      map[string]interface{} `json:"metadata"`
	} `json:"data"`
}

// Handle processes incoming DGateway webhook events.
func (h *DGatewayWebhook) Handle(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	var event dgatewayEvent
	if err := json.Unmarshal(body, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	log.Printf("DGateway webhook: event=%s ref=%s status=%s", event.Event, event.Data.Reference, event.Data.Status)

	switch event.Event {
	case "transaction.completed":
		h.handleTransactionCompleted(event)
	case "subscription.payment_completed":
		h.handleTransactionCompleted(event)
	default:
		log.Printf("DGateway webhook: unhandled event type: %s", event.Event)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *DGatewayWebhook) handleTransactionCompleted(event dgatewayEvent) {
	metadata := event.Data.Metadata

	// Extract user_id and credit_count from metadata
	userIDFloat, ok := metadata["user_id"].(float64)
	if !ok {
		log.Printf("DGateway: missing user_id in metadata")
		return
	}
	userID := uint(userIDFloat)

	creditCountFloat, ok := metadata["credit_count"].(float64)
	if !ok {
		log.Printf("DGateway: missing credit_count in metadata")
		return
	}
	creditCount := int(creditCountFloat)

	plan, _ := metadata["plan"].(string)

	if userID == 0 || creditCount == 0 {
		log.Printf("DGateway: invalid user_id=%d or credit_count=%d", userID, creditCount)
		return
	}

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		log.Printf("DGateway: user %d not found", userID)
		return
	}

	// Add credits
	newBalance, err := h.Credits.Add(userID, creditCount, models.CreditEventPurchase,
		fmt.Sprintf("DGateway purchase: %d credits (%s %d)",
			creditCount, event.Data.Currency, event.Data.Amount))
	if err != nil {
		log.Printf("DGateway: failed to add credits for user %d: %v", userID, err)
		return
	}

	// Update plan if upgrading
	if plan != "" && plan != user.Plan {
		h.DB.Model(&user).Update("plan", plan)
		log.Printf("DGateway: upgraded user %d to plan %s", userID, plan)
	}

	log.Printf("DGateway: added %d credits to user %d (new balance: %d)", creditCount, userID, newBalance)
}

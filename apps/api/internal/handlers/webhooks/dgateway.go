package webhooks

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
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

// DGatewayWebhook handles DGateway webhook events for African market payments.
type DGatewayWebhook struct {
	DB            *gorm.DB
	Credits       *credits.Service
	WebhookSecret string
}

type dgatewayEvent struct {
	Type      string `json:"type"`
	PaymentID string `json:"payment_id"`
	Status    string `json:"status"`
	Amount    int    `json:"amount"`
	Currency  string `json:"currency"`
	Metadata  struct {
		UserID      uint `json:"user_id"`
		CreditCount int  `json:"credit_count"`
	} `json:"metadata"`
}

// Handle processes incoming DGateway webhook events.
func (h *DGatewayWebhook) Handle(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	// Verify webhook signature
	signature := c.GetHeader("X-DGateway-Signature")
	if !verifyDGatewaySignature(body, signature, h.WebhookSecret) {
		log.Println("DGateway webhook: invalid signature")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	var event dgatewayEvent
	if err := json.Unmarshal(body, &event); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	log.Printf("DGateway webhook: %s (payment: %s, status: %s)", event.Type, event.PaymentID, event.Status)

	if event.Type == "payment.completed" && event.Status == "completed" {
		h.handlePaymentCompleted(event)
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

func (h *DGatewayWebhook) handlePaymentCompleted(event dgatewayEvent) {
	userID := event.Metadata.UserID
	creditCount := event.Metadata.CreditCount

	if userID == 0 || creditCount == 0 {
		log.Printf("DGateway: missing user_id or credit_count in metadata")
		return
	}

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		log.Printf("DGateway: user %d not found", userID)
		return
	}

	_, err := h.Credits.Add(userID, creditCount, models.CreditEventPurchase,
		fmt.Sprintf("DGateway credit purchase: %d credits (%s %d)",
			creditCount, event.Currency, event.Amount))
	if err != nil {
		log.Printf("DGateway: failed to add credits for user %d: %v", userID, err)
		return
	}

	log.Printf("DGateway: added %d credits to user %d", creditCount, userID)
}

func verifyDGatewaySignature(body []byte, signature, secret string) bool {
	if secret == "" || signature == "" {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expected := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expected), []byte(signature))
}

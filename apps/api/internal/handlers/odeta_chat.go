package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/ai"
	aiservice "odeta/apps/api/internal/services/ai"
	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/credits"
)

// OdetaChatHandler handles the Odeta AI chat with credit management.
type OdetaChatHandler struct {
	DB      *gorm.DB
	AI      *ai.AI
	Credits *credits.Service
}

type odetaChatRequest struct {
	ProjectID   interface{}  `json:"project_id" binding:"required"`
	Messages    []ai.Message `json:"messages" binding:"required"`
	MaxTokens   int          `json:"max_tokens"`
	Temperature float64      `json:"temperature"`
}

func (r *odetaChatRequest) GetProjectID() uint {
	switch v := r.ProjectID.(type) {
	case float64:
		return uint(v)
	case string:
		var id uint
		fmt.Sscanf(v, "%d", &id)
		return id
	default:
		return 0
	}
}

// Chat handles streaming AI chat with credit checks and conversation persistence.
func (h *OdetaChatHandler) Chat(c *gin.Context) {
	if h.AI == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "AI_UNAVAILABLE", "message": "AI service is not configured"},
		})
		return
	}

	userID := c.GetUint("user_id")

	var req odetaChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	// Verify project belongs to user
	var project models.Project
	if err := h.DB.Where("id = ? AND user_id = ?", req.GetProjectID(), userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"},
		})
		return
	}

	// Check credits (1 per message)
	const creditCost = 1
	result, err := h.Credits.Check(userID, creditCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "INTERNAL_ERROR", "message": "Credit check failed"},
		})
		return
	}
	if !result.HasEnough {
		c.JSON(http.StatusPaymentRequired, gin.H{
			"error": gin.H{
				"code":    "INSUFFICIENT_CREDITS",
				"message": fmt.Sprintf("You need %d credit but have %d remaining", creditCost, result.Balance),
				"balance": result.Balance,
			},
		})
		return
	}

	// Load conversation history from DB
	var history []models.Conversation
	h.DB.Where("project_id = ?", req.GetProjectID()).Order("created_at asc").Find(&history)

	// Build messages with system prompt + history + new messages
	messages := []ai.Message{
		{Role: "system", Content: aiservice.OdetaSystemPrompt},
	}
	for _, conv := range history {
		role := strings.ToLower(conv.Role)
		if role == "user" || role == "assistant" {
			messages = append(messages, ai.Message{Role: role, Content: conv.Content})
		}
	}
	messages = append(messages, req.Messages...)

	// Save user message to DB
	lastUserMsg := ""
	for i := len(req.Messages) - 1; i >= 0; i-- {
		if req.Messages[i].Role == "user" {
			lastUserMsg = req.Messages[i].Content
			break
		}
	}
	if lastUserMsg != "" {
		userConv := models.Conversation{
			ProjectId: req.GetProjectID(),
			Role:      models.ConversationRoleUser,
			Content:   lastUserMsg,
			Phase:     models.ConversationPhaseDiscovery,
		}
		h.DB.Create(&userConv)
	}

	// Stream SSE response
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	var fullResponse strings.Builder

	streamErr := h.AI.Stream(c.Request.Context(), ai.CompletionRequest{
		Messages:    messages,
		MaxTokens:   req.MaxTokens,
		Temperature: req.Temperature,
	}, func(chunk string) error {
		fullResponse.WriteString(chunk)
		c.SSEvent("message", chunk)
		c.Writer.Flush()
		return nil
	})

	if streamErr != nil {
		c.SSEvent("error", fmt.Sprintf("Stream error: %v", streamErr))
		c.Writer.Flush()
		return
	}

	// Save AI response to DB
	pid := req.GetProjectID()
	projectIDPtr := &pid
	aiConv := models.Conversation{
		ProjectId:   req.GetProjectID(),
		Role:        models.ConversationRoleAssistant,
		Content:     fullResponse.String(),
		Phase:       models.ConversationPhaseDiscovery,
		CreditsUsed: creditCost,
	}
	h.DB.Create(&aiConv)

	// Deduct credit after successful stream
	newBalance, err := h.Credits.Deduct(userID, creditCost, models.CreditEventSpentMessage, "AI chat message", projectIDPtr)
	if err != nil {
		log.Printf("Warning: failed to deduct credit for user %d: %v", userID, err)
	}

	// Send final events
	c.SSEvent("credits", fmt.Sprintf(`{"used":%d,"remaining":%d}`, creditCost, newBalance))
	c.Writer.Flush()
	c.SSEvent("done", "[DONE]")
	c.Writer.Flush()
}

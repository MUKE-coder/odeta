package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/ai"
	aiservice "odeta/apps/api/internal/services/ai"
	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/credits"
	"odeta/apps/api/internal/services/executor"
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
	ModelID     string       `json:"model_id"`
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

// Chat handles AI chat — returns complete JSON response (no SSE streaming).
// This avoids HTTP/2 protocol errors with reverse proxies.
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

	// Check credits
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

	// Load conversation history
	var history []models.Conversation
	h.DB.Where("project_id = ?", req.GetProjectID()).Order("created_at asc").Find(&history)

	// Build messages: system prompt + history + new
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

	// Save user message
	lastUserMsg := ""
	for i := len(req.Messages) - 1; i >= 0; i-- {
		if req.Messages[i].Role == "user" {
			lastUserMsg = req.Messages[i].Content
			break
		}
	}
	if lastUserMsg != "" {
		h.DB.Create(&models.Conversation{
			ProjectId: req.GetProjectID(),
			Role:      models.ConversationRoleUser,
			Content:   lastUserMsg,
			Phase:     models.ConversationPhaseDiscovery,
		})
	}

	// Resolve model — default to Claude Sonnet
	modelID := req.ModelID
	if modelID == "" {
		modelID = "anthropic/claude-sonnet-4-5"
	}

	// Call AI — non-streaming, get complete response
	maxTokens := req.MaxTokens
	if maxTokens == 0 || maxTokens < 16000 {
		maxTokens = 16000
	}

	resp, aiErr := h.AI.CompleteWithModel(c.Request.Context(), modelID, ai.CompletionRequest{
		Messages:    messages,
		MaxTokens:   maxTokens,
		Temperature: req.Temperature,
	})

	if aiErr != nil {
		log.Printf("[Chat] AI error for project %d: %v", req.GetProjectID(), aiErr)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "AI_ERROR", "message": "AI generation failed: " + aiErr.Error()},
		})
		return
	}

	aiText := resp.Content

	// Save AI response
	pid := req.GetProjectID()
	projectIDPtr := &pid
	h.DB.Create(&models.Conversation{
		ProjectId:   pid,
		Role:        models.ConversationRoleAssistant,
		Content:     aiText,
		Phase:       models.ConversationPhaseDiscovery,
		CreditsUsed: creditCost,
	})

	// Deduct credit
	newBalance, err := h.Credits.Deduct(userID, creditCost, models.CreditEventSpentMessage, "AI chat message", projectIDPtr)
	if err != nil {
		log.Printf("Warning: failed to deduct credit for user %d: %v", userID, err)
	}

	// Extract and save files
	files := executor.ExtractFiles(aiText)
	savedFiles := []string{}

	if len(files) > 0 {
		projectDir := getProjectDir(fmt.Sprintf("%d", pid))
		for _, f := range files {
			fullPath := filepath.Join(projectDir, f.Path)
			dir := filepath.Dir(fullPath)
			if err := os.MkdirAll(dir, 0755); err != nil {
				continue
			}
			if err := os.WriteFile(fullPath, []byte(f.Content), 0644); err != nil {
				continue
			}
			savedFiles = append(savedFiles, f.Path)
		}
		log.Printf("[Project %d] Saved %d files to disk", pid, len(savedFiles))

		if len(savedFiles) > 0 {
			h.DB.Model(&project).Update("status", "BUILT")
		}
	}

	// Return complete response as JSON
	c.JSON(http.StatusOK, gin.H{
		"content":          aiText,
		"files":            savedFiles,
		"credits_used":     creditCost,
		"credits_remaining": newBalance,
		"model":            modelID,
	})
}

func getProjectDir(projectID string) string {
	base := os.Getenv("PROJECTS_DIR")
	if base == "" {
		base = "/tmp/odeta-projects"
	}
	return filepath.Join(base, projectID)
}

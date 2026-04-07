package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

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
		h.DB.Create(&models.Conversation{
			ProjectId: req.GetProjectID(),
			Role:      models.ConversationRoleUser,
			Content:   lastUserMsg,
			Phase:     models.ConversationPhaseDiscovery,
		})
	}

	// Resolve model: enforce free tier limits
	modelID := req.ModelID
	var user models.User
	h.DB.Select("plan").First(&user, userID)
	if user.Plan == "free" || user.Plan == "" {
		if !strings.HasPrefix(modelID, "google/") {
			modelID = "google/gemini-2.0-flash"
		}
	}

	// Stream SSE response
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Header("X-Content-Type-Options", "nosniff")

	// Keepalive to prevent proxy timeouts
	keepaliveDone := make(chan struct{})
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				c.Writer.WriteString(": keepalive\n\n")
				c.Writer.Flush()
			case <-keepaliveDone:
				return
			}
		}
	}()
	defer close(keepaliveDone)

	var fullResponse strings.Builder

	maxTokens := req.MaxTokens
	if maxTokens == 0 || maxTokens < 16000 {
		maxTokens = 16000 // large enough for full file generation
	}

	streamErr := h.AI.StreamWithModel(c.Request.Context(), modelID, ai.CompletionRequest{
		Messages:    messages,
		MaxTokens:   maxTokens,
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
	h.DB.Create(&models.Conversation{
		ProjectId:   pid,
		Role:        models.ConversationRoleAssistant,
		Content:     fullResponse.String(),
		Phase:       models.ConversationPhaseDiscovery,
		CreditsUsed: creditCost,
	})

	// Deduct credit
	newBalance, err := h.Credits.Deduct(userID, creditCost, models.CreditEventSpentMessage, "AI chat message", projectIDPtr)
	if err != nil {
		log.Printf("Warning: failed to deduct credit for user %d: %v", userID, err)
	}

	c.SSEvent("credits", fmt.Sprintf(`{"used":%d,"remaining":%d}`, creditCost, newBalance))
	c.Writer.Flush()

	// ── Extract and save files from AI response ──
	aiText := fullResponse.String()
	files := executor.ExtractFiles(aiText)

	if len(files) > 0 {
		projectDir := getProjectDir(fmt.Sprintf("%d", pid))
		savedCount := 0

		for _, f := range files {
			// Emit file_write event to frontend
			c.SSEvent("file_write", gin.H{"path": f.Path, "content": f.Content})
			c.Writer.Flush()

			// Save file to disk
			fullPath := filepath.Join(projectDir, f.Path)
			dir := filepath.Dir(fullPath)
			if err := os.MkdirAll(dir, 0755); err != nil {
				log.Printf("[Project %d] Failed to create dir %s: %v", pid, dir, err)
				continue
			}
			if err := os.WriteFile(fullPath, []byte(f.Content), 0644); err != nil {
				log.Printf("[Project %d] Failed to write %s: %v", pid, f.Path, err)
				continue
			}
			savedCount++
		}

		log.Printf("[Project %d] Saved %d/%d files to %s", pid, savedCount, len(files), projectDir)

		// Update project status
		h.DB.Model(&project).Update("status", "BUILT")

		c.SSEvent("build_complete", gin.H{
			"files_count":      savedCount,
			"credits_remaining": newBalance,
		})
		c.Writer.Flush()
	}

	c.SSEvent("done", "[DONE]")
	c.Writer.Flush()
}

func getProjectDir(projectID string) string {
	base := os.Getenv("PROJECTS_DIR")
	if base == "" {
		base = "/tmp/odeta-projects"
	}
	return filepath.Join(base, projectID)
}

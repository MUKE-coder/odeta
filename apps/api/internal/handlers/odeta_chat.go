package handlers

import (
	"fmt"
	"log"
	"net/http"
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
		userConv := models.Conversation{
			ProjectId: req.GetProjectID(),
			Role:      models.ConversationRoleUser,
			Content:   lastUserMsg,
			Phase:     models.ConversationPhaseDiscovery,
		}
		h.DB.Create(&userConv)
	}

	// Resolve model: enforce free tier limits
	modelID := req.ModelID
	var user models.User
	h.DB.Select("plan").First(&user, userID)
	if user.Plan == "free" || user.Plan == "" {
		// Free users can only use google/* models
		if !strings.HasPrefix(modelID, "google/") {
			modelID = "google/gemini-2.0-flash"
		}
	}
	if modelID == "" {
		modelID = "" // use default from AI service config
	}

	// Stream SSE response
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Header("X-Content-Type-Options", "nosniff")

	// Keepalive — prevent proxy/client timeouts during long operations
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
	if maxTokens == 0 || maxTokens < 4096 {
		maxTokens = 4096 // ensure plan responses aren't truncated
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
	aiConv := models.Conversation{
		ProjectId:   req.GetProjectID(),
		Role:        models.ConversationRoleAssistant,
		Content:     fullResponse.String(),
		Phase:       models.ConversationPhaseDiscovery,
		CreditsUsed: creditCost,
	}
	h.DB.Create(&aiConv)

	// Deduct credit for the message
	newBalance, err := h.Credits.Deduct(userID, creditCost, models.CreditEventSpentMessage, "AI chat message", projectIDPtr)
	if err != nil {
		log.Printf("Warning: failed to deduct credit for user %d: %v", userID, err)
	}

	c.SSEvent("credits", fmt.Sprintf(`{"used":%d,"remaining":%d}`, creditCost, newBalance))
	c.Writer.Flush()

	// ── Emit file blocks for WebContainer to write ──
	aiText := fullResponse.String()
	extractedFiles := executor.ExtractFiles(aiText)
	for _, f := range extractedFiles {
		c.SSEvent("file_write", gin.H{"path": f.Path, "content": f.Content})
		c.Writer.Flush()
	}
	if len(extractedFiles) > 0 {
		log.Printf("[Project %d] Emitted %d file_write events", req.GetProjectID(), len(extractedFiles))
	}

	// ── Extract commands for execution ──
	commands := executor.ExtractAllCommands(aiText)
	projectIDStr := fmt.Sprintf("%d", req.GetProjectID())

	log.Printf("[Project %s] AI response length: %d chars, found %d executable commands", projectIDStr, len(aiText), len(commands))
	if len(commands) > 0 {
		for i, cmd := range commands {
			log.Printf("[Project %s] Command %d: %s", projectIDStr, i, cmd.Command)
		}
	}

	if len(commands) > 0 {
		projectDir, dirErr := executor.EnsureProjectDir(projectIDStr)
		if dirErr != nil {
			log.Printf("[Project %s] Failed to create project dir: %v", projectIDStr, dirErr)
		} else {
			workDir := projectDir
			totalCmds := len(commands)
			completedCmds := 0

			for _, cmd := range commands {
				if !executor.IsSafeCommand(cmd.Command) {
					log.Printf("[Project %s] Blocked unsafe command: %s", projectIDStr, cmd.Command)
					continue
				}

				log.Printf("[Project %s] Executing: %s", projectIDStr, cmd.Command)

				c.SSEvent("command_start", gin.H{
					"label":   cmd.Label,
					"command": cmd.Command,
					"index":   completedCmds,
					"total":   totalCmds,
				})
				c.Writer.Flush()

				execResult, execErr := executor.RunCommand(cmd.Command, workDir, func(line string, isStderr bool) {
					evtType := "command_output"
					if isStderr {
						evtType = "command_error_line"
					}
					c.SSEvent(evtType, gin.H{"line": line})
					c.Writer.Flush()
				})

				if execErr != nil || (execResult != nil && execResult.ExitCode != 0) {
					errMsg := "Command failed"
					if execResult != nil && execResult.Error != "" {
						errMsg = execResult.Error
					} else if execErr != nil {
						errMsg = execErr.Error()
					}
					log.Printf("[Project %s] Failed: %s — %s", projectIDStr, cmd.Command, errMsg)
					c.SSEvent("command_failed", gin.H{
						"label": cmd.Label, "command": cmd.Command, "error": errMsg,
					})
					c.Writer.Flush()
				} else {
					c.SSEvent("command_done", gin.H{
						"label": cmd.Label, "command": cmd.Command,
					})
					c.Writer.Flush()

					if strings.Contains(cmd.Command, "shadcn@latest add https://") {
						h.Credits.Deduct(userID, 2, models.CreditEventSpentCommand, "Installed: "+cmd.Label, projectIDPtr)
					}
				}

				completedCmds++

				// After create next-app, switch to the project subdirectory
				if strings.Contains(cmd.Command, "create next-app") {
					workDir = executor.FindNextjsDir(workDir)
					log.Printf("[Project %s] WorkDir → %s", projectIDStr, workDir)
				}
			}

			h.DB.Model(&project).Update("status", "BUILDING")

			// Send build complete event
			bal, _ := h.Credits.Balance(userID)
			c.SSEvent("build_complete", gin.H{
				"completed":         completedCmds,
				"total":             totalCmds,
				"credits_remaining": bal,
			})
			c.Writer.Flush()
		}
	}

	c.SSEvent("done", "[DONE]")
	c.Writer.Flush()
}

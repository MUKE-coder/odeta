package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	"odeta/apps/api/internal/services/sandbox"
)

// RunProjectHandler handles running a generated project in a Docker sandbox.
type RunProjectHandler struct {
	DB     *gorm.DB
	Docker *sandbox.DockerManager
}

// Run starts the project in a Docker container and streams the output.
func (h *RunProjectHandler) Run(c *gin.Context) {
	if h.Docker == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "DOCKER_UNAVAILABLE", "message": "Docker is not available on this server"},
		})
		return
	}

	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	// Verify ownership
	var project models.Project
	if err := h.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"},
		})
		return
	}

	// Check project has files
	projectDir := filepath.Join(getProjectsBaseDir(), projectID)
	if _, err := os.Stat(projectDir); os.IsNotExist(err) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "NO_FILES", "message": "No project files found. Generate the project first."},
		})
		return
	}

	log.Printf("[Run] Starting project %s in Docker sandbox", projectID)

	// Create or reuse sandbox
	sb, err := h.Docker.GetOrCreate(projectID)
	if err != nil {
		log.Printf("[Run] Failed to create sandbox for project %s: %v", projectID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "SANDBOX_ERROR", "message": "Failed to start sandbox: " + err.Error()},
		})
		return
	}

	// Stream output as NDJSON
	c.Header("Content-Type", "application/x-ndjson")
	c.Header("Cache-Control", "no-cache")
	c.Header("X-Accel-Buffering", "no")
	c.Status(http.StatusOK)

	writeLine := func(eventType string, data interface{}) {
		line, _ := json.Marshal(map[string]interface{}{
			"type": eventType,
			"data": data,
		})
		c.Writer.Write(line)
		c.Writer.WriteString("\n")
		c.Writer.Flush()
	}

	writeLine("status", "Copying project files...")

	// Run the project — copies files, installs deps, starts dev server
	err = sb.RunProject(projectDir, func(line string, isErr bool) {
		eventType := "log"
		if isErr {
			eventType = "error"
		}
		writeLine(eventType, line)
	})

	if err != nil {
		log.Printf("[Run] Project %s failed: %v", projectID, err)
		writeLine("error", fmt.Sprintf("Failed: %v", err))
		return
	}

	previewURL := sb.GetPreviewURL()
	log.Printf("[Run] Project %s running at %s", projectID, previewURL)

	writeLine("ready", map[string]string{
		"preview_url": previewURL,
		"status":      "running",
	})

	// Update project status
	h.DB.Model(&project).Updates(map[string]interface{}{
		"status": "RUNNING",
	})
}

// Status returns the current status of a project's sandbox.
func (h *RunProjectHandler) Status(c *gin.Context) {
	if h.Docker == nil {
		c.JSON(http.StatusOK, gin.H{"status": "unavailable"})
		return
	}

	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	var project models.Project
	if err := h.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	// Check if sandbox exists and is running
	sb, err := h.Docker.GetOrCreate(projectID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "stopped"})
		return
	}

	status := sb.GetStatus()
	result := gin.H{"status": status}
	if status == "running" {
		result["preview_url"] = sb.GetPreviewURL()
	}

	c.JSON(http.StatusOK, result)
}

// Stop stops a project's sandbox.
func (h *RunProjectHandler) Stop(c *gin.Context) {
	if h.Docker == nil {
		c.JSON(http.StatusOK, gin.H{"status": "stopped"})
		return
	}

	projectID := c.Param("id")
	h.Docker.Destroy(projectID)
	c.JSON(http.StatusOK, gin.H{"status": "stopped"})
}

func getProjectsBaseDir() string {
	base := os.Getenv("PROJECTS_DIR")
	if base == "" {
		base = "/tmp/odeta-projects"
	}
	return base
}

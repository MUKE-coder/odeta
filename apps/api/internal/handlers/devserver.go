package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"

	"odeta/apps/api/internal/services/devserver"
)

// DevServerHandler handles dev server management endpoints.
type DevServerHandler struct {
	Manager *devserver.Manager
}

// GetStatus returns the current status of a project's dev server.
func (h *DevServerHandler) GetStatus(c *gin.Context) {
	projectID := c.Param("id")

	server := h.Manager.GetServer(projectID)
	if server == nil {
		c.JSON(http.StatusOK, gin.H{
			"data": gin.H{"status": "stopped", "port": 0},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"status":     server.Status,
			"port":       server.Port,
			"started_at": server.StartedAt,
		},
	})
}

// Start starts the dev server for a project.
func (h *DevServerHandler) Start(c *gin.Context) {
	projectID := c.Param("id")

	server, err := h.Manager.Start(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "SERVER_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"status": server.Status,
			"port":   server.Port,
		},
		"message": "Dev server starting",
	})
}

// Stop stops the dev server for a project.
func (h *DevServerHandler) Stop(c *gin.Context) {
	projectID := c.Param("id")
	h.Manager.Stop(projectID)

	c.JSON(http.StatusOK, gin.H{"message": "Dev server stopped"})
}

// Restart restarts the dev server for a project.
func (h *DevServerHandler) Restart(c *gin.Context) {
	projectID := c.Param("id")

	server, err := h.Manager.Restart(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "SERVER_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"status": server.Status,
			"port":   server.Port,
		},
		"message": "Dev server restarting",
	})
}

// RunCommand executes a command in the project directory.
func (h *DevServerHandler) RunCommand(c *gin.Context) {
	projectID := c.Param("id")

	var req struct {
		Command string `json:"command" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	output, err := h.Manager.RunCommand(projectID, req.Command)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"data": gin.H{"output": output, "error": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"output": output},
	})
}

// StreamLogs streams dev server logs via SSE.
func (h *DevServerHandler) StreamLogs(c *gin.Context) {
	projectID := c.Param("id")

	server := h.Manager.GetServer(projectID)
	if server == nil || server.LogCh == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": gin.H{"code": "NOT_FOUND", "message": "No server running"},
		})
		return
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	c.Stream(func(w io.Writer) bool {
		select {
		case line, ok := <-server.LogCh:
			if !ok {
				return false
			}
			c.SSEvent("log", line)
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

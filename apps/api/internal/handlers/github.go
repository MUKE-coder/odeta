package handlers

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
	ghservice "odeta/apps/api/internal/services/github"
)

// GitHubHandler handles GitHub integration endpoints.
type GitHubHandler struct {
	DB     *gorm.DB
	GitHub *ghservice.Service
}

type createRepoRequest struct {
	RepoName string `json:"repo_name" binding:"required"`
	Private  bool   `json:"private"`
}

// CreateAndPush creates a GitHub repo and pushes the project files.
func (h *GitHubHandler) CreateAndPush(c *gin.Context) {
	if h.GitHub == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": gin.H{"code": "GITHUB_UNAVAILABLE", "message": "GitHub integration is not configured"},
		})
		return
	}

	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	// Verify project ownership
	var project models.Project
	if err := h.DB.Where("id = ? AND user_id = ?", projectID, userID).First(&project).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"}})
		return
	}

	// Get user's GitHub token
	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "User not found"}})
		return
	}

	if user.GithubToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{"code": "NO_GITHUB_TOKEN", "message": "Connect your GitHub account first"},
		})
		return
	}

	var req createRepoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{
			"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()},
		})
		return
	}

	// Create the repo
	repoURL, err := h.GitHub.CreateRepo(c.Request.Context(), user.GithubToken, req.RepoName, req.Private)
	if err != nil {
		log.Printf("GitHub: failed to create repo: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": gin.H{"code": "GITHUB_ERROR", "message": "Failed to create repository: " + err.Error()},
		})
		return
	}

	// Read project files and push
	projectDir := filepath.Join(projectsBaseDir, projectID)
	files := make(map[string]string)

	if _, err := os.Stat(projectDir); err == nil {
		filepath.Walk(projectDir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}
			// Skip large/binary files
			if info.Size() > 1024*1024 { // 1MB
				return nil
			}
			name := info.Name()
			if name == "node_modules" || name == ".next" || name == ".git" {
				return filepath.SkipDir
			}

			relPath, _ := filepath.Rel(projectDir, path)
			content, err := os.ReadFile(path)
			if err != nil {
				return nil
			}
			files[relPath] = string(content)
			return nil
		})
	}

	if len(files) > 0 {
		// Extract owner from GitHub username
		owner := extractOwner(repoURL)
		if owner != "" {
			err = h.GitHub.PushFiles(
				c.Request.Context(),
				user.GithubToken,
				owner,
				req.RepoName,
				"🚀 Initial commit from Odeta",
				files,
			)
			if err != nil {
				log.Printf("GitHub: failed to push files: %v", err)
				// Repo was created but push failed — still return URL
			}
		}
	}

	// Save repo URL to project
	h.DB.Model(&project).Update("github_repo_url", repoURL)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"repo_url":    repoURL,
			"files_pushed": len(files),
		},
		"message": "Repository created and project pushed",
	})
}

func extractOwner(repoURL string) string {
	// https://github.com/owner/repo -> owner
	parts := strings.Split(strings.TrimPrefix(repoURL, "https://github.com/"), "/")
	if len(parts) >= 1 {
		return parts[0]
	}
	return ""
}

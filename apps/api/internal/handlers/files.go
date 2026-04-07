package handlers

import (
	"archive/zip"
	"bytes"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"odeta/apps/api/internal/models"
)

const projectsBaseDir = "/tmp/odeta-projects"

// FileHandler handles project file operations.
type FileHandler struct {
	DB *gorm.DB
}

// FileNode represents a file or folder in the project tree.
type FileNode struct {
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	Type     string     `json:"type"` // "file" or "folder"
	Size     int64      `json:"size,omitempty"`
	Children []FileNode `json:"children,omitempty"`
}

// ListFiles returns the file tree for a project.
func (h *FileHandler) ListFiles(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	if !h.verifyOwnership(projectID, userID) {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"}})
		return
	}

	projectDir := filepath.Join(projectsBaseDir, projectID)
	if _, err := os.Stat(projectDir); os.IsNotExist(err) {
		c.JSON(http.StatusOK, gin.H{"data": []FileNode{}})
		return
	}

	tree := buildFileTree(projectDir, "")
	c.JSON(http.StatusOK, gin.H{"data": tree})
}

// GetFileContent returns the content of a single file.
func (h *FileHandler) GetFileContent(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetUint("user_id")
	filePath := c.Query("path")

	if !h.verifyOwnership(projectID, userID) {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"}})
		return
	}

	if strings.Contains(filePath, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_PATH", "message": "Invalid file path"}})
		return
	}

	fullPath := filepath.Join(projectsBaseDir, projectID, filePath)
	content, err := os.ReadFile(fullPath)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "File not found"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"path":    filePath,
			"content": string(content),
			"size":    len(content),
		},
	})
}

// SaveFileContent creates or updates a file.
func (h *FileHandler) SaveFileContent(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	if !h.verifyOwnership(projectID, userID) {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"}})
		return
	}

	var req struct {
		Path    string `json:"path" binding:"required"`
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()}})
		return
	}

	if strings.Contains(req.Path, "..") {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_PATH", "message": "Invalid file path"}})
		return
	}

	fullPath := filepath.Join(projectsBaseDir, projectID, req.Path)

	// Ensure parent directory exists
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to create directory"}})
		return
	}

	if err := os.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to save file"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{"path": req.Path, "size": len(req.Content)},
		"message": "File saved",
	})
}

// DeleteFile removes a file from the project.
func (h *FileHandler) DeleteFile(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetUint("user_id")
	filePath := c.Query("path")

	if !h.verifyOwnership(projectID, userID) {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"}})
		return
	}

	if strings.Contains(filePath, "..") || filePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "INVALID_PATH", "message": "Invalid file path"}})
		return
	}

	fullPath := filepath.Join(projectsBaseDir, projectID, filePath)
	if err := os.Remove(fullPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "File not found"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted"})
}

// DownloadProject streams the project as a ZIP file.
func (h *FileHandler) DownloadProject(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	if !h.verifyOwnership(projectID, userID) {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"}})
		return
	}

	projectDir := filepath.Join(projectsBaseDir, projectID)
	if _, err := os.Stat(projectDir); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "No project files found"}})
		return
	}

	buf := new(bytes.Buffer)
	w := zip.NewWriter(buf)

	skipDirs := map[string]bool{
		"node_modules": true, ".next": true, ".git": true,
		"__pycache__": true, ".cache": true, "dist": true,
	}

	filepath.Walk(projectDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			if skipDirs[info.Name()] {
				return filepath.SkipDir
			}
			return nil
		}

		relPath, _ := filepath.Rel(projectDir, path)
		f, err := w.Create(relPath)
		if err != nil {
			return nil
		}
		content, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		f.Write(content)
		return nil
	})
	w.Close()

	// Get project name for filename
	var project models.Project
	h.DB.Select("name").First(&project, projectID)
	filename := "project"
	if project.Name != "" {
		filename = strings.ToLower(strings.ReplaceAll(project.Name, " ", "-"))
	}

	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.zip"`, filename))
	c.Data(http.StatusOK, "application/zip", buf.Bytes())
}

// GetAllFiles returns a flat map of path→content for all project files (for StackBlitz embed).
func (h *FileHandler) GetAllFiles(c *gin.Context) {
	projectID := c.Param("id")
	userID := c.GetUint("user_id")

	if !h.verifyOwnership(projectID, userID) {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Project not found"}})
		return
	}

	projectDir := filepath.Join(projectsBaseDir, projectID)
	if _, err := os.Stat(projectDir); os.IsNotExist(err) {
		c.JSON(http.StatusOK, gin.H{"files": map[string]string{}})
		return
	}

	files := map[string]string{}
	skipDirs := map[string]bool{"node_modules": true, ".next": true, ".git": true}

	filepath.Walk(projectDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if info.IsDir() {
			if skipDirs[info.Name()] {
				return filepath.SkipDir
			}
			return nil
		}
		if info.Size() > 500*1024 {
			return nil
		}
		rel, _ := filepath.Rel(projectDir, path)
		data, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		files[rel] = string(data)
		return nil
	})

	c.JSON(http.StatusOK, gin.H{"files": files})
}

func (h *FileHandler) verifyOwnership(projectID string, userID uint) bool {
	var count int64
	h.DB.Model(&models.Project{}).Where("id = ? AND user_id = ?", projectID, userID).Count(&count)
	return count > 0
}

func buildFileTree(dir string, relativeTo string) []FileNode {
	var nodes []FileNode

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nodes
	}

	skipDirs := map[string]bool{
		"node_modules": true, ".next": true, ".git": true,
		"__pycache__": true, ".cache": true,
	}

	for _, entry := range entries {
		name := entry.Name()
		if strings.HasPrefix(name, ".") && name != ".env.example" {
			continue
		}

		path := name
		if relativeTo != "" {
			path = relativeTo + "/" + name
		}

		if entry.IsDir() {
			if skipDirs[name] {
				continue
			}
			children := buildFileTree(filepath.Join(dir, name), path)
			nodes = append(nodes, FileNode{
				Name:     name,
				Path:     path,
				Type:     "folder",
				Children: children,
			})
		} else {
			info, _ := entry.Info()
			size := int64(0)
			if info != nil {
				size = info.Size()
			}
			nodes = append(nodes, FileNode{
				Name: name,
				Path: path,
				Type: "file",
				Size: size,
			})
		}
	}

	return nodes
}

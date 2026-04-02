package sandbox

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

const e2bAPI = "https://api.e2b.dev/v1"

// Sandbox represents an E2B cloud sandbox instance.
type Sandbox struct {
	ID     string `json:"sandboxID"`
	apiKey string
	client *http.Client
}

// Manager manages E2B sandbox lifecycle.
type Manager struct {
	apiKey     string
	templateID string
	client     *http.Client
}

// NewManager creates a new E2B sandbox manager.
func NewManager(apiKey, templateID string) *Manager {
	if templateID == "" {
		templateID = "base" // default E2B template with Node.js
	}
	return &Manager{
		apiKey:     apiKey,
		templateID: templateID,
		client:     &http.Client{Timeout: 60 * time.Second},
	}
}

// NewManagerFromEnv creates a manager using environment variables.
func NewManagerFromEnv() *Manager {
	apiKey := os.Getenv("E2B_API_KEY")
	templateID := os.Getenv("E2B_TEMPLATE_ID")
	if apiKey == "" {
		return nil
	}
	return NewManager(apiKey, templateID)
}

// Create spins up a new E2B sandbox.
func (m *Manager) Create() (*Sandbox, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"templateID": m.templateID,
		"timeout":    3600, // 1 hour
	})

	req, _ := http.NewRequest("POST", e2bAPI+"/sandboxes", bytes.NewBuffer(body))
	req.Header.Set("X-API-Key", m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("e2b create sandbox: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("e2b create sandbox (%d): %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		SandboxID string `json:"sandboxID"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("e2b decode response: %w", err)
	}

	log.Printf("[E2B] Created sandbox: %s", result.SandboxID)

	return &Sandbox{
		ID:     result.SandboxID,
		apiKey: m.apiKey,
		client: &http.Client{Timeout: 300 * time.Second},
	}, nil
}

// RunCommand executes a command in the sandbox and returns stdout.
func (s *Sandbox) RunCommand(command string, workDir string, onLine func(string, bool)) (int, error) {
	body, _ := json.Marshal(map[string]interface{}{
		"cmd": command,
		"cwd": workDir,
	})

	req, _ := http.NewRequest("POST",
		fmt.Sprintf("%s/sandboxes/%s/commands", e2bAPI, s.ID),
		bytes.NewBuffer(body))
	req.Header.Set("X-API-Key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return -1, fmt.Errorf("e2b run command: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return -1, fmt.Errorf("e2b command error (%d): %s", resp.StatusCode, string(respBody))
	}

	var result struct {
		ExitCode int    `json:"exitCode"`
		Stdout   string `json:"stdout"`
		Stderr   string `json:"stderr"`
	}
	json.NewDecoder(resp.Body).Decode(&result)

	// Emit stdout lines
	if onLine != nil && result.Stdout != "" {
		for _, line := range splitLines(result.Stdout) {
			if line != "" {
				onLine(line, false)
			}
		}
	}
	if onLine != nil && result.Stderr != "" {
		for _, line := range splitLines(result.Stderr) {
			if line != "" {
				onLine(line, true)
			}
		}
	}

	return result.ExitCode, nil
}

// WriteFile writes content to a file in the sandbox.
func (s *Sandbox) WriteFile(path, content string) error {
	body, _ := json.Marshal(map[string]string{
		"path":    path,
		"content": content,
	})

	req, _ := http.NewRequest("POST",
		fmt.Sprintf("%s/sandboxes/%s/filesystem", e2bAPI, s.ID),
		bytes.NewBuffer(body))
	req.Header.Set("X-API-Key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("e2b write file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("e2b write file (%d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

// ReadFile reads content from a file in the sandbox.
func (s *Sandbox) ReadFile(path string) (string, error) {
	req, _ := http.NewRequest("GET",
		fmt.Sprintf("%s/sandboxes/%s/filesystem?path=%s", e2bAPI, s.ID, path),
		nil)
	req.Header.Set("X-API-Key", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("e2b read file: %w", err)
	}
	defer resp.Body.Close()

	data, _ := io.ReadAll(resp.Body)
	return string(data), nil
}

// GetPreviewURL returns the public URL for a port running in the sandbox.
func (s *Sandbox) GetPreviewURL(port int) string {
	return fmt.Sprintf("https://%s-%d.e2b.dev", s.ID, port)
}

// Kill destroys the sandbox.
func (s *Sandbox) Kill() error {
	req, _ := http.NewRequest("DELETE",
		fmt.Sprintf("%s/sandboxes/%s", e2bAPI, s.ID),
		nil)
	req.Header.Set("X-API-Key", s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	resp.Body.Close()
	log.Printf("[E2B] Destroyed sandbox: %s", s.ID)
	return nil
}

func splitLines(s string) []string {
	var lines []string
	start := 0
	for i, c := range s {
		if c == '\n' {
			lines = append(lines, s[start:i])
			start = i + 1
		}
	}
	if start < len(s) {
		lines = append(lines, s[start:])
	}
	return lines
}

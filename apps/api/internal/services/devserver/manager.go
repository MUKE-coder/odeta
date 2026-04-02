package devserver

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"time"
)

// LogLine represents a single line of server output.
type LogLine struct {
	Content   string `json:"content"`
	Type      string `json:"type"` // log, error, warn, info, success
	Timestamp string `json:"timestamp"`
}

// DevServer represents a running dev server for a project.
type DevServer struct {
	ProjectID string    `json:"project_id"`
	Port      int       `json:"port"`
	Status    string    `json:"status"` // stopped, starting, running, error
	StartedAt time.Time `json:"started_at"`
	cmd       *exec.Cmd
	LogCh     chan LogLine
}

// Manager manages dev servers for multiple projects.
type Manager struct {
	servers  map[string]*DevServer
	mu       sync.RWMutex
	basePort int
}

// NewManager creates a new dev server manager.
func NewManager(basePort int) *Manager {
	return &Manager{
		servers:  make(map[string]*DevServer),
		basePort: basePort,
	}
}

// GetServer returns the current server for a project.
func (m *Manager) GetServer(projectID string) *DevServer {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.servers[projectID]
}

// Start launches a dev server for a project.
func (m *Manager) Start(projectID string) (*DevServer, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Kill existing server if running
	if existing, ok := m.servers[projectID]; ok && existing.cmd != nil && existing.cmd.Process != nil {
		existing.cmd.Process.Kill()
	}

	port := m.assignPort(projectID)
	projectDir := fmt.Sprintf("/tmp/odeta-projects/%s", projectID)

	cmd := exec.Command("pnpm", "dev", "--port", strconv.Itoa(port))
	cmd.Dir = projectDir

	logCh := make(chan LogLine, 500)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("stdout pipe: %w", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("stderr pipe: %w", err)
	}

	server := &DevServer{
		ProjectID: projectID,
		Port:      port,
		Status:    "starting",
		cmd:       cmd,
		LogCh:     logCh,
	}
	m.servers[projectID] = server

	if err := cmd.Start(); err != nil {
		server.Status = "error"
		return server, fmt.Errorf("starting dev server: %w", err)
	}

	go streamOutput(stdout, "log", logCh, server)
	go streamOutput(stderr, "error", logCh, server)

	go func() {
		cmd.Wait()
		server.Status = "stopped"
		close(logCh)
		log.Printf("Dev server for project %s stopped", projectID)
	}()

	return server, nil
}

// Stop stops a running dev server.
func (m *Manager) Stop(projectID string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if s, ok := m.servers[projectID]; ok && s.cmd != nil && s.cmd.Process != nil {
		s.cmd.Process.Kill()
		s.Status = "stopped"
	}
}

// Restart stops and restarts a dev server.
func (m *Manager) Restart(projectID string) (*DevServer, error) {
	m.Stop(projectID)
	time.Sleep(500 * time.Millisecond)
	return m.Start(projectID)
}

// RunCommand executes a command in the project directory and returns the output.
func (m *Manager) RunCommand(projectID, command string) (string, error) {
	projectDir := fmt.Sprintf("/tmp/odeta-projects/%s", projectID)

	parts := strings.Fields(command)
	if len(parts) == 0 {
		return "", fmt.Errorf("empty command")
	}

	cmd := exec.Command(parts[0], parts[1:]...)
	cmd.Dir = projectDir

	output, err := cmd.CombinedOutput()
	return string(output), err
}

func (m *Manager) assignPort(projectID string) int {
	// Simple hash-based port assignment
	hash := 0
	for _, c := range projectID {
		hash = hash*31 + int(c)
	}
	if hash < 0 {
		hash = -hash
	}
	return m.basePort + (hash % 100)
}

func streamOutput(r io.ReadCloser, logType string, ch chan LogLine, server *DevServer) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := scanner.Text()

		// Detect "ready" to mark server as running
		lower := strings.ToLower(line)
		if strings.Contains(lower, "ready") || strings.Contains(lower, "started server") {
			server.Status = "running"
			server.StartedAt = time.Now()
		}

		// Determine log type from content
		lt := logType
		if strings.Contains(lower, "error") {
			lt = "error"
		} else if strings.Contains(lower, "warn") {
			lt = "warn"
		} else if strings.Contains(lower, "ready") || strings.Contains(lower, "✓") {
			lt = "success"
		}

		select {
		case ch <- LogLine{
			Content:   line,
			Type:      lt,
			Timestamp: time.Now().Format("15:04:05"),
		}:
		default:
			// Channel full, drop oldest
		}
	}
}

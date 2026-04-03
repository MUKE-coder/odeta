package sandbox

import (
	"bufio"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"
	"time"
)

const (
	maxConcurrentSandboxes = 3
	sandboxTimeout         = 10 * time.Minute
	commandTimeout         = 5 * time.Minute
)

// DockerSandbox represents a running Docker container for a project.
type DockerSandbox struct {
	ProjectID   string
	ContainerID string
	Port        int
	WorkDir     string
	CreatedAt   time.Time
}

// DockerManager manages Docker sandbox lifecycle.
type DockerManager struct {
	mu        sync.RWMutex
	sandboxes map[string]*DockerSandbox
	nextPort  int
	image     string
}

// NewDockerManager creates a new Docker sandbox manager.
func NewDockerManager(image string) *DockerManager {
	if image == "" {
		image = "odeta-sandbox"
	}
	m := &DockerManager{
		sandboxes: make(map[string]*DockerSandbox),
		nextPort:  3100,
		image:     image,
	}
	// Start background cleanup goroutine
	go m.cleanupLoop()
	return m
}

// cleanupLoop runs every minute, killing sandboxes older than 10 minutes.
func (m *DockerManager) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		m.mu.Lock()
		for pid, sb := range m.sandboxes {
			if time.Since(sb.CreatedAt) > sandboxTimeout {
				log.Printf("[Docker] Auto-killing sandbox %s (exceeded %v timeout)", pid, sandboxTimeout)
				exec.Command("docker", "rm", "-f", sb.ContainerID).Run()
				delete(m.sandboxes, pid)
			}
		}
		m.mu.Unlock()
	}
}

// GetOrCreate returns an existing sandbox or creates a new one.
func (m *DockerManager) GetOrCreate(projectID string) (*DockerSandbox, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if existing sandbox is still running
	if sb, ok := m.sandboxes[projectID]; ok {
		out, _ := exec.Command("docker", "inspect", "-f", "{{.State.Running}}", sb.ContainerID).Output()
		if strings.TrimSpace(string(out)) == "true" {
			return sb, nil
		}
		exec.Command("docker", "rm", "-f", sb.ContainerID).Run()
		delete(m.sandboxes, projectID)
	}

	// Enforce concurrent sandbox limit
	activeCount := 0
	for _, sb := range m.sandboxes {
		out, _ := exec.Command("docker", "inspect", "-f", "{{.State.Running}}", sb.ContainerID).Output()
		if strings.TrimSpace(string(out)) == "true" {
			activeCount++
		}
	}
	if activeCount >= maxConcurrentSandboxes {
		// Kill the oldest sandbox to make room
		var oldest *DockerSandbox
		var oldestPID string
		for pid, sb := range m.sandboxes {
			if oldest == nil || sb.CreatedAt.Before(oldest.CreatedAt) {
				oldest = sb
				oldestPID = pid
			}
		}
		if oldest != nil {
			log.Printf("[Docker] Killing oldest sandbox %s to make room (limit: %d)", oldestPID, maxConcurrentSandboxes)
			exec.Command("docker", "rm", "-f", oldest.ContainerID).Run()
			delete(m.sandboxes, oldestPID)
		}
	}

	port := m.nextPort
	m.nextPort++
	name := fmt.Sprintf("odeta-%s", projectID)

	// Remove any existing container with this name
	exec.Command("docker", "rm", "-f", name).Run()

	// Cleanup old stopped/created sandbox containers
	exec.Command("sh", "-c", "docker ps -a --filter 'name=odeta-' --filter 'status=exited' -q | xargs -r docker rm -f").Run()
	exec.Command("sh", "-c", "docker ps -a --filter 'name=odeta-' --filter 'status=created' -q | xargs -r docker rm -f").Run()

	out, err := exec.Command("docker", "run", "-d",
		"--name", name,
		"-p", fmt.Sprintf("%d:3000", port),
		"-w", "/home/user",
		"--memory", "1g",
		"--cpus", "0.5",
		"--network", "bridge",
		"-e", "CI=true",
		"-e", "NEXT_TELEMETRY_DISABLED=1",
		"-e", "NPM_CONFIG_YES=true",
		"-e", "FORCE_COLOR=0",
		"-e", "npm_config_store=/tmp/cache/pnpm-store",
		m.image,
		"tail", "-f", "/dev/null",
	).CombinedOutput()

	if err != nil {
		return nil, fmt.Errorf("docker run failed: %s — output: %s", err, string(out))
	}

	containerID := strings.TrimSpace(string(out))
	log.Printf("[Docker] Created sandbox %s for project %s on port %d (active: %d/%d)",
		containerID[:12], projectID, port, activeCount+1, maxConcurrentSandboxes)

	sb := &DockerSandbox{
		ProjectID:   projectID,
		ContainerID: containerID,
		Port:        port,
		WorkDir:     "/home/user",
		CreatedAt:   time.Now(),
	}
	m.sandboxes[projectID] = sb

	// Schedule auto-kill after timeout
	go func() {
		time.Sleep(sandboxTimeout)
		m.Destroy(projectID)
	}()

	return sb, nil
}

// Destroy stops and removes a sandbox container.
func (m *DockerManager) Destroy(projectID string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if sb, ok := m.sandboxes[projectID]; ok {
		exec.Command("docker", "rm", "-f", sb.ContainerID).Run()
		delete(m.sandboxes, projectID)
		log.Printf("[Docker] Destroyed sandbox for project %s", projectID)
	}
}

// ActiveCount returns the number of running sandboxes.
func (m *DockerManager) ActiveCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.sandboxes)
}

// DockerLineCallback is called for each line of command output.
type DockerLineCallback func(line string, isErr bool)

// RunCommand executes a command inside the sandbox container with a timeout.
func (sb *DockerSandbox) RunCommand(command, workDir string, onLine DockerLineCallback) (int, error) {
	command = dockerNormalizeCommand(command)

	ctx, cancel := context.WithTimeout(context.Background(), commandTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "docker", "exec", "-w", workDir, sb.ContainerID, "sh", "-c", command)

	stdout, _ := cmd.StdoutPipe()
	stderr, _ := cmd.StderrPipe()

	if err := cmd.Start(); err != nil {
		return 1, fmt.Errorf("docker exec: %w", err)
	}

	stdoutDone := make(chan struct{})
	go func() {
		defer close(stdoutDone)
		dockerStreamLines(stdout, false, onLine)
	}()

	stderrDone := make(chan struct{})
	go func() {
		defer close(stderrDone)
		dockerStreamLines(stderr, true, onLine)
	}()

	<-stdoutDone
	<-stderrDone

	if err := cmd.Wait(); err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return 1, fmt.Errorf("command timed out after %v", commandTimeout)
		}
		if e, ok := err.(*exec.ExitError); ok {
			return e.ExitCode(), nil
		}
		return 1, err
	}
	return 0, nil
}

// GetPreviewURL returns the URL for the dev server running in the sandbox.
func (sb *DockerSandbox) GetPreviewURL() string {
	ip := os.Getenv("SERVER_IP")
	if ip == "" {
		ip = "localhost"
	}
	return fmt.Sprintf("http://%s:%d", ip, sb.Port)
}

// ListFiles returns project files from inside the container via docker exec.
func (sb *DockerSandbox) ListFiles() (map[string]string, error) {
	files := map[string]string{}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	out, err := exec.CommandContext(ctx, "docker", "exec", sb.ContainerID,
		"find", sb.WorkDir, "-type", "f",
		"-not", "-path", "*/node_modules/*",
		"-not", "-path", "*/.next/*",
		"-not", "-path", "*/.git/*",
		"-maxdepth", "10",
	).Output()
	if err != nil {
		return files, err
	}

	for _, filePath := range strings.Split(string(out), "\n") {
		filePath = strings.TrimSpace(filePath)
		if filePath == "" {
			continue
		}
		content, err := exec.CommandContext(ctx, "docker", "exec", sb.ContainerID, "cat", filePath).Output()
		if err != nil || len(content) > 500*1024 {
			continue
		}
		rel := strings.TrimPrefix(filePath, sb.WorkDir+"/")
		files[rel] = string(content)
	}
	return files, nil
}

func dockerNormalizeCommand(cmd string) string {
	cmd = strings.TrimSpace(cmd)
	if strings.HasPrefix(cmd, "pnpm create next-app") && !strings.Contains(cmd, "--yes") {
		cmd += " --yes"
	}
	if strings.Contains(cmd, "shadcn@latest init") {
		idx := strings.Index(cmd, "shadcn@latest init")
		cmd = cmd[:idx] + "shadcn@latest init --yes --defaults"
	}
	if strings.Contains(cmd, "shadcn@latest add") && !strings.Contains(cmd, "--yes") {
		cmd += " --yes"
	}
	return cmd
}

var dockerSuppressPatterns = []string{
	"would you like to install",
	"which style",
	"which color",
	"would you like to use css",
	"you can now run",
	"we suggest that you begin",
	"preflight checks",
	"verifying framework",
}

func dockerShouldSuppress(line string) bool {
	lower := strings.ToLower(line)
	for _, p := range dockerSuppressPatterns {
		if strings.Contains(lower, p) {
			return true
		}
	}
	return false
}

func dockerStreamLines(r io.ReadCloser, isErr bool, onLine DockerLineCallback) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line := scanner.Text()
		if !dockerShouldSuppress(line) && onLine != nil {
			onLine(line, isErr)
		}
	}
}
